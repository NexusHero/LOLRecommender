import { createLlmProvider, buildUserPrompt } from "../llmProvider";
import { makeGameState } from "./fixtures";
import type { ItemRecommendation } from "../types";

describe("llmProvider factory", () => {
  it("creates Claude provider", async () => {
    const provider = await createLlmProvider("claude", "test-key");
    expect(provider.name).toBe("claude");
  });

  it("creates OpenAI provider", async () => {
    const provider = await createLlmProvider("openai", "test-key");
    expect(provider.name).toBe("openai");
  });

  it("creates Gemini provider", async () => {
    const provider = await createLlmProvider("gemini", "test-key");
    expect(provider.name).toBe("gemini");
  });

  it("throws for unknown provider", async () => {
    await expect(createLlmProvider("unknown" as any, "test-key")).rejects.toThrow(/Unknown LLM provider/);
  });
});

describe("buildUserPrompt", () => {
  it("formats prompt correctly", () => {
    const state = makeGameState({
      localPlayer: { ...makeGameState().localPlayer, championName: "Lux" },
      enemies: [{ ...makeGameState().localPlayer, championName: "Soraka", team: "CHAOS" }],
      gameTime: 125, // 2:05
    });

    const baseRec: ItemRecommendation = {
      items: [{ id: 3033, name: "Mortal Reminder", reason: "vs healers", priority: "core" }],
      reasoning: "heuristic reasoning",
      source: "heuristic",
    };

    const prompt = buildUserPrompt(state, baseRec);
    
    expect(prompt).toContain("My champion: Lux");
    expect(prompt).toContain("Enemies: Soraka");
    expect(prompt).toContain("Suggested items: Mortal Reminder");
    expect(prompt).toContain("Game time: 2:05");
  });
});
