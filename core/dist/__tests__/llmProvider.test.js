"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const llmProvider_1 = require("../llmProvider");
const fixtures_1 = require("./fixtures");
describe("createLlmProvider", () => {
    it("createLlmProvider_Claude_ReturnsProviderWithCorrectName", async () => {
        const provider = await (0, llmProvider_1.createLlmProvider)("claude", "test-key");
        expect(provider.name).toBe("claude");
    });
    it("createLlmProvider_OpenAi_ReturnsProviderWithCorrectName", async () => {
        const provider = await (0, llmProvider_1.createLlmProvider)("openai", "test-key");
        expect(provider.name).toBe("openai");
    });
    it("createLlmProvider_Gemini_ReturnsProviderWithCorrectName", async () => {
        const provider = await (0, llmProvider_1.createLlmProvider)("gemini", "test-key");
        expect(provider.name).toBe("gemini");
    });
    it("createLlmProvider_UnknownProvider_ThrowsUnknownProviderError", async () => {
        await expect((0, llmProvider_1.createLlmProvider)("unknown", "test-key")).rejects.toThrow(/Unknown LLM provider/);
    });
});
describe("buildUserPrompt", () => {
    it("buildUserPrompt_StandardGameState_ContainsChampionTimeAndPhaseInfo", () => {
        const state = (0, fixtures_1.makeGameState)({
            localPlayer: { ...(0, fixtures_1.makeGameState)().localPlayer, championName: "Lux" },
            enemies: [{ ...(0, fixtures_1.makeGameState)().localPlayer, championName: "Soraka", team: "CHAOS" }],
            gameTime: 125,
        });
        const prompt = (0, llmProvider_1.buildUserPrompt)(state, (0, fixtures_1.makeBaseRec)());
        expect(prompt).toContain("Me: Lux");
        expect(prompt).toContain("Enemies: Soraka");
        expect(prompt).toContain("Suggested items: Mortal Reminder");
        expect(prompt).toContain("Time: 2:05");
        expect(prompt).toContain("Game Phase: early");
    });
    it("buildUserPrompt_MidGameTime_ContainsMidPhase", () => {
        const state = (0, fixtures_1.makeGameState)({ gameTime: 15 * 60 });
        const prompt = (0, llmProvider_1.buildUserPrompt)(state, (0, fixtures_1.makeBaseRec)());
        expect(prompt).toContain("Game Phase: mid");
    });
    it("buildUserPrompt_LateGameTime_ContainsLatePhase", () => {
        const state = (0, fixtures_1.makeGameState)({ gameTime: 26 * 60 });
        const prompt = (0, llmProvider_1.buildUserPrompt)(state, (0, fixtures_1.makeBaseRec)());
        expect(prompt).toContain("Game Phase: late");
    });
});
describe("parseAnalysisResponse", () => {
    const fallback = (0, fixtures_1.makeBaseRec)();
    it("parseAnalysisResponse_ValidJson_ExtractsReasoningAndStrategy", () => {
        const raw = JSON.stringify({
            itemReasoning: "Buy this now",
            strategy: {
                winCondition: "late",
                summary: "Scale hard.",
                immediateAction: "Farm under tower.",
                lateGamePlan: "Destroy with full build.",
            },
        });
        const result = (0, llmProvider_1.parseAnalysisResponse)(raw, fallback);
        expect(result.reasoning).toBe("Buy this now");
        expect(result.strategy.winCondition).toBe("late");
        expect(result.strategy.summary).toBe("Scale hard.");
    });
    it("parseAnalysisResponse_JsonWithMarkdownCodeBlock_StillParses", () => {
        const raw = "```json\n{\"itemReasoning\":\"Good items\",\"strategy\":{\"winCondition\":\"mid\",\"summary\":\"s\",\"immediateAction\":\"a\",\"lateGamePlan\":\"b\"}}\n```";
        const result = (0, llmProvider_1.parseAnalysisResponse)(raw, fallback);
        expect(result.reasoning).toBe("Good items");
    });
    it("parseAnalysisResponse_InvalidJson_FallsBackToHeuristic", () => {
        const result = (0, llmProvider_1.parseAnalysisResponse)("not json at all", fallback);
        expect(result.reasoning).toBe(fallback.reasoning);
        expect(result.strategy).toEqual(fallback.strategy);
    });
    it("parseAnalysisResponse_MissingFields_FallsBackToHeuristicValues", () => {
        const raw = JSON.stringify({ itemReasoning: "partial" });
        const result = (0, llmProvider_1.parseAnalysisResponse)(raw, fallback);
        expect(result.reasoning).toBe("partial");
        expect(result.strategy.winCondition).toBe(fallback.strategy.winCondition);
    });
});
