import type { LlmProvider } from "../llmProvider";
import { makeGameState, makeBaseRec } from "./fixtures";

export interface ProviderTestSetup {
  providerName: string;
  createProvider: (key: string, model?: string) => LlmProvider;
  mockSuccess: (jsonResponse: string) => any;
  mockFailure: (error: Error) => any;
  mockInvalidJson: (invalidJson: string) => any;
  mockEmptyContent: () => any;
  assertStandardRequest: (mockApi: any) => void;
  expectedDefaultModel: string;
  expectedCustomModel: string;
  assertModelPassed: (mockApi: any, model: string) => void;
}

export const validJsonResponse = JSON.stringify({
  itemReasoning: "LLM reasoning text",
  strategy: {
    winCondition: "early",
    summary: "Push your lead.",
    immediateAction: "Take objectives.",
    lateGamePlan: "End fast.",
  },
});

export function runLlmProviderContract(setup: ProviderTestSetup) {
  const baseRec = makeBaseRec();

  describe(`Contract Tests: ${setup.providerName}`, () => {
    it("getAnalysis_ValidApiKey_ReturnsLlmReasoningAndStrategy", async () => {
      setup.mockSuccess(validJsonResponse);
      const provider = setup.createProvider("test-key");

      const result = await provider.getAnalysis(makeGameState(), baseRec);

      expect(result.reasoning).toBe("LLM reasoning text");
      expect(result.strategy.winCondition).toBe("early");
      expect(result.strategy.summary).toBe("Push your lead.");
    });

    it("getAnalysis_ClientThrows_PropagatesErrorWithProviderPrefix", async () => {
      setup.mockFailure(new Error("API unavailable"));
      const provider = setup.createProvider("test-key");

      await expect(provider.getAnalysis(makeGameState(), baseRec)).rejects.toThrow(
        `${setup.providerName}: API unavailable`
      );
    });

    it("getAnalysis_EmptyContent_FallsBackToHeuristicReasoningAndStrategy", async () => {
      setup.mockEmptyContent();
      const provider = setup.createProvider("test-key");

      const result = await provider.getAnalysis(makeGameState(), baseRec);

      expect(result.reasoning).toBe("heuristic reasoning");
      expect(result.strategy).toEqual(baseRec.strategy);
    });

    it("getAnalysis_InvalidJson_FallsBackToHeuristicReasoningAndStrategy", async () => {
      setup.mockInvalidJson("not valid json at all");
      const provider = setup.createProvider("test-key");

      const result = await provider.getAnalysis(makeGameState(), baseRec);

      expect(result.reasoning).toBe("heuristic reasoning");
      expect(result.strategy).toEqual(baseRec.strategy);
    });

    it("getAnalysis_StandardRequest_IncludesChampionAndEnemyInPayload", async () => {
      const mockApi = setup.mockSuccess(validJsonResponse);
      const provider = setup.createProvider("test-key");
      const state = makeGameState({
        localPlayer: { ...makeGameState().localPlayer, championName: "Lux" },
        enemies: [{ ...makeGameState().localPlayer, championName: "Soraka", team: "CHAOS" }],
      });

      await provider.getAnalysis(state, baseRec);

      setup.assertStandardRequest(mockApi);
    });

    it("getAnalysis_DefaultModel_UsesExpectedModel", async () => {
      const mockApi = setup.mockSuccess(validJsonResponse);
      const provider = setup.createProvider("test-key");

      await provider.getAnalysis(makeGameState(), baseRec);

      setup.assertModelPassed(mockApi, setup.expectedDefaultModel);
    });

    it("getAnalysis_CustomModel_UsesSpecifiedModel", async () => {
      const mockApi = setup.mockSuccess(validJsonResponse);
      const provider = setup.createProvider("test-key", setup.expectedCustomModel);

      await provider.getAnalysis(makeGameState(), baseRec);

      setup.assertModelPassed(mockApi, setup.expectedCustomModel);
    });
  });
}
