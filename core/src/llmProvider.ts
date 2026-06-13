import { z } from "zod";
import type { ParsedGameState, ItemRecommendation, RecommendedItem, Strategy, RolePosition } from "./types.js";
import { minifyGameState } from "./stateMinifier.js";
import { getGamePhase } from "./stateMinifier.js";
import { ClaudeProvider } from "./providers/claudeProvider.js";
import { OpenAiProvider } from "./providers/openaiProvider.js";
import { GeminiProvider } from "./providers/geminiProvider.js";
import { Logger } from "./logger.js";
import { ddragon } from "./ddragonService.js";

export const SYSTEM_PROMPT = `You are an experienced League of Legends coach.
Analyze the game state and respond ONLY with a JSON object — no markdown, no code blocks, no extra text.
Use this exact format:
{
  "itemReasoning": "2-3 sentences explaining why the core items are a good choice right now",
  "situationalItems": [
    {"id": 3111, "name": "Mercurial Scimitar", "reason": "One specific sentence why this item is needed right now"}
  ],
  "strategy": {
    "winCondition": "early" or "mid" or "late",
    "summary": "1 sentence: when and how the player wins this game",
    "immediateAction": "1 sentence: what to do RIGHT NOW in-game, referencing their champion and current stats",
    "lateGamePlan": "1 sentence: how to close out the game with the final build",
    "laneMatchupAnalysis": "1-2 sentences: role-specific comparison — what the opponent/enemy duo is doing better or worse using the metrics that matter for this role",
    "counterPlay": "1 sentence: one concrete role-appropriate action to gain or stop losing the matchup right now"
  }
}

The "Core items" listed are mechanically optimal picks — always explain these in itemReasoning.
"situationalItems" is optional (use [] if nothing extra is needed). Add at most 2 items only when the game state genuinely warrants picks beyond the core list (e.g., 3+ CC enemies → QSS/Tenacity, fed AP carry → early MR, enemy heavy healing → Grievous Wounds). Never repeat items already in the core list.

Adjust analysis based on the player's role:
- UTILITY (Support): ignore CS entirely. Focus on vision score, assists, and whether the ADC is alive and ahead. A support death that lets the ADC get kills is a good trade. Counterplay is about engage, disengage, peel, or vision control — not farming.
- BOTTOM (ADC): CS lead/deficit matters most. Staying alive to deal sustained damage in fights. Laning phase is about CS and poking, not all-ins unless you are ahead.
- TOP: check if the champion is a known split-pusher (e.g. Tryndamere, Fiora, Jax, Camille). If so, advise on split push timing vs teleport plays, not teamfighting. If they are a teamfighter, advise on grouping.
- JUNGLE: focus on objective control (Drake, Baron, Rift Herald) and which lanes are losing and need a gank.
- MIDDLE: consider roaming to bot/top, wave management before roaming, and priority for objectives.

Be specific. Reference actual numbers (CS difference, kill lead, vision score, gold gap). Do not give generic advice.`;

const LlmResponseSchema = z.object({
  itemReasoning: z.string().optional(),
  situationalItems: z.array(z.object({
    id: z.number().catch(0),
    name: z.string().catch(""),
    reason: z.string().catch("")
  })).optional(),
  strategy: z.object({
    winCondition: z.enum(["early", "mid", "late"]).optional(),
    summary: z.string().optional(),
    immediateAction: z.string().optional(),
    lateGamePlan: z.string().optional(),
    laneMatchupAnalysis: z.string().optional(),
    counterPlay: z.string().optional(),
  }).optional()
});

export interface TokenUsage {
  input: number;
  output: number;
  cacheHit?: number;
}

export interface LlmAnalysis {
  reasoning: string;
  strategy: Strategy;
  situationalItems?: RecommendedItem[];
  tokenUsage?: TokenUsage;
}

export interface ModelInfo {
  id: string;
  displayName: string;
}

export interface LlmProvider {
  readonly name: string;
  listModels(): Promise<ModelInfo[]>;
  getAnalysis(
    state: ParsedGameState,
    heuristicRec: ItemRecommendation,
  ): Promise<LlmAnalysis>;
}

export type ProviderType = "claude" | "openai" | "gemini";

function buildRoleContext(state: ParsedGameState, role: RolePosition): string {
  switch (role) {
    case "UTILITY": {
      const allyAdc = state.allies.find((a) => a.position === "BOTTOM");
      if (allyAdc) {
        return `Your ADC (protect): ${allyAdc.championName} — KDA ${allyAdc.scores.kills}/${allyAdc.scores.deaths}/${allyAdc.scores.assists}, Lvl ${allyAdc.level}${allyAdc.isDead ? ", DEAD" : ""}`;
      }
      return "Your ADC: not found in ally list";
    }
    case "JUNGLE": {
      const losingLanes = state.allies.filter(
        (a) => a.scores.deaths > a.scores.kills + a.scores.assists,
      );
      if (losingLanes.length > 0) {
        return `Lanes that may need a gank: ${losingLanes.map((a) => `${a.championName} (${a.position || "?"}, KDA ${a.scores.kills}/${a.scores.deaths}/${a.scores.assists})`).join(", ")}`;
      }
      return "";
    }
    default:
      return "";
  }
}

async function formatAbilities(championName: string): Promise<string> {
  const abilities = await ddragon.getChampionAbilities(championName);
  if (!abilities) return "";
  return ` | Abilities: Q=${abilities.q}, W=${abilities.w}, E=${abilities.e}, R=${abilities.r}`;
}

function findLaneOpponent(state: ParsedGameState, myPos: RolePosition) {
  if (myPos === "UNKNOWN" || myPos === "") return undefined;
  const laneOpponent = state.enemies.find((e) => e.position === myPos);
  if (laneOpponent) return laneOpponent;
  const opponentPos = myPos === "UTILITY" ? "BOTTOM" : myPos;
  return state.enemies.find((e) => e.position === opponentPos);
}

async function formatOpponent(primaryOpponent: any, myPos: RolePosition): Promise<string> {
  if (!primaryOpponent) return "Opponent: unknown (position data unavailable)";
  const opponentAbilityStr = await formatAbilities(primaryOpponent.championName);
  return `Opponent (${primaryOpponent.position || myPos}): ${primaryOpponent.championName} — KDA ${primaryOpponent.scores.kills}/${primaryOpponent.scores.deaths}/${primaryOpponent.scores.assists}, CS ${primaryOpponent.scores.creepScore}, Vision: ${Math.round(primaryOpponent.scores.wardScore)}, Lvl ${primaryOpponent.level}${primaryOpponent.isDead ? ", currently DEAD" : ""}${opponentAbilityStr}`;
}

function formatCoreItems(heuristicRec: ItemRecommendation): string {
  if (heuristicRec.items.length === 0) return "None";
  return heuristicRec.items.map((item) => {
    const info = ddragon.getItemInfo(item.id);
    if (!info) return `- ${item.name}`;
    const statsStr = info.stats ? ` (${info.stats})` : "";
    const descStr = info.plaintext ? ` — ${info.plaintext}` : "";
    return `- ${item.name}${statsStr}${descStr}`;
  }).join("\n");
}

export async function buildUserPrompt(
  state: ParsedGameState,
  heuristicRec: ItemRecommendation,
): Promise<string> {
  const phase = getGamePhase(state.gameTime);
  const myPos = (state.localPlayer.position || "UNKNOWN") as RolePosition;
  const myVision = state.localPlayer.scores.wardScore;

  const primaryOpponent = findLaneOpponent(state, myPos);
  
  const [myAbilityStr, opponentStr] = await Promise.all([
    formatAbilities(state.localPlayer.championName),
    formatOpponent(primaryOpponent, myPos)
  ]);

  const roleContext = buildRoleContext(state, myPos);
  const itemLines = formatCoreItems(heuristicRec);

  return `Current Game State:
${minifyGameState(state)}
Game Phase: ${phase} (< 14min = early, 14-25min = mid, > 25min = late)
My role: ${myPos}${myPos === "UTILITY" ? ` (Vision score: ${Math.round(myVision)})` : ""}
My champion: ${state.localPlayer.championName}${myAbilityStr}

${opponentStr}
${roleContext}
Core items (heuristic baseline):
${itemLines}

Respond with the JSON object as instructed.`;
}

export function parseAnalysisResponse(
  raw: string,
  fallback: ItemRecommendation,
): LlmAnalysis {
  try {
    const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
    const parsedObj = JSON.parse(clean);
    const parsed = LlmResponseSchema.safeParse(parsedObj);
    
    if (!parsed.success) {
      Logger.warn("[LLM] Failed to parse JSON according to schema:", parsed.error);
      return { reasoning: fallback.reasoning, strategy: fallback.strategy };
    }
    
    const data = parsed.data;
    
    const situationalItems: RecommendedItem[] = (data.situationalItems ?? [])
      .slice(0, 2)
      .map((item) => ({
        id: item.id,
        name: item.name,
        reason: item.reason,
        priority: "situational" as const,
      }))
      .filter((item) => item.id > 0 && item.name.length > 0);

    return {
      reasoning: data.itemReasoning ?? fallback.reasoning,
      situationalItems,
      strategy: {
        winCondition: data.strategy?.winCondition ?? fallback.strategy.winCondition,
        summary: data.strategy?.summary ?? fallback.strategy.summary,
        immediateAction: data.strategy?.immediateAction ?? fallback.strategy.immediateAction,
        lateGamePlan: data.strategy?.lateGamePlan ?? fallback.strategy.lateGamePlan,
        laneMatchupAnalysis: data.strategy?.laneMatchupAnalysis ?? fallback.strategy.laneMatchupAnalysis,
        counterPlay: data.strategy?.counterPlay ?? fallback.strategy.counterPlay,
      },
    };
  } catch (err) {
    Logger.warn("[LLM] Failed to parse raw LLM output as JSON:", err);
    return { reasoning: fallback.reasoning, strategy: fallback.strategy };
  }
}

/**
 * Factory function — creates the correct LlmProvider from a type string + API key.
 * Imports are now static so Webpack and pkg bundle them correctly for the .exe.
 */
export async function createLlmProvider(
  type: ProviderType,
  apiKey: string,
  model?: string,
): Promise<LlmProvider> {
  switch (type) {
    case "claude":
      return new ClaudeProvider(apiKey, model);
    case "openai":
      return new OpenAiProvider(apiKey, model);
    case "gemini":
      return new GeminiProvider(apiKey, model);
    default:
      throw new Error(`Unknown LLM provider: ${type}`);
  }
}
