import type { ParsedGameState, ItemRecommendation, Strategy } from "./types.js";
import { minifyGameState } from "./stateMinifier.js";
import { getGamePhase } from "./stateMinifier.js";
import { ClaudeProvider } from "./providers/claudeProvider.js";
import { OpenAiProvider } from "./providers/openaiProvider.js";
import { GeminiProvider } from "./providers/geminiProvider.js";
import { ddragon } from "./ddragonService.js";

export const SYSTEM_PROMPT = `You are an experienced League of Legends coach.
Analyze the game state and respond ONLY with a JSON object — no markdown, no code blocks, no extra text.
Use this exact format:
{
  "itemReasoning": "2-3 sentences explaining why the suggested items are a good choice right now",
  "strategy": {
    "winCondition": "early" or "mid" or "late",
    "summary": "1 sentence: when and how the player wins this game",
    "immediateAction": "1 sentence: what to do RIGHT NOW in-game, referencing their champion and current stats",
    "lateGamePlan": "1 sentence: how to close out the game with the final build",
    "laneMatchupAnalysis": "1-2 sentences: role-specific comparison — what the opponent/enemy duo is doing better or worse using the metrics that matter for this role",
    "counterPlay": "1 sentence: one concrete role-appropriate action to gain or stop losing the matchup right now"
  }
}

Adjust analysis based on the player's role:
- UTILITY (Support): ignore CS entirely. Focus on vision score, assists, and whether the ADC is alive and ahead. A support death that lets the ADC get kills is a good trade. Counterplay is about engage, disengage, peel, or vision control — not farming.
- BOTTOM (ADC): CS lead/deficit matters most. Staying alive to deal sustained damage in fights. Laning phase is about CS and poking, not all-ins unless you are ahead.
- TOP: check if the champion is a known split-pusher (e.g. Tryndamere, Fiora, Jax, Camille). If so, advise on split push timing vs teleport plays, not teamfighting. If they are a teamfighter, advise on grouping.
- JUNGLE: focus on objective control (Drake, Baron, Rift Herald) and which lanes are losing and need a gank.
- MIDDLE: consider roaming to bot/top, wave management before roaming, and priority for objectives.

Be specific. Reference actual numbers (CS difference, kill lead, vision score, gold gap). Do not give generic advice.`;

export interface LlmAnalysis {
  reasoning: string;
  strategy: Strategy;
}

/**
 * Common interface for all LLM providers.
 * Each provider wraps a specific AI SDK and exposes a uniform
 * `getAnalysis` method used by the Orchestrator.
 */
export interface LlmProvider {
  readonly name: string;
  getAnalysis(
    state: ParsedGameState,
    heuristicRec: ItemRecommendation,
  ): Promise<LlmAnalysis>;
}

export type ProviderType = "claude" | "openai" | "gemini";

function buildRoleContext(state: ParsedGameState, role: string): string {
  if (role === "UTILITY") {
    const allyAdc = state.allies.find((a) => a.position === "BOTTOM");
    if (allyAdc) {
      return `Your ADC (protect): ${allyAdc.championName} — KDA ${allyAdc.scores.kills}/${allyAdc.scores.deaths}/${allyAdc.scores.assists}, Lvl ${allyAdc.level}${allyAdc.isDead ? ", DEAD" : ""}`;
    }
    return "Your ADC: not found in ally list";
  }
  if (role === "JUNGLE") {
    const drakes = state.allies.filter((a) => a.scores.kills > 0).length;
    const losingLanes = state.allies.filter(
      (a) => a.scores.deaths > a.scores.kills + a.scores.assists,
    );
    if (losingLanes.length > 0) {
      return `Lanes that may need a gank: ${losingLanes.map((a) => `${a.championName} (${a.position || "?"}, KDA ${a.scores.kills}/${a.scores.deaths}/${a.scores.assists})`).join(", ")}`;
    }
  }
  return "";
}

export async function buildUserPrompt(
  state: ParsedGameState,
  heuristicRec: ItemRecommendation,
): Promise<string> {
  const phase = getGamePhase(state.gameTime);

  const myPos = state.localPlayer.position || "UNKNOWN";
  const myVision = state.localPlayer.scores.wardScore;

  const laneOpponent = myPos !== "UNKNOWN"
    ? state.enemies.find((e) => e.position === myPos)
    : undefined;

  const opponentPos = myPos === "UTILITY" ? "BOTTOM" : myPos;
  const primaryOpponent = laneOpponent ?? (myPos !== "UNKNOWN"
    ? state.enemies.find((e) => e.position === opponentPos)
    : undefined);

  // Fetch abilities in parallel
  const [myAbilities, opponentAbilities] = await Promise.all([
    ddragon.getChampionAbilities(state.localPlayer.championName),
    primaryOpponent ? ddragon.getChampionAbilities(primaryOpponent.championName) : Promise.resolve(undefined),
  ]);

  const myAbilityStr = myAbilities
    ? ` | Abilities: Q=${myAbilities.q}, W=${myAbilities.w}, E=${myAbilities.e}, R=${myAbilities.r}`
    : "";

  const opponentAbilityStr = opponentAbilities
    ? ` | Abilities: Q=${opponentAbilities.q}, W=${opponentAbilities.w}, E=${opponentAbilities.e}, R=${opponentAbilities.r}`
    : "";

  const opponentStr = primaryOpponent
    ? `Opponent (${primaryOpponent.position || myPos}): ${primaryOpponent.championName} — KDA ${primaryOpponent.scores.kills}/${primaryOpponent.scores.deaths}/${primaryOpponent.scores.assists}, CS ${primaryOpponent.scores.creepScore}, Vision: ${Math.round(primaryOpponent.scores.wardScore)}, Lvl ${primaryOpponent.level}${primaryOpponent.isDead ? ", currently DEAD" : ""}${opponentAbilityStr}`
    : "Opponent: unknown (position data unavailable)";

  const roleContext = buildRoleContext(state, myPos);

  // Build item lines with DDragon stats
  const itemLines = heuristicRec.items.length === 0
    ? "None"
    : heuristicRec.items.map((item) => {
        const info = ddragon.getItemInfo(item.id);
        if (!info) return `- ${item.name}`;
        const statsStr = info.stats ? ` (${info.stats})` : "";
        const descStr = info.plaintext ? ` — ${info.plaintext}` : "";
        return `- ${item.name}${statsStr}${descStr}`;
      }).join("\n");

  return `Current Game State:
${minifyGameState(state)}
Game Phase: ${phase} (< 14min = early, 14-25min = mid, > 25min = late)
My role: ${myPos}${myPos === "UTILITY" ? ` (Vision score: ${Math.round(myVision)})` : ""}
My champion: ${state.localPlayer.championName}${myAbilityStr}

${opponentStr}
${roleContext}
Suggested items:
${itemLines}

Respond with the JSON object as instructed.`;
}

export function parseAnalysisResponse(
  raw: string,
  fallback: ItemRecommendation,
): LlmAnalysis {
  try {
    const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
    const parsed = JSON.parse(clean) as Record<string, unknown>;
    const strat = parsed.strategy as Record<string, unknown> | undefined;
    return {
      reasoning: (parsed.itemReasoning as string | undefined) ?? fallback.reasoning,
      strategy: {
        winCondition: (strat?.winCondition as Strategy["winCondition"] | undefined) ?? fallback.strategy.winCondition,
        summary: (strat?.summary as string | undefined) ?? fallback.strategy.summary,
        immediateAction: (strat?.immediateAction as string | undefined) ?? fallback.strategy.immediateAction,
        lateGamePlan: (strat?.lateGamePlan as string | undefined) ?? fallback.strategy.lateGamePlan,
        laneMatchupAnalysis: (strat?.laneMatchupAnalysis as string | undefined) ?? fallback.strategy.laneMatchupAnalysis,
        counterPlay: (strat?.counterPlay as string | undefined) ?? fallback.strategy.counterPlay,
      },
    };
  } catch {
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
): Promise<LlmProvider> {
  switch (type) {
    case "claude":
      return new ClaudeProvider(apiKey);
    case "openai":
      return new OpenAiProvider(apiKey);
    case "gemini":
      return new GeminiProvider(apiKey);
    default:
      throw new Error(`Unknown LLM provider: ${type}`);
  }
}
