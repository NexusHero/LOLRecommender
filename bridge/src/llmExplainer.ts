import Anthropic from "@anthropic-ai/sdk";
import type { ParsedGameState, ItemRecommendation } from "./types.js";

const SYSTEM_PROMPT = `Du bist ein erfahrener League of Legends Coach.
Analysiere die gegnerische Teamzusammensetzung und erkläre kurz (2-3 Sätze),
warum die vorgeschlagenen Items sinnvoll sind. Sei konkret und prägnant.
Antworte auf Deutsch. Verwende keine Markdown-Formatierung.`;

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
            // Prompt Caching: System-Prompt wird nach erstem Call gecacht
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [
          {
            role: "user",
            content: `Mein Champion: ${state.localPlayer.championName}
Gegner: ${enemyChamps}
Vorgeschlagene Items: ${itemNames}
Spielzeit: ${Math.floor(state.gameTime / 60)}:${String(Math.floor(state.gameTime % 60)).padStart(2, "0")}

Erkläre kurz warum diese Items gegen diese Comp sinnvoll sind.`,
          },
        ],
      });

      if (response.content.length === 0) return heuristicRec.reasoning;
      const text = response.content[0];
      if (text.type !== "text") return heuristicRec.reasoning;

      console.log(
        `[LLM] Input: ${response.usage.input_tokens} Tokens (Cache-Hit: ${(response.usage as unknown as Record<string, unknown>).cache_read_input_tokens ?? 0}), Output: ${response.usage.output_tokens}`
      );

      return text.text;
    } catch (err) {
      console.error("[LLM] Fehler:", err);
      return heuristicRec.reasoning;
    }
  }
}
