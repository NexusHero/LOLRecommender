import { createLlmProvider, buildUserPrompt } from "../llmProvider";
import { makeGameState } from "./fixtures";
import type { ItemRecommendation } from "../types";

describe("createLlmProvider", () => {
  it("createLlmProvider_Claude_ReturnsProviderWithCorrectName", async () => {
    const provider = await createLlmProvider("claude", "test-key");

    expect(provider.name).toBe("claude");
  });

  it("createLlmProvider_OpenAi_ReturnsProviderWithCorrectName", async () => {
    const provider = await createLlmProvider("openai", "test-key");

    expect(provider.name).toBe("openai");
  });

  it("createLlmProvider_Gemini_ReturnsProviderWithCorrectName", async () => {
    const provider = await createLlmProvider("gemini", "test-key");

    expect(provider.name).toBe("gemini");
  });

  it("createLlmProvider_UnknownProvider_ThrowsUnknownProviderError", async () => {
    await expect(createLlmProvider("unknown" as any, "test-key")).rejects.toThrow(
      /Unknown LLM provider/,
    );
  });
});

describe("buildUserPrompt", () => {
  it("buildUserPrompt_StandardGameState_ContainsChampionAndTimeInfo", () => {
    const state = makeGameState({
      localPlayer: { ...makeGameState().localPlayer, championName: "Lux" },
      enemies: [{ ...makeGameState().localPlayer, championName: "Soraka", team: "CHAOS" }],
      gameTime: 125,
    });
    const baseRec: ItemRecommendation = {
      items: [{ id: 3033, name: "Mortal Reminder", reason: "vs healers", priority: "core" }],
      reasoning: "heuristic reasoning",
      source: "heuristic",
    };

    const prompt = buildUserPrompt(state, baseRec);

    expect(prompt).toContain("Me: Lux");
    expect(prompt).toContain("Enemies: Soraka");
    expect(prompt).toContain("Suggested items: Mortal Reminder");
    expect(prompt).toContain("Time: 2:05");
  });
});
