import type { ParsedGameState, ItemRecommendation } from "./types.js";
import { minifyGameState } from "./stateMinifier.js";
import { ClaudeProvider } from "./providers/claudeProvider.js";
import { OpenAiProvider } from "./providers/openaiProvider.js";
import { GeminiProvider } from "./providers/geminiProvider.js";

export const SYSTEM_PROMPT = `You are an experienced League of Legends coach.
Analyze the game state and briefly explain (2-3 sentences)
why the suggested items are a good choice. Consider KDA and gold advantages.
Be specific and concise. Do not use Markdown formatting.`;

/**
 * Common interface for all LLM providers.
 * Each provider wraps a specific AI SDK and exposes a uniform
 * `getExplanation` method used by the Orchestrator.
 */
export interface LlmProvider {
  readonly name: string;
  getExplanation(
    state: ParsedGameState,
    heuristicRec: ItemRecommendation,
  ): Promise<string>;
}

export type ProviderType = "claude" | "openai" | "gemini";

export function buildUserPrompt(
  state: ParsedGameState,
  heuristicRec: ItemRecommendation,
): string {
  const itemNames = heuristicRec.items.map((i) => i.name).join(", ");

  return `Current Game State:
${minifyGameState(state)}

Suggested items: ${itemNames}

Briefly explain why these items are effective right now.`;
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
