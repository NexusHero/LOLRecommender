import { z } from "zod";
import type { ParsedGameState, RecommendedItem, Strategy, RolePosition } from "./types.js";
import { getGamePhase } from "./stateMinifier.js";
import { ClaudeProvider } from "./providers/claudeProvider.js";
import { OpenAiProvider } from "./providers/openaiProvider.js";
import { GeminiProvider } from "./providers/geminiProvider.js";
import { Logger } from "./logger.js";
import { ddragon } from "./ddragonService.js";

export const SYSTEM_PROMPT = `You are an experienced League of Legends coach giving live in-game advice.
The player will glance at your output for a few seconds during a match, so every field must be SHORT and SCANNABLE.
Analyze the game state and respond ONLY with a JSON object — no markdown, no code blocks, no extra text.
Use this exact format:
{
  "itemReasoning": "1 short sentence (max ~15 words) on the recommended build direction for this champion vs this enemy comp",
  "situationalItems": [
    {"id": 3111, "name": "Mercurial Scimitar", "reason": "Max ~10 words on why this specific item fits right now"}
  ],
  "strategy": {
    "winCondition": "early" or "mid" or "late",
    "summary": "Max ~10 words: when and how the player wins this game",
    "immediateAction": "Max ~12 words: what to do RIGHT NOW, referencing their champion/stats",
    "lateGamePlan": "Max ~12 words: how to close out the game with the final build",
    "laneMatchupAnalysis": "Max ~15 words: the single most important matchup fact for this role",
    "counterPlay": "Max ~12 words: one concrete role-appropriate action to swing the matchup"
  }
}

Every field is a fragment — drop filler words and lead with the verb or key fact. Never exceed the word limits.

"situationalItems": Recommend 2–4 items that genuinely fit THIS champion vs THIS specific enemy comp.
Each enemy champion includes their official Riot tags (e.g. [Tank], [Mage, Assassin], [Marksman]) — use these to understand the threat profile. Analyze each enemy individually, not just AP/AD totals.
Recommend items appropriate for the player's champion class:
- Marksman/ADC: crit, attack speed, lethality (Galeforce=6671, Infinity Edge=3031, Kraken Slayer=6672, Lord Dominik's=3036)
- Mage/AP: AP, mana, MR (Shadowflame=6675, Rabadon's=3089, Zhonya's=3157, Banshee's=3102, Void Staff=3135)
- Tank: HP, armor, MR (Heartsteel=6664, Sunfire=3068, Thornmail=3075, Randuin's=3143, Force of Nature=4401)
- Fighter/Bruiser: damage + survivability (Trinity Force=3078, Black Cleaver=3071, Sterak's=3053, Maw=3156, Goredrinker=6630)
- Support: utility, auras (Locket=3190, Moonstone=6617, Redemption=3107, Knight's Vow=3109)
Common defensive counters: QSS=3140 (hard CC), Plated Steelcaps=3047 (AA-heavy), Merc Treads=3111 (CC+AP), Guardian Angel=3026 (burst assassins), GW items=3033/3165 (heavy healing).
Never repeat items already in the counter items list. Use [] only if the counter items already cover everything.

The "Counter items" shown are automated heuristic suggestions. You may override itemReasoning if they don't fit the champion.

Adjust analysis based on the player's role:
- UTILITY (Support): ignore CS. Focus on vision, assists, ADC protection, engage/disengage/peel.
- BOTTOM (ADC): CS lead/deficit matters most. Sustained DPS and positioning in fights.
- TOP: split-push vs teamfight timing for this champion, teleport plays, wave management.
- JUNGLE: Drake/Baron/Herald control, which lanes need ganks, when to invade.
- MIDDLE: roam timing, wave management before roaming, mid-tier objective priority.

Be specific. Reference actual numbers (CS lead, kill lead, vision score, gold gap). Do not give generic advice.`;

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
  getAnalysis(state: ParsedGameState): Promise<LlmAnalysis>;
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
  const tags = ddragon.getChampionTags(primaryOpponent.championName);
  const tagStr = tags.length ? ` [${tags.join(", ")}]` : "";
  return `Opponent (${primaryOpponent.position || myPos}): ${primaryOpponent.championName}${tagStr} — KDA ${primaryOpponent.scores.kills}/${primaryOpponent.scores.deaths}/${primaryOpponent.scores.assists}, CS ${primaryOpponent.scores.creepScore}, Lvl ${primaryOpponent.level}${primaryOpponent.isDead ? ", DEAD" : ""}${opponentAbilityStr}`;
}

function formatEnemiesWithTags(enemies: ParsedGameState["enemies"]): string {
  if (enemies.length === 0) return "None";
  return enemies.map((e) => {
    const tags = ddragon.getChampionTags(e.championName);
    const tagStr = tags.length ? ` [${tags.join(", ")}]` : "";
    const pos = e.position ? ` (${e.position})` : "";
    return `${e.championName}${tagStr}${pos} Lvl ${e.level} ${e.scores.kills}/${e.scores.deaths}/${e.scores.assists}`;
  }).join(", ");
}

export async function buildUserPrompt(state: ParsedGameState): Promise<string> {
  const phase = getGamePhase(state.gameTime);
  const myPos = (state.localPlayer.position || "UNKNOWN") as RolePosition;
  const myVision = state.localPlayer.scores.wardScore;

  const primaryOpponent = findLaneOpponent(state, myPos);
  const myTags = ddragon.getChampionTags(state.localPlayer.championName);
  const myTagStr = myTags.length ? ` [${myTags.join(", ")}]` : "";

  const [myAbilityStr, opponentStr] = await Promise.all([
    formatAbilities(state.localPlayer.championName),
    formatOpponent(primaryOpponent, myPos)
  ]);

  const roleContext = buildRoleContext(state, myPos);
  const enemiesWithTags = formatEnemiesWithTags(state.enemies);

  return `Game Phase: ${phase} | Time: ${Math.floor(state.gameTime / 60)}m
My champion: ${state.localPlayer.championName}${myTagStr}${myAbilityStr}
My role: ${myPos}${myPos === "UTILITY" ? ` (Vision: ${Math.round(myVision)})` : ""}
My stats: Lvl ${state.localPlayer.level}, Gold ${state.activePlayer.currentGold}, KDA ${state.localPlayer.scores.kills}/${state.localPlayer.scores.deaths}/${state.localPlayer.scores.assists}, CS ${state.localPlayer.scores.creepScore}
My items: ${state.localPlayer.items.map(i => i.displayName).join(", ") || "None"}

Enemies: ${enemiesWithTags}

${opponentStr}
${roleContext}
Respond with the JSON object as instructed.`;
}

const DEFAULT_STRATEGY: Strategy = {
  winCondition: "mid",
  summary: "",
  immediateAction: "",
  lateGamePlan: "",
};

export function parseAnalysisResponse(raw: string): LlmAnalysis {
  try {
    const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
    const parsedObj = JSON.parse(clean);
    const parsed = LlmResponseSchema.safeParse(parsedObj);

    if (!parsed.success) {
      Logger.warn("[LLM] Failed to parse JSON according to schema:", parsed.error);
      return { reasoning: "", strategy: DEFAULT_STRATEGY };
    }

    const data = parsed.data;

    const situationalItems: RecommendedItem[] = (data.situationalItems ?? [])
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        name: item.name,
        reason: item.reason,
        priority: "situational" as const,
      }))
      .filter((item) => item.id > 0 && item.name.length > 0);

    return {
      reasoning: data.itemReasoning ?? "",
      situationalItems,
      strategy: {
        winCondition: data.strategy?.winCondition ?? DEFAULT_STRATEGY.winCondition,
        summary: data.strategy?.summary ?? DEFAULT_STRATEGY.summary,
        immediateAction: data.strategy?.immediateAction ?? DEFAULT_STRATEGY.immediateAction,
        lateGamePlan: data.strategy?.lateGamePlan ?? DEFAULT_STRATEGY.lateGamePlan,
        laneMatchupAnalysis: data.strategy?.laneMatchupAnalysis,
        counterPlay: data.strategy?.counterPlay,
      },
    };
  } catch (err) {
    Logger.warn("[LLM] Failed to parse raw LLM output as JSON:", err);
    return { reasoning: "", strategy: DEFAULT_STRATEGY };
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
