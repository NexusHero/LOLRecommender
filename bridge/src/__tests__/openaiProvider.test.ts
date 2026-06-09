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

  it("listModels_ValidKey_ReturnsOnlyChatModels", async () => {
    const mockList = jest.fn().mockResolvedValue({
      data: [
        { id: "gpt-4o", created: 1700000002, object: "model" },
        { id: "gpt-4o-mini", created: 1700000001, object: "model" },
        { id: "text-embedding-ada-002", created: 1700000000, object: "model" },
        { id: "whisper-1", created: 1699000000, object: "model" },
        { id: "ft:gpt-4:company:name:abc123", created: 1700000003, object: "model" },
      ],
    });
    (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
      chat: { completions: { create: jest.fn() } },
      models: { list: mockList },
    }));
    const provider = new OpenAiProvider("test-key");

    const models = await provider.listModels();
    const ids = models.map((m) => m.id);

    expect(ids).toContain("gpt-4o");
    expect(ids).toContain("gpt-4o-mini");
    expect(ids).not.toContain("text-embedding-ada-002");
    expect(ids).not.toContain("whisper-1");
    expect(ids).not.toContain("ft:gpt-4:company:name:abc123");
  });

  it("listModels_ValidKey_ReturnsSortedNewestFirst", async () => {
    const mockList = jest.fn().mockResolvedValue({
      data: [
        { id: "gpt-4o-mini", created: 1700000001, object: "model" },
        { id: "gpt-4o", created: 1700000002, object: "model" },
      ],
    });
    (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
      chat: { completions: { create: jest.fn() } },
      models: { list: mockList },
    }));
    const provider = new OpenAiProvider("test-key");

    const models = await provider.listModels();

    expect(models[0].id).toBe("gpt-4o");
    expect(models[1].id).toBe("gpt-4o-mini");
  });

  it("getAnalysis_DefaultModel_UsesGpt4oMini", async () => {
    const mockCreate = mockOpenAIResponse();
    const provider = new OpenAiProvider("test-key");

    await provider.getAnalysis(makeGameState(), baseRec);

    expect(mockCreate.mock.calls[0][0].model).toBe("gpt-4o-mini");
  });

  it("getAnalysis_CustomModel_UsesSpecifiedModel", async () => {
    const mockCreate = mockOpenAIResponse();
    const provider = new OpenAiProvider("test-key", "gpt-4o");

    await provider.getAnalysis(makeGameState(), baseRec);

    expect(mockCreate.mock.calls[0][0].model).toBe("gpt-4o");
  });
});
