import { MessageRouter } from "../messageRouter";
import type { BridgeOrchestrator } from "../orchestrator";
import type { WebSocket } from "ws";

jest.mock("../llmProvider", () => ({
  createLlmProvider: jest.fn().mockResolvedValue({
    name: "mock-provider",
    listModels: jest.fn().mockResolvedValue([
      { id: "claude-sonnet-4-6", displayName: "Claude Sonnet 4.6" },
    ]),
  }),
  friendlyApiError: jest.fn((err: unknown) => (err instanceof Error ? err.message : String(err))),
}));

import { createLlmProvider, friendlyApiError } from "../llmProvider";

function makeOrchestrator(): jest.Mocked<Pick<BridgeOrchestrator, "setSummonerName" | "triggerManualAnalysis" | "setLlmProvider">> {
  return {
    setSummonerName: jest.fn(),
    triggerManualAnalysis: jest.fn().mockResolvedValue(undefined),
    setLlmProvider: jest.fn(),
  };
}

function makeWs(): jest.Mocked<Pick<WebSocket, "send">> & WebSocket {
  return { send: jest.fn() } as unknown as jest.Mocked<Pick<WebSocket, "send">> & WebSocket;
}

const fakeWs = makeWs();

describe("MessageRouter", () => {
  describe("handle — SET_SUMMONER", () => {
    it("handle_SetSummonerWithValidName_CallsSetSummonerName", async () => {
      const orchestrator = makeOrchestrator();
      const router = new MessageRouter(orchestrator as any);

      await router.handle(fakeWs, { event: "SET_SUMMONER", summonerName: "Faker" });

      expect(orchestrator.setSummonerName).toHaveBeenCalledWith("Faker");
    });

    it("handle_SetSummonerWithNonStringName_DoesNotCallSetSummonerName", async () => {
      const orchestrator = makeOrchestrator();
      const router = new MessageRouter(orchestrator as any);

      await router.handle(fakeWs, { event: "SET_SUMMONER", summonerName: 42 });

      expect(orchestrator.setSummonerName).not.toHaveBeenCalled();
    });

    it("handle_SetSummonerWithMissingName_DoesNotCallSetSummonerName", async () => {
      const orchestrator = makeOrchestrator();
      const router = new MessageRouter(orchestrator as any);

      await router.handle(fakeWs, { event: "SET_SUMMONER" });

      expect(orchestrator.setSummonerName).not.toHaveBeenCalled();
    });
  });

  describe("handle — TRIGGER_ANALYSIS", () => {
    it("handle_TriggerAnalysisEvent_CallsTriggerManualAnalysis", async () => {
      const orchestrator = makeOrchestrator();
      const router = new MessageRouter(orchestrator as any);

      await router.handle(fakeWs, { event: "TRIGGER_ANALYSIS" });

      expect(orchestrator.triggerManualAnalysis).toHaveBeenCalledTimes(1);
    });
  });

  describe("handle — SET_LLM_PROVIDER", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (createLlmProvider as jest.Mock).mockResolvedValue({ name: "mock-provider" });
    });

    it("handle_SetLlmProviderWithValidKey_SetsProviderOnOrchestrator", async () => {
      const orchestrator = makeOrchestrator();
      const router = new MessageRouter(orchestrator as any);

      await router.handle(fakeWs, { event: "SET_LLM_PROVIDER", provider: "claude", apiKey: "sk-valid" });

      expect(createLlmProvider).toHaveBeenCalledWith("claude", "sk-valid", undefined);
      expect(orchestrator.setLlmProvider).toHaveBeenCalledWith({ name: "mock-provider" });
    });

    it("handle_SetLlmProviderWithoutApiKey_SetsProviderNull", async () => {
      const orchestrator = makeOrchestrator();
      const router = new MessageRouter(orchestrator as any);

      await router.handle(fakeWs, { event: "SET_LLM_PROVIDER", provider: "claude" });

      expect(createLlmProvider).not.toHaveBeenCalled();
      expect(orchestrator.setLlmProvider).toHaveBeenCalledWith(null);
    });

    it("handle_SetLlmProviderWithoutProviderType_SetsProviderNull", async () => {
      const orchestrator = makeOrchestrator();
      const router = new MessageRouter(orchestrator as any);

      await router.handle(fakeWs, { event: "SET_LLM_PROVIDER", apiKey: "sk-key" });

      expect(orchestrator.setLlmProvider).toHaveBeenCalledWith(null);
    });

    it("handle_SetLlmProviderCreateFails_FallsBackToNullProvider", async () => {
      (createLlmProvider as jest.Mock).mockRejectedValue(new Error("Invalid API key"));
      const orchestrator = makeOrchestrator();
      const router = new MessageRouter(orchestrator as any);

      await router.handle(fakeWs, { event: "SET_LLM_PROVIDER", provider: "claude", apiKey: "bad-key" });

      expect(orchestrator.setLlmProvider).toHaveBeenCalledWith(null);
    });
  });

  describe("handle — GET_MODELS", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (createLlmProvider as jest.Mock).mockResolvedValue({
        name: "mock-provider",
        listModels: jest.fn().mockResolvedValue([
          { id: "claude-sonnet-4-6", displayName: "Claude Sonnet 4.6" },
          { id: "claude-haiku-4-5-20251001", displayName: "Claude Haiku 4.5" },
        ]),
      });
      (friendlyApiError as jest.Mock).mockImplementation((err: unknown) =>
        err instanceof Error ? err.message : String(err),
      );
    });

    it("handle_GetModels_SendsModelsAvailableWithProviderAndList", async () => {
      const ws = makeWs();
      const router = new MessageRouter(makeOrchestrator() as any);

      await router.handle(ws, { event: "GET_MODELS", provider: "claude", apiKey: "sk-valid" });

      expect(ws.send).toHaveBeenCalledTimes(1);
      const sent = JSON.parse((ws.send as jest.Mock).mock.calls[0][0]);
      expect(sent.event).toBe("MODELS_AVAILABLE");
      expect(sent.provider).toBe("claude");
      expect(sent.models).toHaveLength(2);
      expect(sent.models[0].id).toBe("claude-sonnet-4-6");
    });

    it("handle_GetModels_PassesModelAndApiKeyToCreateLlmProvider", async () => {
      const ws = makeWs();
      const router = new MessageRouter(makeOrchestrator() as any);

      await router.handle(ws, { event: "GET_MODELS", provider: "openai", apiKey: "sk-openai" });

      expect(createLlmProvider).toHaveBeenCalledWith("openai", "sk-openai");
    });

    it("handle_GetModelsWithoutApiKey_SendsModelsError", async () => {
      const ws = makeWs();
      const router = new MessageRouter(makeOrchestrator() as any);

      await router.handle(ws, { event: "GET_MODELS", provider: "claude" });

      const sent = JSON.parse((ws.send as jest.Mock).mock.calls[0][0]);
      expect(sent.event).toBe("MODELS_ERROR");
      expect(typeof sent.error).toBe("string");
    });

    it("handle_GetModels_ListModelsThrows_SendsModelsError", async () => {
      (createLlmProvider as jest.Mock).mockResolvedValue({
        name: "mock-provider",
        listModels: jest.fn().mockRejectedValue(new Error("unauthorized")),
      });
      const ws = makeWs();
      const router = new MessageRouter(makeOrchestrator() as any);

      await router.handle(ws, { event: "GET_MODELS", provider: "claude", apiKey: "bad-key" });

      const sent = JSON.parse((ws.send as jest.Mock).mock.calls[0][0]);
      expect(sent.event).toBe("MODELS_ERROR");
      expect(sent.error).toBe("unauthorized");
    });
  });

  describe("handle — unknown event", () => {
    it("handle_UnknownEvent_DoesNotThrowAndIgnoresMessage", async () => {
      const orchestrator = makeOrchestrator();
      const router = new MessageRouter(orchestrator as any);

      await expect(router.handle(fakeWs, { event: "UNKNOWN_EVENT" })).resolves.toBeUndefined();

      expect(orchestrator.setSummonerName).not.toHaveBeenCalled();
      expect(orchestrator.triggerManualAnalysis).not.toHaveBeenCalled();
      expect(orchestrator.setLlmProvider).not.toHaveBeenCalled();
    });
  });
});
