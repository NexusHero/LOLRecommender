import OpenAI from "openai";
import type { LlmProvider, LlmAnalysis, ModelInfo, TokenUsage } from "../llmProvider.js";
import { SYSTEM_PROMPT, buildUserPrompt, parseAnalysisResponse, friendlyApiError } from "../llmProvider.js";
import type { ParsedGameState, ItemRecommendation } from "../types.js";

export const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";

export class OpenAiProvider implements LlmProvider {
  readonly name = "openai";
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model: string = OPENAI_DEFAULT_MODEL) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async listModels(): Promise<ModelInfo[]> {
    const page = await this.client.models.list();
    return page.data
      .filter((m) => /^(gpt-|o1|o3|o4)/.test(m.id) && !m.id.includes(":"))
      .sort((a, b) => b.created - a.created)
      .map((m) => ({ id: m.id, displayName: m.id }));
  }

  async getAnalysis(
    state: ParsedGameState,
    heuristicRec: ItemRecommendation,
  ): Promise<LlmAnalysis> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 400,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: await buildUserPrompt(state, heuristicRec) },
        ],
      });

      const text = response.choices[0]?.message?.content;
      if (!text) return { reasoning: heuristicRec.reasoning, strategy: heuristicRec.strategy };

      const tokenUsage: TokenUsage = {
        input: response.usage?.prompt_tokens ?? 0,
        output: response.usage?.completion_tokens ?? 0,
      };
      console.log(
        `[LLM:OpenAI] Tokens: ${tokenUsage.input} in, ${tokenUsage.output} out`,
      );

      return { ...parseAnalysisResponse(text, heuristicRec), tokenUsage };
    } catch (err) {
      throw new Error(`OpenAI: ${friendlyApiError(err)}`);
    }
  }
}
