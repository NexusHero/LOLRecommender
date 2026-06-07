import { OpenAiProvider } from "../providers/openaiProvider";
import { makeGameState, makeBaseRec } from "./fixtures";
import OpenAI from "openai";

jest.mock("openai");

const baseRec = makeBaseRec();

const validJsonResponse = JSON.stringify({
  itemReasoning: "LLM reasoning text",
  strategy: {
    winCondition: "early",
    summary: "Press your lead now.",
    immediateAction: "Take towers and objectives.",
    lateGamePlan: "Close out via Baron and mid push.",
  },
});

describe("OpenAiProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockOpenAIResponse(content: string | null = validJsonResponse, throwError = false) {
    const mockCreate = jest.fn();
    if (throwError) {
      mockCreate.mockRejectedValue(new Error("API unavailable"));
    } else {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content } }],
        usage: { prompt_tokens: 100, completion_tokens: 50 },
      });
    }
    (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    }));
    return mockCreate;
  }

  it("getAnalysis_ValidApiKey_ReturnsLlmReasoningAndStrategy", async () => {
    mockOpenAIResponse();
    const provider = new OpenAiProvider("test-key");

    const result = await provider.getAnalysis(makeGameState(), baseRec);

    expect(result.reasoning).toBe("LLM reasoning text");
    expect(result.strategy.winCondition).toBe("early");
  });

  it("getAnalysis_ClientThrows_PropagatesErrorWithProviderPrefix", async () => {
    mockOpenAIResponse(null, true);
    const provider = new OpenAiProvider("test-key");

    await expect(provider.getAnalysis(makeGameState(), baseRec)).rejects.toThrow("OpenAI: API unavailable");
  });

  it("getAnalysis_NullContent_FallsBackToHeuristicReasoningAndStrategy", async () => {
    mockOpenAIResponse(null);
    const provider = new OpenAiProvider("test-key");

    const result = await provider.getAnalysis(makeGameState(), baseRec);

    expect(result.reasoning).toBe("heuristic reasoning");
    expect(result.strategy).toEqual(baseRec.strategy);
  });

  it("getAnalysis_InvalidJson_FallsBackToHeuristicReasoningAndStrategy", async () => {
    mockOpenAIResponse("not valid json at all");
    const provider = new OpenAiProvider("test-key");

    const result = await provider.getAnalysis(makeGameState(), baseRec);

    expect(result.reasoning).toBe("heuristic reasoning");
    expect(result.strategy).toEqual(baseRec.strategy);
  });

  it("getAnalysis_StandardRequest_IncludesChampionAndEnemyInPayload", async () => {
    const mockCreate = mockOpenAIResponse();
    const provider = new OpenAiProvider("test-key");
    const state = makeGameState({
      localPlayer: { ...makeGameState().localPlayer, championName: "Lux" },
      enemies: [{ ...makeGameState().localPlayer, championName: "Soraka", team: "CHAOS" }],
    });

    await provider.getAnalysis(state, baseRec);

    const callArg = mockCreate.mock.calls[0][0];
    const userContent = callArg.messages[1].content as string;
    expect(userContent).toContain("Lux");
    expect(userContent).toContain("Soraka");
  });
});
