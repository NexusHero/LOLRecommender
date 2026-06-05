import { OpenAiProvider } from "../providers/openaiProvider";
import { makeGameState } from "./fixtures";
import type { ItemRecommendation } from "../types";
import OpenAI from "openai";

jest.mock("openai");

const baseRec: ItemRecommendation = {
  items: [{ id: 3033, name: "Mortal Reminder", reason: "vs healers", priority: "core" }],
  reasoning: "heuristic reasoning",
  source: "heuristic",
};

describe("OpenAiProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockOpenAIResponse(contentOverride: string | null = "LLM reasoning text", throwError = false) {
    const mockCreate = jest.fn();
    
    if (throwError) {
      mockCreate.mockRejectedValue(new Error("API unavailable"));
    } else {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: contentOverride } }],
        usage: { prompt_tokens: 100, completion_tokens: 30 },
      });
    }
    
    (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
      chat: { completions: { create: mockCreate } }
    }));
    
    return mockCreate;
  }

  it("returns the LLM text on success", async () => {
    mockOpenAIResponse();
    const provider = new OpenAiProvider("test-key");

    const result = await provider.getExplanation(makeGameState(), baseRec);

    expect(result).toBe("LLM reasoning text");
  });

  it("falls back to heuristic reasoning when client throws", async () => {
    mockOpenAIResponse(null, true);
    const provider = new OpenAiProvider("test-key");

    const result = await provider.getExplanation(makeGameState(), baseRec);

    expect(result).toBe("heuristic reasoning");
  });

  it("falls back when content is null", async () => {
    mockOpenAIResponse(null);
    const provider = new OpenAiProvider("test-key");

    const result = await provider.getExplanation(makeGameState(), baseRec);

    expect(result).toBe("heuristic reasoning");
  });

  it("includes champion and enemy names in the API request", async () => {
    const mockCreate = mockOpenAIResponse();
    const provider = new OpenAiProvider("test-key");
    const state = makeGameState({
      localPlayer: { ...makeGameState().localPlayer, championName: "Lux" },
      enemies: [{ ...makeGameState().localPlayer, championName: "Soraka", team: "CHAOS" }],
    });

    await provider.getExplanation(state, baseRec);

    const callArg = mockCreate.mock.calls[0][0];
    const userContent = callArg.messages[1].content as string;
    expect(userContent).toContain("Lux");
    expect(userContent).toContain("Soraka");
  });
});
