import OpenAI from "openai";
import type { LlmProvider } from "../llmProvider.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "../llmProvider.js";
import type { ParsedGameState, ItemRecommendation } from "../types.js";

export class OpenAiProvider implements LlmProvider {
  readonly name = "openai";
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async getExplanation(
    state: ParsedGameState,
    heuristicRec: ItemRecommendation,
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 150,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(state, heuristicRec) },
        ],
      });

      const text = response.choices[0]?.message?.content;
      if (!text) return heuristicRec.reasoning;

      console.log(
        `[LLM:OpenAI] Tokens: ${response.usage?.prompt_tokens ?? "?"} in, ${response.usage?.completion_tokens ?? "?"} out`,
      );

      return text;
    } catch (err) {
      console.error("[LLM:OpenAI] Error:", err);
      return heuristicRec.reasoning;
    }
  }
}
