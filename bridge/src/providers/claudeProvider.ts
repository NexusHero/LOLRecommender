import { Anthropic } from "@anthropic-ai/sdk";
import type { LlmProvider, LlmAnalysis } from "../llmProvider.js";
import { SYSTEM_PROMPT, buildUserPrompt, parseAnalysisResponse } from "../llmProvider.js";
import type { ParsedGameState, ItemRecommendation } from "../types.js";

export class ClaudeProvider implements LlmProvider {
  readonly name = "claude";
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async getAnalysis(
    state: ParsedGameState,
    heuristicRec: ItemRecommendation,
  ): Promise<LlmAnalysis> {
    try {
      const response = await this.client.messages.create({
        model: "claude-haiku-4-5-20251001",
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
      console.error("[LLM:Claude] Error:", err);
      return { reasoning: heuristicRec.reasoning, strategy: heuristicRec.strategy };
    }
  }
}
