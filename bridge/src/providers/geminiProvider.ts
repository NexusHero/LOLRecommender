import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LlmProvider, LlmAnalysis } from "../llmProvider.js";
import { SYSTEM_PROMPT, buildUserPrompt, parseAnalysisResponse } from "../llmProvider.js";
import type { ParsedGameState, ItemRecommendation } from "../types.js";

export class GeminiProvider implements LlmProvider {
  readonly name = "gemini";
  private readonly client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async getAnalysis(
    state: ParsedGameState,
    heuristicRec: ItemRecommendation,
  ): Promise<LlmAnalysis> {
    try {
      const model = this.client.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: SYSTEM_PROMPT,
      });

      const result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: await buildUserPrompt(state, heuristicRec) }] },
        ],
        generationConfig: {
          maxOutputTokens: 400,
          responseMimeType: "application/json",
        },
      });

      const text = result.response.text();
      if (!text) return { reasoning: heuristicRec.reasoning, strategy: heuristicRec.strategy };

      console.log(`[LLM:Gemini] Response received (${text.length} chars)`);

      return parseAnalysisResponse(text, heuristicRec);
    } catch (err) {
      console.error("[LLM:Gemini] Error:", err);
      return { reasoning: heuristicRec.reasoning, strategy: heuristicRec.strategy };
    }
  }
}
