import { LlmExplainer } from "../llmExplainer";
import { makeGameState } from "./fixtures";
import type { ItemRecommendation } from "../types";

const baseRec: ItemRecommendation = {
  items: [{ id: 3033, name: "Mortal Reminder", reason: "vs healers", priority: "core" }],
  reasoning: "heuristic reasoning",
  source: "heuristic",
};

function makeClient(contentOverride: object = {}) {
  return {
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: "text", text: "LLM reasoning text" }],
        usage: { input_tokens: 100, output_tokens: 30 },
        ...contentOverride,
      }),
    },
  } as any;
}

describe("LlmExplainer", () => {
  it("returns the LLM text on success", async () => {
    const explainer = new LlmExplainer(makeClient());

    const result = await explainer.getExplanation(makeGameState(), baseRec);

    expect(result).toBe("LLM reasoning text");
  });

  it("falls back to heuristic reasoning when client throws", async () => {
    const client = {
      messages: { create: jest.fn().mockRejectedValue(new Error("API unavailable")) },
    } as any;
    const explainer = new LlmExplainer(client);

    const result = await explainer.getExplanation(makeGameState(), baseRec);

    expect(result).toBe("heuristic reasoning");
  });

  it("falls back when content array is empty", async () => {
    const explainer = new LlmExplainer(
      makeClient({ content: [], usage: { input_tokens: 0, output_tokens: 0 } })
    );

    const result = await explainer.getExplanation(makeGameState(), baseRec);

    expect(result).toBe("heuristic reasoning");
  });

  it("falls back when first content block is not text type", async () => {
    const explainer = new LlmExplainer(
      makeClient({
        content: [{ type: "tool_use", id: "x", name: "test", input: {} }],
        usage: { input_tokens: 0, output_tokens: 0 },
      })
    );

    const result = await explainer.getExplanation(makeGameState(), baseRec);

    expect(result).toBe("heuristic reasoning");
  });

  it("includes champion and enemy names in the API request", async () => {
    const client = makeClient();
    const explainer = new LlmExplainer(client);
    const state = makeGameState({
      localPlayer: { ...makeGameState().localPlayer, championName: "Lux" },
      enemies: [{ ...makeGameState().localPlayer, championName: "Soraka", team: "CHAOS" }],
    });

    await explainer.getExplanation(state, baseRec);

    const callArg = client.messages.create.mock.calls[0][0];
    const userContent = callArg.messages[0].content as string;
    expect(userContent).toContain("Lux");
    expect(userContent).toContain("Soraka");
  });
});
