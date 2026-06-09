import { Anthropic } from "@anthropic-ai/sdk";
import type { LlmProvider, LlmAnalysis, ModelInfo } from "../llmProvider.js";
import { SYSTEM_PROMPT, buildUserPrompt, parseAnalysisResponse, friendlyApiError } from "../llmProvider.js";
import type { ParsedGameState, ItemRecommendation } from "../types.js";

export const CLAUDE_DEFAULT_MODEL = "claude-haiku-4-5-20251001";

export class ClaudeProvider implements LlmProvider {
  readonly name = "claude";
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey: string, model: string = CLAUDE_DEFAULT_MODEL) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async listModels(): Promise<ModelInfo[]> {
    const page = await this.client.models.list();
    return page.data.map((m) => ({
      id: m.id,
      displayName: (m as unknown as Record<string, string>).display_name ?? m.id,
    }));
  }

  async getAnalysis(
    state: ParsedGameState,
    heuristicRec: ItemRecommendation,
  ): Promise<LlmAnalysis> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 400,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [
          { role: "user", content: await buildUserPrompt(state, heuristicRec) },
        ],
      });

      if (response.content.length === 0) return { reasoning: heuristicRec.reasoning, strategy: heuristicRec.strategy };
      const block = response.content[0];
      if (block.type !== "text") return { reasoning: heuristicRec.reasoning, strategy: heuristicRec.strategy };

      console.log(
        `[LLM:Claude] Input tokens: ${response.usage.input_tokens} (cache hit: ${(response.usage as unknown as Record<string, unknown>).cache_read_input_tokens ?? 0}), output tokens: ${response.usage.output_tokens}`,
      );

      return parseAnalysisResponse(block.text, heuristicRec);
    } catch (err) {
      throw new Error(`Claude: ${friendlyApiError(err)}`);
    }
  }
}
