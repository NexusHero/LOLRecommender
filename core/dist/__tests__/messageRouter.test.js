"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const messageRouter_1 = require("../messageRouter");
jest.mock("../llmProvider", () => ({
    createLlmProvider: jest.fn().mockResolvedValue({ name: "mock-provider" }),
}));
const llmProvider_1 = require("../llmProvider");
function makeOrchestrator() {
    return {
        setSummonerName: jest.fn(),
        triggerManualAnalysis: jest.fn().mockResolvedValue(undefined),
        setLlmProvider: jest.fn(),
    };
}
const fakeWs = {};
describe("MessageRouter", () => {
    describe("handle — SET_SUMMONER", () => {
        it("handle_SetSummonerWithValidName_CallsSetSummonerName", async () => {
            const orchestrator = makeOrchestrator();
            const router = new messageRouter_1.MessageRouter(orchestrator);
            await router.handle(fakeWs, { event: "SET_SUMMONER", summonerName: "Faker" });
            expect(orchestrator.setSummonerName).toHaveBeenCalledWith("Faker");
        });
        it("handle_SetSummonerWithNonStringName_DoesNotCallSetSummonerName", async () => {
            const orchestrator = makeOrchestrator();
            const router = new messageRouter_1.MessageRouter(orchestrator);
            await router.handle(fakeWs, { event: "SET_SUMMONER", summonerName: 42 });
            expect(orchestrator.setSummonerName).not.toHaveBeenCalled();
        });
        it("handle_SetSummonerWithMissingName_DoesNotCallSetSummonerName", async () => {
            const orchestrator = makeOrchestrator();
            const router = new messageRouter_1.MessageRouter(orchestrator);
            await router.handle(fakeWs, { event: "SET_SUMMONER" });
            expect(orchestrator.setSummonerName).not.toHaveBeenCalled();
        });
    });
    describe("handle — TRIGGER_ANALYSIS", () => {
        it("handle_TriggerAnalysisEvent_CallsTriggerManualAnalysis", async () => {
            const orchestrator = makeOrchestrator();
            const router = new messageRouter_1.MessageRouter(orchestrator);
            await router.handle(fakeWs, { event: "TRIGGER_ANALYSIS" });
            expect(orchestrator.triggerManualAnalysis).toHaveBeenCalledTimes(1);
        });
    });
    describe("handle — SET_LLM_PROVIDER", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            llmProvider_1.createLlmProvider.mockResolvedValue({ name: "mock-provider" });
        });
        it("handle_SetLlmProviderWithValidKey_SetsProviderOnOrchestrator", async () => {
            const orchestrator = makeOrchestrator();
            const router = new messageRouter_1.MessageRouter(orchestrator);
            await router.handle(fakeWs, { event: "SET_LLM_PROVIDER", provider: "claude", apiKey: "sk-valid" });
            expect(llmProvider_1.createLlmProvider).toHaveBeenCalledWith("claude", "sk-valid");
            expect(orchestrator.setLlmProvider).toHaveBeenCalledWith({ name: "mock-provider" });
        });
        it("handle_SetLlmProviderWithoutApiKey_SetsProviderNull", async () => {
            const orchestrator = makeOrchestrator();
            const router = new messageRouter_1.MessageRouter(orchestrator);
            await router.handle(fakeWs, { event: "SET_LLM_PROVIDER", provider: "claude" });
            expect(llmProvider_1.createLlmProvider).not.toHaveBeenCalled();
            expect(orchestrator.setLlmProvider).toHaveBeenCalledWith(null);
        });
        it("handle_SetLlmProviderWithoutProviderType_SetsProviderNull", async () => {
            const orchestrator = makeOrchestrator();
            const router = new messageRouter_1.MessageRouter(orchestrator);
            await router.handle(fakeWs, { event: "SET_LLM_PROVIDER", apiKey: "sk-key" });
            expect(orchestrator.setLlmProvider).toHaveBeenCalledWith(null);
        });
        it("handle_SetLlmProviderCreateFails_FallsBackToNullProvider", async () => {
            llmProvider_1.createLlmProvider.mockRejectedValue(new Error("Invalid API key"));
            const orchestrator = makeOrchestrator();
            const router = new messageRouter_1.MessageRouter(orchestrator);
            await router.handle(fakeWs, { event: "SET_LLM_PROVIDER", provider: "claude", apiKey: "bad-key" });
            expect(orchestrator.setLlmProvider).toHaveBeenCalledWith(null);
        });
    });
    describe("handle — unknown event", () => {
        it("handle_UnknownEvent_DoesNotThrowAndIgnoresMessage", async () => {
            const orchestrator = makeOrchestrator();
            const router = new messageRouter_1.MessageRouter(orchestrator);
            await expect(router.handle(fakeWs, { event: "UNKNOWN_EVENT" })).resolves.toBeUndefined();
            expect(orchestrator.setSummonerName).not.toHaveBeenCalled();
            expect(orchestrator.triggerManualAnalysis).not.toHaveBeenCalled();
            expect(orchestrator.setLlmProvider).not.toHaveBeenCalled();
        });
    });
});
