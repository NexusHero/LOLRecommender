import type { ParsedGameState, ItemRecommendation, Strategy } from "./types.js";
import { minifyGameState } from "./stateMinifier.js";
import { getGamePhase } from "./stateMinifier.js";
import { ClaudeProvider } from "./providers/claudeProvider.js";
import { OpenAiProvider } from "./providers/openaiProvider.js";
import { GeminiProvider } from "./providers/geminiProvider.js";

export const SYSTEM_PROMPT = `You are an experienced League of Legends coach.
Analyze the game state and respond ONLY with a JSON object — no markdown, no code blocks, no extra text.
Use this exact format:
{
  "itemReasoning": "2-3 sentences explaining why the suggested items are a good choice right now",
  "strategy": {
    "winCondition": "early" or "mid" or "late",
    "summary": "1 sentence: when and how the player wins this game",
    "immediateAction": "1 sentence: what to do RIGHT NOW in-game",
    "lateGamePlan": "1 sentence: how to close out the game with the final build"
  }
}
Be specific. Consider KDA, gold, champion matchups, and the current game phase.`;

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

export function buildUserPrompt(
  state: ParsedGameState,
  heuristicRec: ItemRecommendation,
): string {
  const itemNames = heuristicRec.items.map((i) => i.name).join(", ") || "None";
  const phase = getGamePhase(state.gameTime);

  return `Current Game State:
${minifyGameState(state)}
Game Phase: ${phase} (< 14min = early, 14-25min = mid, > 25min = late)

Suggested items: ${itemNames}

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
