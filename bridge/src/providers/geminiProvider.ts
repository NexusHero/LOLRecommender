import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LlmProvider } from "../llmProvider.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "../llmProvider.js";
import type { ParsedGameState, ItemRecommendation } from "../types.js";

export class GeminiProvider implements LlmProvider {
  readonly name = "gemini";
  private readonly client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async getExplanation(
    state: ParsedGameState,
    heuristicRec: ItemRecommendation,
  ): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: SYSTEM_PROMPT,
      });

      const result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: buildUserPrompt(state, heuristicRec) }] },
        ],
        generationConfig: { maxOutputTokens: 150 },
      });

      const text = result.response.text();
      if (!text) return heuristicRec.reasoning;

      console.log(
        `[LLM:Gemini] Response received (${text.length} chars)`,
      );

      return text;
    } catch (err) {
      console.error("[LLM:Gemini] Error:", err);
      return heuristicRec.reasoning;
    }
  }
}
