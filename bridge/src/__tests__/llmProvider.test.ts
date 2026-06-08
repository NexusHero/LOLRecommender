import { createLlmProvider, buildUserPrompt, parseAnalysisResponse } from "../llmProvider";
import { makeGameState, makeBaseRec, makePlayer } from "./fixtures";

// jest.mock wird gehoisted — factory darf keine äußeren Variablen nutzen
jest.mock("../ddragonService", () => ({
  ddragon: {
    init: jest.fn().mockResolvedValue(undefined),
    getItemInfo: jest.fn().mockReturnValue(undefined),
    getChampionAbilities: jest.fn().mockResolvedValue(undefined),
    currentVersion: "test",
  },
}));

// Zugriff auf die gemockte Instanz nach dem Hoist
const mockDdragon = jest.requireMock("../ddragonService").ddragon as {
  getItemInfo: jest.Mock;
  getChampionAbilities: jest.Mock;
};

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
  beforeEach(() => {
    mockDdragon.getItemInfo.mockReturnValue(undefined);
    mockDdragon.getChampionAbilities.mockResolvedValue(undefined);
  });

  it("buildUserPrompt_StandardGameState_ContainsChampionTimeAndPhaseInfo", async () => {
    const state = makeGameState({
      localPlayer: { ...makeGameState().localPlayer, championName: "Lux" },
      enemies: [{ ...makeGameState().localPlayer, championName: "Soraka", team: "CHAOS" }],
      gameTime: 125,
    });

    const prompt = await buildUserPrompt(state, makeBaseRec());

    expect(prompt).toContain("Me: Lux");
    expect(prompt).toContain("Enemies: Soraka");
    expect(prompt).toContain("- Mortal Reminder");
    expect(prompt).toContain("Time: 2:05");
    expect(prompt).toContain("Game Phase: early");
  });

  it("buildUserPrompt_MidGameTime_ContainsMidPhase", async () => {
    const state = makeGameState({ gameTime: 15 * 60 });

    const prompt = await buildUserPrompt(state, makeBaseRec());

    expect(prompt).toContain("Game Phase: mid");
  });

  it("buildUserPrompt_LateGameTime_ContainsLatePhase", async () => {
    const state = makeGameState({ gameTime: 26 * 60 });

    const prompt = await buildUserPrompt(state, makeBaseRec());

    expect(prompt).toContain("Game Phase: late");
  });

  it("buildUserPrompt_NoItems_ShowsNone", async () => {
    const state = makeGameState();
    const rec = makeBaseRec({ items: [] });

    const prompt = await buildUserPrompt(state, rec);

    expect(prompt).toContain("Core items (heuristic baseline):\nNone");
  });

  it("buildUserPrompt_DDragonHasItemStats_StatsAppearedInPrompt", async () => {
    mockDdragon.getItemInfo.mockReturnValue({
      name: "Banshee's Veil",
      stats: "80 AP, 65 MR",
      plaintext: "Blocks a single negative ability",
    });
    const state = makeGameState();
    const rec = makeBaseRec({
      items: [{ id: 3102, name: "Banshee's Veil", reason: "AP enemies", priority: "core" }],
    });

    const prompt = await buildUserPrompt(state, rec);

    expect(prompt).toContain("80 AP, 65 MR");
    expect(prompt).toContain("Blocks a single negative ability");
  });

  it("buildUserPrompt_DDragonHasChampionAbilities_AbilitiesInPrompt", async () => {
    mockDdragon.getChampionAbilities.mockImplementation((name: string) => {
      if (name === "Lux") return Promise.resolve({ q: "Light Binding", w: "Prismatic Barrier", e: "Lucent Singularity", r: "Final Spark" });
      if (name === "Zed") return Promise.resolve({ q: "Razor Shuriken", w: "Living Shadow", e: "Shadow Slash", r: "Death Mark" });
      return Promise.resolve(undefined);
    });
    const state = makeGameState({
      localPlayer: makePlayer({ championName: "Lux", position: "MID" }),
      enemies: [makePlayer({ championName: "Zed", position: "MID", team: "CHAOS" })],
    });

    const prompt = await buildUserPrompt(state, makeBaseRec());

    expect(prompt).toContain("Q=Light Binding");
    expect(prompt).toContain("R=Final Spark");
    expect(prompt).toContain("Q=Razor Shuriken");
    expect(prompt).toContain("R=Death Mark");
  });

  it("buildUserPrompt_NoOpponent_ShowsUnknown", async () => {
    const state = makeGameState({
      localPlayer: makePlayer({ position: "TOP" }),
      enemies: [],
    });

    const prompt = await buildUserPrompt(state, makeBaseRec());

    expect(prompt).toContain("Opponent: unknown");
  });

  it("buildUserPrompt_DDragonUnavailableForAll_PromptStillBuilds", async () => {
    mockDdragon.getItemInfo.mockReturnValue(undefined);
    mockDdragon.getChampionAbilities.mockResolvedValue(undefined);
    const state = makeGameState({
      localPlayer: makePlayer({ championName: "Ahri" }),
      enemies: [makePlayer({ championName: "Zed", team: "CHAOS" })],
    });

    const prompt = await buildUserPrompt(state, makeBaseRec());

    // Prompt muss trotzdem gebaut werden — nur ohne Stats und Abilities
    expect(prompt).toContain("My champion: Ahri");
    expect(prompt).not.toContain("Q=");
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

  it("parseAnalysisResponse_SituationalItems_ExtractedAndCappedAtTwo", () => {
    const raw = JSON.stringify({
      itemReasoning: "Good items",
      situationalItems: [
        { id: 3111, name: "Mercurial Scimitar", reason: "Heavy CC" },
        { id: 3102, name: "Banshee's Veil", reason: "Poke comp" },
        { id: 3047, name: "Plated Steelcaps", reason: "AD heavy" },
      ],
      strategy: { winCondition: "mid", summary: "s", immediateAction: "a", lateGamePlan: "b" },
    });

    const result = parseAnalysisResponse(raw, fallback);

    expect(result.situationalItems).toHaveLength(2);
    expect(result.situationalItems![0]).toEqual({ id: 3111, name: "Mercurial Scimitar", reason: "Heavy CC", priority: "situational" });
  });

  it("parseAnalysisResponse_EmptySituationalItems_ReturnsEmptyArray", () => {
    const raw = JSON.stringify({
      itemReasoning: "Good items",
      situationalItems: [],
      strategy: { winCondition: "mid", summary: "s", immediateAction: "a", lateGamePlan: "b" },
    });

    const result = parseAnalysisResponse(raw, fallback);

    expect(result.situationalItems).toEqual([]);
  });

  it("parseAnalysisResponse_InvalidSituationalItem_Filtered", () => {
    const raw = JSON.stringify({
      itemReasoning: "Good items",
      situationalItems: [{ id: 0, name: "", reason: "bad" }],
      strategy: { winCondition: "mid", summary: "s", immediateAction: "a", lateGamePlan: "b" },
    });

    const result = parseAnalysisResponse(raw, fallback);

    expect(result.situationalItems).toEqual([]);
  });
});
