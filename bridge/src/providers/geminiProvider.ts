import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LlmProvider, LlmAnalysis } from "../llmProvider.js";
import { SYSTEM_PROMPT, buildUserPrompt, parseAnalysisResponse } from "../llmProvider.js";
import type { ParsedGameState, ItemRecommendation } from "../types.js";

function friendlyGeminiError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const status = (err as Record<string, unknown>)?.status;

  if (status === 429 || msg.includes("429")) {
    const retryMatch = msg.match(/"retryDelay"\s*:\s*"(\d+)s"/);
    const seconds = retryMatch ? retryMatch[1] : null;
    return seconds
      ? `Rate limit exceeded. Retry in ${seconds}s (free-tier quota).`
      : "Rate limit exceeded (free-tier quota). Please wait before retrying.";
  }

  if (status === 401 || msg.includes("401") || msg.toLowerCase().includes("api key")) {
    return "Invalid API key.";
  }

  if (status === 503 || msg.includes("503")) {
    return "Service unavailable. Try again shortly.";
  }

  return msg.split("\n")[0];
}

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
      throw new Error(`Gemini: ${friendlyGeminiError(err)}`);
    }
  }
}
