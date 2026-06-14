"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validJsonResponse = void 0;
exports.runLlmProviderContract = runLlmProviderContract;
const fixtures_1 = require("./fixtures");
exports.validJsonResponse = JSON.stringify({
    itemReasoning: "LLM reasoning text",
    strategy: {
        winCondition: "early",
        summary: "Push your lead.",
        immediateAction: "Take objectives.",
        lateGamePlan: "End fast.",
    },
});
function runLlmProviderContract(setup) {
    describe(`Contract Tests: ${setup.providerName}`, () => {
        it("getAnalysis_ValidApiKey_ReturnsLlmReasoningAndStrategy", async () => {
            setup.mockSuccess(exports.validJsonResponse);
            const provider = setup.createProvider("test-key");
            const result = await provider.getAnalysis((0, fixtures_1.makeGameState)());
            expect(result.reasoning).toBe("LLM reasoning text");
            expect(result.strategy.winCondition).toBe("early");
            expect(result.strategy.summary).toBe("Push your lead.");
        });
        it("getAnalysis_ClientThrows_PropagatesErrorWithProviderPrefix", async () => {
            setup.mockFailure(new Error("API unavailable"));
            const provider = setup.createProvider("test-key");
            await expect(provider.getAnalysis((0, fixtures_1.makeGameState)())).rejects.toThrow(`${setup.providerName}: API unavailable`);
        });
        it("getAnalysis_EmptyContent_ReturnsEmptyReasoning", async () => {
            setup.mockEmptyContent();
            const provider = setup.createProvider("test-key");
            const result = await provider.getAnalysis((0, fixtures_1.makeGameState)());
            expect(result.reasoning).toBe("");
        });
        it("getAnalysis_InvalidJson_ReturnsEmptyReasoning", async () => {
            setup.mockInvalidJson("not valid json at all");
            const provider = setup.createProvider("test-key");
            const result = await provider.getAnalysis((0, fixtures_1.makeGameState)());
            expect(result.reasoning).toBe("");
        });
        it("getAnalysis_StandardRequest_IncludesChampionAndEnemyInPayload", async () => {
            const mockApi = setup.mockSuccess(exports.validJsonResponse);
            const provider = setup.createProvider("test-key");
            const state = (0, fixtures_1.makeGameState)({
                localPlayer: { ...(0, fixtures_1.makeGameState)().localPlayer, championName: "Lux" },
                enemies: [{ ...(0, fixtures_1.makeGameState)().localPlayer, championName: "Soraka", team: "CHAOS" }],
            });
            await provider.getAnalysis(state);
            setup.assertStandardRequest(mockApi);
        });
        it("getAnalysis_DefaultModel_UsesExpectedModel", async () => {
            const mockApi = setup.mockSuccess(exports.validJsonResponse);
            const provider = setup.createProvider("test-key");
            await provider.getAnalysis((0, fixtures_1.makeGameState)());
            setup.assertModelPassed(mockApi, setup.expectedDefaultModel);
        });
        it("getAnalysis_CustomModel_UsesSpecifiedModel", async () => {
            const mockApi = setup.mockSuccess(exports.validJsonResponse);
            const provider = setup.createProvider("test-key", setup.expectedCustomModel);
            await provider.getAnalysis((0, fixtures_1.makeGameState)());
            setup.assertModelPassed(mockApi, setup.expectedCustomModel);
        });
    });
}
