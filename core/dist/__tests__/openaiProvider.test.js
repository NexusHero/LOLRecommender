"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openaiProvider_1 = require("../providers/openaiProvider");
const fixtures_1 = require("./fixtures");
const openai_1 = __importDefault(require("openai"));
jest.mock("openai");
const baseRec = (0, fixtures_1.makeBaseRec)();
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
    function mockOpenAIResponse(content = validJsonResponse, throwError = false) {
        const mockCreate = jest.fn();
        if (throwError) {
            mockCreate.mockRejectedValue(new Error("API unavailable"));
        }
        else {
            mockCreate.mockResolvedValue({
                choices: [{ message: { content } }],
                usage: { prompt_tokens: 100, completion_tokens: 50 },
            });
        }
        openai_1.default.mockImplementation(() => ({
            chat: { completions: { create: mockCreate } },
        }));
        return mockCreate;
    }
    it("getAnalysis_ValidApiKey_ReturnsLlmReasoningAndStrategy", async () => {
        mockOpenAIResponse();
        const provider = new openaiProvider_1.OpenAiProvider("test-key");
        const result = await provider.getAnalysis((0, fixtures_1.makeGameState)(), baseRec);
        expect(result.reasoning).toBe("LLM reasoning text");
        expect(result.strategy.winCondition).toBe("early");
    });
    it("getAnalysis_ClientThrows_FallsBackToHeuristicReasoningAndStrategy", async () => {
        mockOpenAIResponse(null, true);
        const provider = new openaiProvider_1.OpenAiProvider("test-key");
        const result = await provider.getAnalysis((0, fixtures_1.makeGameState)(), baseRec);
        expect(result.reasoning).toBe("heuristic reasoning");
        expect(result.strategy).toEqual(baseRec.strategy);
    });
    it("getAnalysis_NullContent_FallsBackToHeuristicReasoningAndStrategy", async () => {
        mockOpenAIResponse(null);
        const provider = new openaiProvider_1.OpenAiProvider("test-key");
        const result = await provider.getAnalysis((0, fixtures_1.makeGameState)(), baseRec);
        expect(result.reasoning).toBe("heuristic reasoning");
        expect(result.strategy).toEqual(baseRec.strategy);
    });
    it("getAnalysis_InvalidJson_FallsBackToHeuristicReasoningAndStrategy", async () => {
        mockOpenAIResponse("not valid json at all");
        const provider = new openaiProvider_1.OpenAiProvider("test-key");
        const result = await provider.getAnalysis((0, fixtures_1.makeGameState)(), baseRec);
        expect(result.reasoning).toBe("heuristic reasoning");
        expect(result.strategy).toEqual(baseRec.strategy);
    });
    it("getAnalysis_StandardRequest_IncludesChampionAndEnemyInPayload", async () => {
        const mockCreate = mockOpenAIResponse();
        const provider = new openaiProvider_1.OpenAiProvider("test-key");
        const state = (0, fixtures_1.makeGameState)({
            localPlayer: { ...(0, fixtures_1.makeGameState)().localPlayer, championName: "Lux" },
            enemies: [{ ...(0, fixtures_1.makeGameState)().localPlayer, championName: "Soraka", team: "CHAOS" }],
        });
        await provider.getAnalysis(state, baseRec);
        const callArg = mockCreate.mock.calls[0][0];
        const userContent = callArg.messages[1].content;
        expect(userContent).toContain("Lux");
        expect(userContent).toContain("Soraka");
    });
});
