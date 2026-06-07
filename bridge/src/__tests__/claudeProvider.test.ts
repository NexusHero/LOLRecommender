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

  it("getAnalysis_ClientThrows_FallsBackToHeuristicReasoningAndStrategy", async () => {
    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: { create: jest.fn().mockRejectedValue(new Error("API unavailable")) },
    }));
    const provider = new ClaudeProvider("test-key");

    const result = await provider.getAnalysis(makeGameState(), baseRec);

    expect(result.reasoning).toBe("heuristic reasoning");
    expect(result.strategy).toEqual(baseRec.strategy);
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
});
