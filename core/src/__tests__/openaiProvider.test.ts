import { OpenAiProvider } from "../providers/openaiProvider";
import OpenAI from "openai";
import { runLlmProviderContract, validJsonResponse } from "./llmProviderContract";

jest.mock("openai");



describe("OpenAiProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockOpenAIResponse(content: string | null = validJsonResponse, throwError = false, customErr?: Error) {
    const mockCreate = jest.fn();
    if (throwError) {
      mockCreate.mockRejectedValue(customErr ?? new Error("API unavailable"));
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

  runLlmProviderContract({
    providerName: "OpenAI",
    createProvider: (key, model) => new OpenAiProvider(key, model),
    mockSuccess: (json) => mockOpenAIResponse(json),
    mockFailure: (err) => mockOpenAIResponse(null, true, err),
    mockInvalidJson: (json) => mockOpenAIResponse(json),
    mockEmptyContent: () => mockOpenAIResponse(null),
    assertStandardRequest: (mockApi) => {
      const callArg = mockApi.mock.calls[0][0];
      const userContent = callArg.messages[1].content as string;
      expect(userContent).toContain("Lux");
      expect(userContent).toContain("Soraka");
    },
    expectedDefaultModel: "gpt-4o-mini",
    expectedCustomModel: "gpt-4o",
    assertModelPassed: (mockApi, model) => {
      expect(mockApi.mock.calls[0][0].model).toBe(model);
    },
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


});
