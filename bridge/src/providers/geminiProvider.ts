import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LlmProvider, LlmAnalysis, ModelInfo, TokenUsage } from "../llmProvider.js";
import { SYSTEM_PROMPT, buildUserPrompt, parseAnalysisResponse, friendlyApiError } from "../llmProvider.js";
import type { ParsedGameState, ItemRecommendation } from "../types.js";


export const GEMINI_DEFAULT_MODEL = "gemini-2.0-flash";

export class GeminiProvider implements LlmProvider {
  readonly name = "gemini";
  private readonly client: GoogleGenerativeAI;
  private readonly modelId: string;
  private readonly apiKey: string;

  constructor(apiKey: string, model: string = GEMINI_DEFAULT_MODEL) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelId = model;
    this.apiKey = apiKey;
  }

  async listModels(): Promise<ModelInfo[]> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}&pageSize=50`,
    );
    if (!res.ok) throw new Error(`Gemini models API returned ${res.status}`);
    const data = await res.json() as { models: Array<{ name: string; displayName: string; supportedGenerationMethods: string[] }> };
    return (data.models ?? [])
      .filter((m) => m.supportedGenerationMethods.includes("generateContent"))
      .map((m) => ({
        id: m.name.replace("models/", ""),
        displayName: m.displayName,
      }));
  }

  async getAnalysis(
    state: ParsedGameState,
    heuristicRec: ItemRecommendation,
  ): Promise<LlmAnalysis> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.modelId,
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

      const meta = result.response.usageMetadata;
      const tokenUsage: TokenUsage = {
        input: meta?.promptTokenCount ?? 0,
        output: meta?.candidatesTokenCount ?? 0,
      };
      console.log(`[LLM:Gemini] Tokens: ${tokenUsage.input} in, ${tokenUsage.output} out`);

      return { ...parseAnalysisResponse(text, heuristicRec), tokenUsage };
    } catch (err) {
      throw new Error(`Gemini: ${friendlyApiError(err)}`);
    }
  }
}
