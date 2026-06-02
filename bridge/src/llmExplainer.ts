import Anthropic from "@anthropic-ai/sdk";
import type { ParsedGameState, ItemRecommendation } from "./types.js";

const SYSTEM_PROMPT = `You are an experienced League of Legends coach.
Analyze the enemy team composition and briefly explain (2-3 sentences)
why the suggested items are a good choice. Be specific and concise.
Do not use Markdown formatting.`;

export class LlmExplainer {
  constructor(private readonly client: Anthropic) {}

  async getExplanation(
    state: ParsedGameState,
    heuristicRec: ItemRecommendation
  ): Promise<string> {
    const enemyChamps = state.enemies.map((e) => e.championName).join(", ");
    const itemNames = heuristicRec.items.map((i) => i.name).join(", ");

    try {
      const response = await this.client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 150,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            // Prompt caching: system prompt is cached after the first call
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [
          {
            role: "user",
            content: `My champion: ${state.localPlayer.championName}
Enemies: ${enemyChamps}
Suggested items: ${itemNames}
Game time: ${Math.floor(state.gameTime / 60)}:${String(Math.floor(state.gameTime % 60)).padStart(2, "0")}

Briefly explain why these items are effective against this composition.`,
          },
        ],
      });

      if (response.content.length === 0) return heuristicRec.reasoning;
      const text = response.content[0];
      if (text.type !== "text") return heuristicRec.reasoning;

      console.log(
        `[LLM] Input tokens: ${response.usage.input_tokens} (cache hit: ${(response.usage as unknown as Record<string, unknown>).cache_read_input_tokens ?? 0}), output tokens: ${response.usage.output_tokens}`
      );

      return text.text;
    } catch (err) {
      console.error("[LLM] Error:", err);
      return heuristicRec.reasoning;
    }
  }
}
