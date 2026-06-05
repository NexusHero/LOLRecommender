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

  function mockGeminiResponse(contentOverride: string | null = "LLM reasoning text", throwError = false) {
    const mockGenerateContent = jest.fn();
    
    if (throwError) {
      mockGenerateContent.mockRejectedValue(new Error("API unavailable"));
    } else {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => contentOverride }
      });
    }
    
    const mockGetGenerativeModel = jest.fn().mockReturnValue({
      generateContent: mockGenerateContent
    });

    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel
    }));
    
    return mockGenerateContent;
  }

  it("returns the LLM text on success", async () => {
    mockGeminiResponse();
    const provider = new GeminiProvider("test-key");

    const result = await provider.getExplanation(makeGameState(), baseRec);

    expect(result).toBe("LLM reasoning text");
  });

  it("falls back to heuristic reasoning when client throws", async () => {
    mockGeminiResponse(null, true);
    const provider = new GeminiProvider("test-key");

    const result = await provider.getExplanation(makeGameState(), baseRec);

    expect(result).toBe("heuristic reasoning");
  });

  it("falls back when content is empty", async () => {
    mockGeminiResponse("");
    const provider = new GeminiProvider("test-key");

    const result = await provider.getExplanation(makeGameState(), baseRec);

    expect(result).toBe("heuristic reasoning");
  });

  it("includes champion and enemy names in the API request", async () => {
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
