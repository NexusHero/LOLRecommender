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

  it("getAnalysis_RateLimitError_ShowsFriendlyMessageWithRetryDelay", async () => {
    const rateLimitErr = Object.assign(
      new Error('[429 Too Many Requests] quota exceeded. Please retry in 7.77s. [{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"7s"}]'),
      { status: 429 },
    );
    const mockGenerateContent = jest.fn().mockRejectedValue(rateLimitErr);
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({ generateContent: mockGenerateContent }),
    }));
    const provider = new GeminiProvider("test-key");

    await expect(provider.getAnalysis(makeGameState(), baseRec)).rejects.toThrow(
      "Gemini: 429 · Rate limit exceeded",
    );
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

  it("listModels_ValidKey_ReturnsOnlyGenerativeModelsWithStrippedPrefix", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [
          { name: "models/gemini-2.0-flash", displayName: "Gemini 2.0 Flash", supportedGenerationMethods: ["generateContent", "countTokens"] },
          { name: "models/gemini-1.5-pro", displayName: "Gemini 1.5 Pro", supportedGenerationMethods: ["generateContent"] },
          { name: "models/embedding-001", displayName: "Embedding 001", supportedGenerationMethods: ["embedContent"] },
          { name: "models/aqa", displayName: "AQA", supportedGenerationMethods: ["generateAnswer"] },
        ],
      }),
    });
    global.fetch = mockFetch;
    const provider = new GeminiProvider("test-key");

    const models = await provider.listModels();
    const ids = models.map((m) => m.id);

    expect(ids).toContain("gemini-2.0-flash");
    expect(ids).toContain("gemini-1.5-pro");
    expect(ids).not.toContain("embedding-001");
    expect(ids).not.toContain("aqa");
    expect(models[0].displayName).toBe("Gemini 2.0 Flash");
  });

  it("listModels_ApiKeyPassedInUrl", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [] }),
    });
    global.fetch = mockFetch;
    const provider = new GeminiProvider("my-secret-key");

    await provider.listModels();

    const calledUrl = (mockFetch.mock.calls[0][0] as string);
    expect(calledUrl).toContain("key=my-secret-key");
  });

  it("listModels_NonOkResponse_ThrowsError", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 });
    const provider = new GeminiProvider("bad-key");

    await expect(provider.listModels()).rejects.toThrow("403");
  });

  it("getAnalysis_DefaultModel_UsesGeminiFlash", async () => {
    const mockGetGenerativeModel = jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({ response: { text: () => validJsonResponse } }),
    });
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    }));
    const provider = new GeminiProvider("test-key");

    await provider.getAnalysis(makeGameState(), baseRec);

    expect(mockGetGenerativeModel.mock.calls[0][0].model).toBe("gemini-2.0-flash");
  });

  it("getAnalysis_CustomModel_UsesSpecifiedModel", async () => {
    const mockGetGenerativeModel = jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({ response: { text: () => validJsonResponse } }),
    });
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    }));
    const provider = new GeminiProvider("test-key", "gemini-1.5-pro");

    await provider.getAnalysis(makeGameState(), baseRec);

    expect(mockGetGenerativeModel.mock.calls[0][0].model).toBe("gemini-1.5-pro");
  });

  it("getAnalysis_StandardRequest_PassesSystemInstructionToGetGenerativeModel", async () => {
    const mockGetGenerativeModel = jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({ response: { text: () => validJsonResponse } }),
    });
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    }));
    const provider = new GeminiProvider("test-key");

    await provider.getAnalysis(makeGameState(), baseRec);

    const modelConfig = mockGetGenerativeModel.mock.calls[0][0];
    expect(typeof modelConfig.systemInstruction).toBe("string");
    expect((modelConfig.systemInstruction as string).length).toBeGreaterThan(0);
  });

  it("getAnalysis_StandardRequest_SetsJsonResponseMimeTypeAndMaxTokens", async () => {
    const mockGenerateContent = mockGeminiResponse();
    const provider = new GeminiProvider("test-key");

    await provider.getAnalysis(makeGameState(), baseRec);

    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.generationConfig?.responseMimeType).toBe("application/json");
    expect(callArg.generationConfig?.maxOutputTokens).toBe(400);
  });

  it("getAnalysis_StandardRequest_SendsUserRoleWithTextPart", async () => {
    const mockGenerateContent = mockGeminiResponse();
    const provider = new GeminiProvider("test-key");

    await provider.getAnalysis(makeGameState(), baseRec);

    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.contents[0].role).toBe("user");
    expect(typeof callArg.contents[0].parts[0].text).toBe("string");
  });
});
