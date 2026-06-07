import { GeminiProvider } from "../providers/geminiProvider";
import { makeGameState, makeBaseRec } from "./fixtures";
import { GoogleGenerativeAI } from "@google/generative-ai";

jest.mock("@google/generative-ai");

const baseRec = makeBaseRec();

const validJsonResponse = JSON.stringify({
  itemReasoning: "LLM reasoning text",
  strategy: {
    winCondition: "late",
    summary: "You scale hard — be patient.",
    immediateAction: "Farm and avoid fights.",
    lateGamePlan: "Dominate with full build in late game.",
  },
});

describe("GeminiProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockGeminiResponse(content: string | null = validJsonResponse, throwError = false) {
    const mockGenerateContent = jest.fn();
    if (throwError) {
      mockGenerateContent.mockRejectedValue(new Error("API unavailable"));
    } else {
      mockGenerateContent.mockResolvedValue({ response: { text: () => content } });
    }
    const mockGetGenerativeModel = jest.fn().mockReturnValue({ generateContent: mockGenerateContent });
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    }));
    return mockGenerateContent;
  }

  it("getAnalysis_ValidApiKey_ReturnsLlmReasoningAndStrategy", async () => {
    mockGeminiResponse();
    const provider = new GeminiProvider("test-key");

    const result = await provider.getAnalysis(makeGameState(), baseRec);

    expect(result.reasoning).toBe("LLM reasoning text");
    expect(result.strategy.winCondition).toBe("late");
  });

  it("getAnalysis_ClientThrows_PropagatesErrorWithProviderPrefix", async () => {
    mockGeminiResponse(null, true);
    const provider = new GeminiProvider("test-key");

    await expect(provider.getAnalysis(makeGameState(), baseRec)).rejects.toThrow("Gemini: API unavailable");
  });

  it("getAnalysis_EmptyContent_FallsBackToHeuristicReasoningAndStrategy", async () => {
    mockGeminiResponse("");
    const provider = new GeminiProvider("test-key");

    const result = await provider.getAnalysis(makeGameState(), baseRec);

    expect(result.reasoning).toBe("heuristic reasoning");
    expect(result.strategy).toEqual(baseRec.strategy);
  });

  it("getAnalysis_InvalidJson_FallsBackToHeuristicReasoningAndStrategy", async () => {
    mockGeminiResponse("plain text not json");
    const provider = new GeminiProvider("test-key");

    const result = await provider.getAnalysis(makeGameState(), baseRec);

    expect(result.reasoning).toBe("heuristic reasoning");
    expect(result.strategy).toEqual(baseRec.strategy);
  });

  it("getAnalysis_StandardRequest_IncludesChampionAndEnemyInPayload", async () => {
    const mockGenerateContent = mockGeminiResponse();
    const provider = new GeminiProvider("test-key");
    const state = makeGameState({
      localPlayer: { ...makeGameState().localPlayer, championName: "Lux" },
      enemies: [{ ...makeGameState().localPlayer, championName: "Soraka", team: "CHAOS" }],
    });

    await provider.getAnalysis(state, baseRec);

    const callArg = mockGenerateContent.mock.calls[0][0];
    const userContent = callArg.contents[0].parts[0].text as string;
    expect(userContent).toContain("Lux");
    expect(userContent).toContain("Soraka");
  });
});
