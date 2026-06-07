import OpenAI from "openai";
import type { LlmProvider, LlmAnalysis } from "../llmProvider.js";
import { SYSTEM_PROMPT, buildUserPrompt, parseAnalysisResponse } from "../llmProvider.js";
import type { ParsedGameState, ItemRecommendation } from "../types.js";

export class OpenAiProvider implements LlmProvider {
  readonly name = "openai";
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async getAnalysis(
    state: ParsedGameState,
    heuristicRec: ItemRecommendation,
  ): Promise<LlmAnalysis> {
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 400,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(state, heuristicRec) },
        ],
      });

      const text = response.choices[0]?.message?.content;
      if (!text) return { reasoning: heuristicRec.reasoning, strategy: heuristicRec.strategy };

      console.log(
        `[LLM:OpenAI] Tokens: ${response.usage?.prompt_tokens ?? "?"} in, ${response.usage?.completion_tokens ?? "?"} out`,
      );

      return parseAnalysisResponse(text, heuristicRec);
    } catch (err) {
      console.error("[LLM:OpenAI] Error:", err);
      return { reasoning: heuristicRec.reasoning, strategy: heuristicRec.strategy };
    }
  }
}
