"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const geminiProvider_1 = require("../providers/geminiProvider");
const fixtures_1 = require("./fixtures");
const generative_ai_1 = require("@google/generative-ai");
jest.mock("@google/generative-ai");
const baseRec = (0, fixtures_1.makeBaseRec)();
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
    function mockGeminiResponse(content = validJsonResponse, throwError = false) {
        const mockGenerateContent = jest.fn();
        if (throwError) {
            mockGenerateContent.mockRejectedValue(new Error("API unavailable"));
        }
        else {
            mockGenerateContent.mockResolvedValue({ response: { text: () => content } });
        }
        const mockGetGenerativeModel = jest.fn().mockReturnValue({ generateContent: mockGenerateContent });
        generative_ai_1.GoogleGenerativeAI.mockImplementation(() => ({
            getGenerativeModel: mockGetGenerativeModel,
        }));
        return mockGenerateContent;
    }
    it("getAnalysis_ValidApiKey_ReturnsLlmReasoningAndStrategy", async () => {
        mockGeminiResponse();
        const provider = new geminiProvider_1.GeminiProvider("test-key");
        const result = await provider.getAnalysis((0, fixtures_1.makeGameState)(), baseRec);
        expect(result.reasoning).toBe("LLM reasoning text");
        expect(result.strategy.winCondition).toBe("late");
    });
    it("getAnalysis_ClientThrows_FallsBackToHeuristicReasoningAndStrategy", async () => {
        mockGeminiResponse(null, true);
        const provider = new geminiProvider_1.GeminiProvider("test-key");
        const result = await provider.getAnalysis((0, fixtures_1.makeGameState)(), baseRec);
        expect(result.reasoning).toBe("heuristic reasoning");
        expect(result.strategy).toEqual(baseRec.strategy);
    });
    it("getAnalysis_EmptyContent_FallsBackToHeuristicReasoningAndStrategy", async () => {
        mockGeminiResponse("");
        const provider = new geminiProvider_1.GeminiProvider("test-key");
        const result = await provider.getAnalysis((0, fixtures_1.makeGameState)(), baseRec);
        expect(result.reasoning).toBe("heuristic reasoning");
        expect(result.strategy).toEqual(baseRec.strategy);
    });
    it("getAnalysis_InvalidJson_FallsBackToHeuristicReasoningAndStrategy", async () => {
        mockGeminiResponse("plain text not json");
        const provider = new geminiProvider_1.GeminiProvider("test-key");
        const result = await provider.getAnalysis((0, fixtures_1.makeGameState)(), baseRec);
        expect(result.reasoning).toBe("heuristic reasoning");
        expect(result.strategy).toEqual(baseRec.strategy);
    });
    it("getAnalysis_StandardRequest_IncludesChampionAndEnemyInPayload", async () => {
        const mockGenerateContent = mockGeminiResponse();
        const provider = new geminiProvider_1.GeminiProvider("test-key");
        const state = (0, fixtures_1.makeGameState)({
            localPlayer: { ...(0, fixtures_1.makeGameState)().localPlayer, championName: "Lux" },
            enemies: [{ ...(0, fixtures_1.makeGameState)().localPlayer, championName: "Soraka", team: "CHAOS" }],
        });
        await provider.getAnalysis(state, baseRec);
        const callArg = mockGenerateContent.mock.calls[0][0];
        const userContent = callArg.contents[0].parts[0].text;
        expect(userContent).toContain("Lux");
        expect(userContent).toContain("Soraka");
    });
});
