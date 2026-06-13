"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const claudeProvider_1 = require("../providers/claudeProvider");
const fixtures_1 = require("./fixtures");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
jest.mock("@anthropic-ai/sdk");
const baseRec = (0, fixtures_1.makeBaseRec)();
const validJsonResponse = JSON.stringify({
    itemReasoning: "LLM reasoning text",
    strategy: {
        winCondition: "mid",
        summary: "Scale into mid game.",
        immediateAction: "Farm safely.",
        lateGamePlan: "Fight with full build.",
    },
});
describe("ClaudeProvider", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    function mockAnthropicResponse(contentOverride = {}) {
        const mockCreate = jest.fn().mockResolvedValue({
            content: [{ type: "text", text: validJsonResponse }],
            usage: { input_tokens: 100, output_tokens: 50 },
            ...contentOverride,
        });
        sdk_1.default.mockImplementation(() => ({
            messages: { create: mockCreate },
        }));
        return mockCreate;
    }
    it("getAnalysis_ValidApiKey_ReturnsLlmReasoningAndStrategy", async () => {
        mockAnthropicResponse();
        const provider = new claudeProvider_1.ClaudeProvider("test-key");
        const result = await provider.getAnalysis((0, fixtures_1.makeGameState)(), baseRec);
        expect(result.reasoning).toBe("LLM reasoning text");
        expect(result.strategy.winCondition).toBe("mid");
        expect(result.strategy.immediateAction).toBe("Farm safely.");
    });
    it("getAnalysis_ClientThrows_FallsBackToHeuristicReasoningAndStrategy", async () => {
        sdk_1.default.mockImplementation(() => ({
            messages: { create: jest.fn().mockRejectedValue(new Error("API unavailable")) },
        }));
        const provider = new claudeProvider_1.ClaudeProvider("test-key");
        const result = await provider.getAnalysis((0, fixtures_1.makeGameState)(), baseRec);
        expect(result.reasoning).toBe("heuristic reasoning");
        expect(result.strategy).toEqual(baseRec.strategy);
    });
    it("getAnalysis_EmptyContentArray_FallsBackToHeuristicReasoningAndStrategy", async () => {
        mockAnthropicResponse({ content: [], usage: { input_tokens: 0, output_tokens: 0 } });
        const provider = new claudeProvider_1.ClaudeProvider("test-key");
        const result = await provider.getAnalysis((0, fixtures_1.makeGameState)(), baseRec);
        expect(result.reasoning).toBe("heuristic reasoning");
        expect(result.strategy).toEqual(baseRec.strategy);
    });
    it("getAnalysis_NonTextContentBlock_FallsBackToHeuristicReasoningAndStrategy", async () => {
        mockAnthropicResponse({
            content: [{ type: "tool_use", id: "x", name: "test", input: {} }],
            usage: { input_tokens: 0, output_tokens: 0 },
        });
        const provider = new claudeProvider_1.ClaudeProvider("test-key");
        const result = await provider.getAnalysis((0, fixtures_1.makeGameState)(), baseRec);
        expect(result.reasoning).toBe("heuristic reasoning");
        expect(result.strategy).toEqual(baseRec.strategy);
    });
    it("getAnalysis_InvalidJson_FallsBackToHeuristicReasoningAndStrategy", async () => {
        mockAnthropicResponse({ content: [{ type: "text", text: "not valid json" }], usage: { input_tokens: 0, output_tokens: 0 } });
        const provider = new claudeProvider_1.ClaudeProvider("test-key");
        const result = await provider.getAnalysis((0, fixtures_1.makeGameState)(), baseRec);
        expect(result.reasoning).toBe("heuristic reasoning");
        expect(result.strategy).toEqual(baseRec.strategy);
    });
    it("getAnalysis_StandardRequest_IncludesChampionAndEnemyInPayload", async () => {
        const mockCreate = mockAnthropicResponse();
        const provider = new claudeProvider_1.ClaudeProvider("test-key");
        const state = (0, fixtures_1.makeGameState)({
            localPlayer: { ...(0, fixtures_1.makeGameState)().localPlayer, championName: "Lux" },
            enemies: [{ ...(0, fixtures_1.makeGameState)().localPlayer, championName: "Soraka", team: "CHAOS" }],
        });
        await provider.getAnalysis(state, baseRec);
        const callArg = mockCreate.mock.calls[0][0];
        const userContent = callArg.messages[0].content;
        expect(userContent).toContain("Lux");
        expect(userContent).toContain("Soraka");
    });
});
