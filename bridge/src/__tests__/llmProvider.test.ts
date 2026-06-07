import { createLlmProvider, buildUserPrompt, parseAnalysisResponse } from "../llmProvider";
import { makeGameState, makeBaseRec } from "./fixtures";

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
  it("buildUserPrompt_StandardGameState_ContainsChampionTimeAndPhaseInfo", () => {
    const state = makeGameState({
      localPlayer: { ...makeGameState().localPlayer, championName: "Lux" },
      enemies: [{ ...makeGameState().localPlayer, championName: "Soraka", team: "CHAOS" }],
      gameTime: 125,
    });

    const prompt = buildUserPrompt(state, makeBaseRec());

    expect(prompt).toContain("Me: Lux");
    expect(prompt).toContain("Enemies: Soraka");
    expect(prompt).toContain("Suggested items: Mortal Reminder");
    expect(prompt).toContain("Time: 2:05");
    expect(prompt).toContain("Game Phase: early");
  });

  it("buildUserPrompt_MidGameTime_ContainsMidPhase", () => {
    const state = makeGameState({ gameTime: 15 * 60 });

    const prompt = buildUserPrompt(state, makeBaseRec());

    expect(prompt).toContain("Game Phase: mid");
  });

  it("buildUserPrompt_LateGameTime_ContainsLatePhase", () => {
    const state = makeGameState({ gameTime: 26 * 60 });

    const prompt = buildUserPrompt(state, makeBaseRec());

    expect(prompt).toContain("Game Phase: late");
  });
});

describe("parseAnalysisResponse", () => {
  const fallback = makeBaseRec();

  it("parseAnalysisResponse_ValidJson_ExtractsReasoningAndStrategy", () => {
    const raw = JSON.stringify({
      itemReasoning: "Buy this now",
      strategy: {
        winCondition: "late",
        summary: "Scale hard.",
        immediateAction: "Farm under tower.",
        lateGamePlan: "Destroy with full build.",
      },
    });

    const result = parseAnalysisResponse(raw, fallback);

    expect(result.reasoning).toBe("Buy this now");
    expect(result.strategy.winCondition).toBe("late");
    expect(result.strategy.summary).toBe("Scale hard.");
  });

  it("parseAnalysisResponse_JsonWithMarkdownCodeBlock_StillParses", () => {
    const raw = "```json\n{\"itemReasoning\":\"Good items\",\"strategy\":{\"winCondition\":\"mid\",\"summary\":\"s\",\"immediateAction\":\"a\",\"lateGamePlan\":\"b\"}}\n```";

    const result = parseAnalysisResponse(raw, fallback);

    expect(result.reasoning).toBe("Good items");
  });

  it("parseAnalysisResponse_InvalidJson_FallsBackToHeuristic", () => {
    const result = parseAnalysisResponse("not json at all", fallback);

    expect(result.reasoning).toBe(fallback.reasoning);
    expect(result.strategy).toEqual(fallback.strategy);
  });

  it("parseAnalysisResponse_MissingFields_FallsBackToHeuristicValues", () => {
    const raw = JSON.stringify({ itemReasoning: "partial" });

    const result = parseAnalysisResponse(raw, fallback);

    expect(result.reasoning).toBe("partial");
    expect(result.strategy.winCondition).toBe(fallback.strategy.winCondition);
  });
});
