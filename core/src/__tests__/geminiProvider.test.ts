import { GeminiProvider } from "../providers/geminiProvider";
import { GoogleGenAI } from "@google/genai";
import { runLlmProviderContract, validJsonResponse } from "./llmProviderContract";

jest.mock("@google/genai");



describe("GeminiProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockGeminiResponse(content: string | null = validJsonResponse, throwError = false, customErr?: Error) {
    const mockGenerateContent = jest.fn();
    if (throwError) {
      mockGenerateContent.mockRejectedValue(customErr ?? new Error("API unavailable"));
    } else {
      mockGenerateContent.mockResolvedValue({ text: content, usageMetadata: {} });
    }
    (GoogleGenAI as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent },
    }));
    return mockGenerateContent;
  }

  runLlmProviderContract({
    providerName: "Gemini",
    createProvider: (key, model) => new GeminiProvider(key, model),
    mockSuccess: (json) => mockGeminiResponse(json),
    mockFailure: (err) => mockGeminiResponse(null, true, err),
    mockInvalidJson: (json) => mockGeminiResponse(json),
    mockEmptyContent: () => mockGeminiResponse(""),
    assertStandardRequest: (mockApi) => {
      const callArg = mockApi.mock.calls[0][0];
      const userContent = callArg.contents as string;
      expect(userContent).toContain("Lux");
      expect(userContent).toContain("Soraka");
    },
    expectedDefaultModel: "gemini-2.5-flash",
    expectedCustomModel: "gemini-1.5-pro",
    assertModelPassed: (mockApi, model) => {
      expect(mockApi.mock.calls[0][0].model).toBe(model);
    },
  });

  it("getAnalysis_RateLimitError_ShowsFriendlyMessageWithRetryDelay", async () => {
    const rateLimitErr = Object.assign(
      new Error('[429 Too Many Requests] quota exceeded. Please retry in 7.77s. [{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"7s"}]'),
      { status: 429 },
    );
    const mockGenerateContent = jest.fn().mockRejectedValue(rateLimitErr);
    (GoogleGenAI as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent },
    }));
    const provider = new GeminiProvider("test-key");

    const { makeGameState, makeBaseRec } = require("./fixtures");
    await expect(provider.getAnalysis(makeGameState(), makeBaseRec())).rejects.toThrow(
      "Gemini: 429 · Rate limit exceeded",
    );
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



  it("getAnalysis_StandardRequest_PassesSystemInstructionToGetGenerativeModel", async () => {
    const mockGenerateContent = mockGeminiResponse();
    const provider = new GeminiProvider("test-key");

    const { makeGameState, makeBaseRec } = require("./fixtures");
    await provider.getAnalysis(makeGameState(), makeBaseRec());

    const modelConfig = mockGenerateContent.mock.calls[0][0];
    expect(typeof modelConfig.config.systemInstruction).toBe("string");
    expect((modelConfig.config.systemInstruction as string).length).toBeGreaterThan(0);
  });

  it("getAnalysis_StandardRequest_SetsJsonResponseMimeTypeAndMaxTokens", async () => {
    const mockGenerateContent = mockGeminiResponse();
    const provider = new GeminiProvider("test-key");

    const { makeGameState, makeBaseRec } = require("./fixtures");
    await provider.getAnalysis(makeGameState(), makeBaseRec());

    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg.config?.responseMimeType).toBe("application/json");
    expect(callArg.config?.maxOutputTokens).toBe(400);
  });

  it("getAnalysis_StandardRequest_SendsUserRoleWithTextPart", async () => {
    const mockGenerateContent = mockGeminiResponse();
    const provider = new GeminiProvider("test-key");

    const { makeGameState, makeBaseRec } = require("./fixtures");
    await provider.getAnalysis(makeGameState(), makeBaseRec());

    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(typeof callArg.contents).toBe("string");
    expect(callArg.contents.length).toBeGreaterThan(0);
  });
});
