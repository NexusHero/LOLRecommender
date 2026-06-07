import { GeminiProvider } from "../providers/geminiProvider";
import { makeGameState } from "./fixtures";
import type { ItemRecommendation } from "../types";
import { GoogleGenerativeAI } from "@google/generative-ai";

jest.mock("@google/generative-ai");

const baseRec: ItemRecommendation = {
  items: [{ id: 3033, name: "Mortal Reminder", reason: "vs healers", priority: "core" }],
  reasoning: "heuristic reasoning",
  source: "heuristic",
};

describe("GeminiProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockGeminiResponse(content: string | null = "LLM reasoning text", throwError = false) {
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

  it("getExplanation_ValidApiKey_ReturnsLlmText", async () => {
    mockGeminiResponse();
    const provider = new GeminiProvider("test-key");

    const result = await provider.getExplanation(makeGameState(), baseRec);

    expect(result).toBe("LLM reasoning text");
  });

  it("getExplanation_ClientThrows_FallsBackToHeuristicReasoning", async () => {
    mockGeminiResponse(null, true);
    const provider = new GeminiProvider("test-key");

    const result = await provider.getExplanation(makeGameState(), baseRec);

    expect(result).toBe("heuristic reasoning");
  });

  it("getExplanation_EmptyContent_FallsBackToHeuristicReasoning", async () => {
    mockGeminiResponse("");
    const provider = new GeminiProvider("test-key");

    const result = await provider.getExplanation(makeGameState(), baseRec);

    expect(result).toBe("heuristic reasoning");
  });

  it("getExplanation_StandardRequest_IncludesChampionAndEnemyInPayload", async () => {
    const mockGenerateContent = mockGeminiResponse();
    const provider = new GeminiProvider("test-key");
    const state = makeGameState({
      localPlayer: { ...makeGameState().localPlayer, championName: "Lux" },
      enemies: [{ ...makeGameState().localPlayer, championName: "Soraka", team: "CHAOS" }],
    });

    await provider.getExplanation(state, baseRec);

    const callArg = mockGenerateContent.mock.calls[0][0];
    const userContent = callArg.contents[0].parts[0].text as string;
    expect(userContent).toContain("Lux");
    expect(userContent).toContain("Soraka");
  });
});
