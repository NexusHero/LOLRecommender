import { ClaudeProvider } from "../providers/claudeProvider";
import Anthropic from "@anthropic-ai/sdk";
import { runLlmProviderContract, validJsonResponse } from "./llmProviderContract";

jest.mock("@anthropic-ai/sdk");



describe("ClaudeProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockAnthropicResponse(contentOverride: object = {}) {
    const mockCreate = jest.fn().mockResolvedValue({
      content: [{ type: "text", text: validJsonResponse }],
      usage: { input_tokens: 100, output_tokens: 50 },
      ...contentOverride,
    });
    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: { create: mockCreate },
    }));
    return mockCreate;
  }

  runLlmProviderContract({
    providerName: "Claude",
    createProvider: (key, model) => new ClaudeProvider(key, model),
    mockSuccess: (json) => mockAnthropicResponse({ content: [{ type: "text", text: json }] }),
    mockFailure: (err) => {
      const mockCreate = jest.fn().mockRejectedValue(err);
      (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
        messages: { create: mockCreate },
      }));
      return mockCreate;
    },
    mockInvalidJson: (json) => mockAnthropicResponse({ content: [{ type: "text", text: json }], usage: { input_tokens: 0, output_tokens: 0 } }),
    mockEmptyContent: () => mockAnthropicResponse({ content: [], usage: { input_tokens: 0, output_tokens: 0 } }),
    assertStandardRequest: (mockApi) => {
      const callArg = mockApi.mock.calls[0][0];
      const userContent = callArg.messages[0].content as string;
      expect(userContent).toContain("Lux");
      expect(userContent).toContain("Soraka");
    },
    expectedDefaultModel: "claude-haiku-4-5-20251001",
    expectedCustomModel: "claude-sonnet-4-6",
    assertModelPassed: (mockApi, model) => {
      expect(mockApi.mock.calls[0][0].model).toBe(model);
    },
  });

  it("getAnalysis_NonTextContentBlock_ReturnsEmptyReasoning", async () => {
    mockAnthropicResponse({
      content: [{ type: "tool_use", id: "x", name: "test", input: {} }],
      usage: { input_tokens: 0, output_tokens: 0 },
    });
    const { makeGameState } = require("./fixtures");
    const provider = new ClaudeProvider("test-key");

    const result = await provider.getAnalysis(makeGameState());

    expect(result.reasoning).toBe("");
  });

  it("listModels_ValidKey_ReturnsMappedModelInfoList", async () => {
    const mockList = jest.fn().mockResolvedValue({
      data: [
        { id: "claude-opus-4-8", display_name: "Claude Opus 4.8" },
        { id: "claude-sonnet-4-6", display_name: "Claude Sonnet 4.6" },
        { id: "claude-haiku-4-5-20251001", display_name: "Claude Haiku 4.5" },
      ],
    });
    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: { create: jest.fn() },
      models: { list: mockList },
    }));
    const provider = new ClaudeProvider("test-key");

    const models = await provider.listModels();

    expect(models).toHaveLength(3);
    expect(models[0]).toEqual({ id: "claude-opus-4-8", displayName: "Claude Opus 4.8" });
    expect(models[1]).toEqual({ id: "claude-sonnet-4-6", displayName: "Claude Sonnet 4.6" });
  });

  it("listModels_ApiError_PropagatesError", async () => {
    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: { create: jest.fn() },
      models: { list: jest.fn().mockRejectedValue(new Error("unauthorized")) },
    }));
    const provider = new ClaudeProvider("bad-key");

    await expect(provider.listModels()).rejects.toThrow("unauthorized");
  });

  it("getAnalysis_CreditBalanceError_ShowsHumanReadableMessage", async () => {
    const apiError = Object.assign(new Error("credit error"), {
      status: 400,
      error: {
        type: "invalid_request_error",
        message: "Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.",
      },
    });
    (Anthropic as unknown as jest.Mock).mockImplementation(() => ({
      messages: { create: jest.fn().mockRejectedValue(apiError) },
    }));
    const provider = new ClaudeProvider("test-key");

    const { makeGameState } = require("./fixtures");
    await expect(provider.getAnalysis(makeGameState())).rejects.toThrow(
      "Claude: Your credit balance is too low to access the Anthropic API.",
    );
  });
});
