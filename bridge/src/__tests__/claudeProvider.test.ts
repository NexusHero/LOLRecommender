import { ClaudeProvider } from "../providers/claudeProvider";
import { makeGameState } from "./fixtures";
import type { ItemRecommendation } from "../types";
import Anthropic from "@anthropic-ai/sdk";

jest.mock("@anthropic-ai/sdk");

const baseRec: ItemRecommendation = {
  items: [{ id: 3033, name: "Mortal Reminder", reason: "vs healers", priority: "core" }],
  reasoning: "heuristic reasoning",
  source: "heuristic",
};

describe("ClaudeProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockAnthropicResponse(contentOverride: object = {}) {
    const mockCreate = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: "LLM reasoning text" }],
      usage: { input_tokens: 100, output_tokens: 30 },
      ...contentOverride,
    });
    
    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: { create: mockCreate }
    }));
    
    return mockCreate;
  }

  it("returns the LLM text on success", async () => {
    mockAnthropicResponse();
    const provider = new ClaudeProvider("test-key");

    const result = await provider.getExplanation(makeGameState(), baseRec);

    expect(result).toBe("LLM reasoning text");
  });

  it("falls back to heuristic reasoning when client throws", async () => {
    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: { create: jest.fn().mockRejectedValue(new Error("API unavailable")) }
    }));
    const provider = new ClaudeProvider("test-key");

    const result = await provider.getExplanation(makeGameState(), baseRec);

    expect(result).toBe("heuristic reasoning");
  });

  it("falls back when content array is empty", async () => {
    mockAnthropicResponse({ content: [], usage: { input_tokens: 0, output_tokens: 0 } });
    const provider = new ClaudeProvider("test-key");

    const result = await provider.getExplanation(makeGameState(), baseRec);

    expect(result).toBe("heuristic reasoning");
  });

  it("falls back when first content block is not text type", async () => {
    mockAnthropicResponse({
        content: [{ type: "tool_use", id: "x", name: "test", input: {} }],
        usage: { input_tokens: 0, output_tokens: 0 },
      });
    const provider = new ClaudeProvider("test-key");

    const result = await provider.getExplanation(makeGameState(), baseRec);

    expect(result).toBe("heuristic reasoning");
  });

  it("includes champion and enemy names in the API request", async () => {
    const mockCreate = mockAnthropicResponse();
    const provider = new ClaudeProvider("test-key");
    const state = makeGameState({
      localPlayer: { ...makeGameState().localPlayer, championName: "Lux" },
      enemies: [{ ...makeGameState().localPlayer, championName: "Soraka", team: "CHAOS" }],
    });

    await provider.getExplanation(state, baseRec);

    const callArg = mockCreate.mock.calls[0][0];
    const userContent = callArg.messages[0].content as string;
    expect(userContent).toContain("Lux");
    expect(userContent).toContain("Soraka");
  });
});
