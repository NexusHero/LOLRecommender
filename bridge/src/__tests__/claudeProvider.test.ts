import { ClaudeProvider } from "../providers/claudeProvider";
import { makeGameState, makeBaseRec } from "./fixtures";
import Anthropic from "@anthropic-ai/sdk";

jest.mock("@anthropic-ai/sdk");

const baseRec = makeBaseRec();

const validJsonResponse = JSON.stringify({
  itemReasoning: "LLM reasoning text",
  strategy: {
    winCondition: "mid",
    summary: "Scale into mid game.",
    immediateAction: "Farm safely.",
    lateGamePlan: "Fight with full build.",
  },
});

describe("ClaudeProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockAnthropicResponse(contentOverride: object = {}) {
    const mockCreate = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: validJsonResponse }],
      usage: { input_tokens: 100, output_tokens: 50 },
      ...contentOverride,
    });
    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: { create: mockCreate },
    }));
    return mockCreate;
  }

  it("getAnalysis_ValidApiKey_ReturnsLlmReasoningAndStrategy", async () => {
    mockAnthropicResponse();
    const provider = new ClaudeProvider("test-key");

    const result = await provider.getAnalysis(makeGameState(), baseRec);

    expect(result.reasoning).toBe("LLM reasoning text");
    expect(result.strategy.winCondition).toBe("mid");
    expect(result.strategy.immediateAction).toBe("Farm safely.");
  });

  it("getAnalysis_ClientThrows_PropagatesErrorWithProviderPrefix", async () => {
    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: { create: jest.fn().mockRejectedValue(new Error("API unavailable")) },
    }));
    const provider = new ClaudeProvider("test-key");

    await expect(provider.getAnalysis(makeGameState(), baseRec)).rejects.toThrow("Claude: API unavailable");
  });

  it("getAnalysis_EmptyContentArray_FallsBackToHeuristicReasoningAndStrategy", async () => {
    mockAnthropicResponse({ content: [], usage: { input_tokens: 0, output_tokens: 0 } });
    const provider = new ClaudeProvider("test-key");

    const result = await provider.getAnalysis(makeGameState(), baseRec);

    expect(result.reasoning).toBe("heuristic reasoning");
    expect(result.strategy).toEqual(baseRec.strategy);
  });

  it("getAnalysis_NonTextContentBlock_FallsBackToHeuristicReasoningAndStrategy", async () => {
    mockAnthropicResponse({
      content: [{ type: "tool_use", id: "x", name: "test", input: {} }],
      usage: { input_tokens: 0, output_tokens: 0 },
    });
    const provider = new ClaudeProvider("test-key");

    const result = await provider.getAnalysis(makeGameState(), baseRec);

    expect(result.reasoning).toBe("heuristic reasoning");
    expect(result.strategy).toEqual(baseRec.strategy);
  });

  it("getAnalysis_InvalidJson_FallsBackToHeuristicReasoningAndStrategy", async () => {
    mockAnthropicResponse({ content: [{ type: "text", text: "not valid json" }], usage: { input_tokens: 0, output_tokens: 0 } });
    const provider = new ClaudeProvider("test-key");

    const result = await provider.getAnalysis(makeGameState(), baseRec);

    expect(result.reasoning).toBe("heuristic reasoning");
    expect(result.strategy).toEqual(baseRec.strategy);
  });

  it("getAnalysis_StandardRequest_IncludesChampionAndEnemyInPayload", async () => {
    const mockCreate = mockAnthropicResponse();
    const provider = new ClaudeProvider("test-key");
    const state = makeGameState({
      localPlayer: { ...makeGameState().localPlayer, championName: "Lux" },
      enemies: [{ ...makeGameState().localPlayer, championName: "Soraka", team: "CHAOS" }],
    });

    await provider.getAnalysis(state, baseRec);

    const callArg = mockCreate.mock.calls[0][0];
    const userContent = callArg.messages[0].content as string;
    expect(userContent).toContain("Lux");
    expect(userContent).toContain("Soraka");
  });

  it("getAnalysis_DefaultModel_UsesHaikuModel", async () => {
    const mockCreate = mockAnthropicResponse();
    const provider = new ClaudeProvider("test-key");

    await provider.getAnalysis(makeGameState(), baseRec);

    expect(mockCreate.mock.calls[0][0].model).toBe("claude-haiku-4-5-20251001");
  });

  it("getAnalysis_CustomModel_UsesSpecifiedModel", async () => {
    const mockCreate = mockAnthropicResponse();
    const provider = new ClaudeProvider("test-key", "claude-sonnet-4-6");

    await provider.getAnalysis(makeGameState(), baseRec);

    expect(mockCreate.mock.calls[0][0].model).toBe("claude-sonnet-4-6");
  });

  it("listModels_ValidKey_ReturnsMappedModelInfoList", async () => {
    const mockList = jest.fn().mockResolvedValue({
      data: [
        { id: "claude-opus-4-8", display_name: "Claude Opus 4.8" },
        { id: "claude-sonnet-4-6", display_name: "Claude Sonnet 4.6" },
        { id: "claude-haiku-4-5-20251001", display_name: "Claude Haiku 4.5" },
      ],
    });
    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: { create: jest.fn() },
      models: { list: mockList },
    }));
    const provider = new ClaudeProvider("test-key");

    const models = await provider.listModels();

    expect(models).toHaveLength(3);
    expect(models[0]).toEqual({ id: "claude-opus-4-8", displayName: "Claude Opus 4.8" });
    expect(models[1]).toEqual({ id: "claude-sonnet-4-6", displayName: "Claude Sonnet 4.6" });
  });

  it("listModels_ApiError_PropagatesError", async () => {
    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: { create: jest.fn() },
      models: { list: jest.fn().mockRejectedValue(new Error("unauthorized")) },
    }));
    const provider = new ClaudeProvider("bad-key");

    await expect(provider.listModels()).rejects.toThrow("unauthorized");
  });

  it("getAnalysis_CreditBalanceError_ShowsHumanReadableMessage", async () => {
    const apiError = Object.assign(new Error("credit error"), {
      status: 400,
      error: {
        type: "invalid_request_error",
        message: "Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.",
      },
    });
    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: { create: jest.fn().mockRejectedValue(apiError) },
    }));
    const provider = new ClaudeProvider("test-key");

    await expect(provider.getAnalysis(makeGameState(), baseRec)).rejects.toThrow(
      "Claude: Your credit balance is too low to access the Anthropic API.",
    );
  });
});
