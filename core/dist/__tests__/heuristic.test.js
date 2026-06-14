"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const heuristic_1 = require("../heuristic");
const fixtures_1 = require("./fixtures");
describe("buildCompProfile", () => {
    it("buildCompProfile_AllApChampions_ReturnsApRatioOne", () => {
        const enemies = [
            (0, fixtures_1.makePlayer)({ championName: "Ahri" }),
            (0, fixtures_1.makePlayer)({ championName: "Lux" }),
            (0, fixtures_1.makePlayer)({ championName: "Syndra" }),
        ];
        const profile = (0, heuristic_1.buildCompProfile)(enemies);
        expect(profile.apRatio).toBe(1);
        expect(profile.adRatio).toBe(0);
    });
    it("buildCompProfile_HalfApHalfAd_ReturnsEqualRatios", () => {
        const enemies = [
            (0, fixtures_1.makePlayer)({ championName: "Ahri" }),
            (0, fixtures_1.makePlayer)({ championName: "Caitlyn" }),
        ];
        const profile = (0, heuristic_1.buildCompProfile)(enemies);
        expect(profile.apRatio).toBe(0.5);
        expect(profile.adRatio).toBe(0.5);
    });
    it("buildCompProfile_EmptyEnemyList_ReturnsSafeDefaults", () => {
        const profile = (0, heuristic_1.buildCompProfile)([]);
        expect(profile.apRatio).toBe(0);
        expect(profile.adRatio).toBe(1);
        expect(profile.ccScore).toBe(0);
        expect(profile.healScore).toBe(0);
    });
    it("buildCompProfile_TwoCcChampions_ReturnsCcScoreTwo", () => {
        const enemies = [
            (0, fixtures_1.makePlayer)({ championName: "Leona" }),
            (0, fixtures_1.makePlayer)({ championName: "Nautilus" }),
            (0, fixtures_1.makePlayer)({ championName: "Ahri" }),
        ];
        const profile = (0, heuristic_1.buildCompProfile)(enemies);
        expect(profile.ccScore).toBe(2);
    });
    it("buildCompProfile_TwoHealers_ReturnsHealScoreTwo", () => {
        const enemies = [
            (0, fixtures_1.makePlayer)({ championName: "Soraka" }),
            (0, fixtures_1.makePlayer)({ championName: "Yuumi" }),
            (0, fixtures_1.makePlayer)({ championName: "Caitlyn" }),
        ];
        const profile = (0, heuristic_1.buildCompProfile)(enemies);
        expect(profile.healScore).toBe(2);
    });
    it("buildCompProfile_ApHealerChampion_CountsBothApAndHeal", () => {
        const enemies = [(0, fixtures_1.makePlayer)({ championName: "Soraka" })];
        const profile = (0, heuristic_1.buildCompProfile)(enemies);
        expect(profile.apRatio).toBe(1);
        expect(profile.healScore).toBe(1);
    });
});
describe("getHeuristicRecommendations", () => {
    it("getHeuristicRecommendations_ApChampVsTwoHealers_IncludesMorellonomicon", () => {
        const profile = { apRatio: 0.4, adRatio: 0.6, ccScore: 0, healScore: 2 };
        const rec = (0, heuristic_1.getHeuristicRecommendations)(profile, "Ahri", (0, fixtures_1.makeGameState)());
        expect(rec.items.some((i) => i.id === 3165)).toBe(true);
    });
    it("getHeuristicRecommendations_AdChampVsTwoHealers_IncludesMortalReminder", () => {
        const profile = { apRatio: 0.4, adRatio: 0.6, ccScore: 0, healScore: 2 };
        const rec = (0, heuristic_1.getHeuristicRecommendations)(profile, "Caitlyn", (0, fixtures_1.makeGameState)());
        expect(rec.items.some((i) => i.id === 3033)).toBe(true);
    });
    it("getHeuristicRecommendations_ApHeavyComp_ApChampGetsBansheesVeil", () => {
        const profile = { apRatio: 0.8, adRatio: 0.2, ccScore: 0, healScore: 0 };
        const rec = (0, heuristic_1.getHeuristicRecommendations)(profile, "Ahri", (0, fixtures_1.makeGameState)());
        expect(rec.items.some((i) => i.id === 3102)).toBe(true);
    });
    it("getHeuristicRecommendations_ApHeavyComp_AdChampGetsNoHeuristicItem", () => {
        const profile = { apRatio: 0.8, adRatio: 0.2, ccScore: 0, healScore: 0 };
        const rec = (0, heuristic_1.getHeuristicRecommendations)(profile, "Caitlyn", (0, fixtures_1.makeGameState)());
        // AD champs vs AP-heavy: no heuristic item — LLM handles build recommendation
        expect(rec.items.some((i) => i.id === 3102)).toBe(false);
        expect(rec.items.some((i) => i.id === 3143)).toBe(false);
    });
    it("getHeuristicRecommendations_AdHeavyComp_NoRanduinsForAnyone", () => {
        const profile = { apRatio: 0.1, adRatio: 0.9, ccScore: 0, healScore: 0 };
        const rec = (0, heuristic_1.getHeuristicRecommendations)(profile, "Caitlyn", (0, fixtures_1.makeGameState)());
        // AD-heavy counters are role-specific — handled by LLM, not heuristic
        expect(rec.items.some((i) => i.id === 3143)).toBe(false);
    });
    it("getHeuristicRecommendations_ThreePlusCcChampions_IncludesQss", () => {
        const profile = { apRatio: 0.4, adRatio: 0.6, ccScore: 3, healScore: 0 };
        const rec = (0, heuristic_1.getHeuristicRecommendations)(profile, "Caitlyn", (0, fixtures_1.makeGameState)());
        expect(rec.items.some((i) => i.id === 3140)).toBe(true);
    });
    it("getHeuristicRecommendations_BalancedCompNoThreats_ReturnsEmptyItems", () => {
        const profile = { apRatio: 0.5, adRatio: 0.5, ccScore: 1, healScore: 1 };
        const rec = (0, heuristic_1.getHeuristicRecommendations)(profile, "Caitlyn", (0, fixtures_1.makeGameState)());
        expect(rec.items).toHaveLength(0);
    });
    it("getHeuristicRecommendations_AnyInput_SourceIsAlwaysHeuristic", () => {
        const profile = { apRatio: 0, adRatio: 1, ccScore: 0, healScore: 0 };
        const rec = (0, heuristic_1.getHeuristicRecommendations)(profile, "Caitlyn", (0, fixtures_1.makeGameState)());
        expect(rec.source).toBe("heuristic");
    });
    it("getHeuristicRecommendations_AnyInput_AlwaysIncludesStrategy", () => {
        const profile = { apRatio: 0.5, adRatio: 0.5, ccScore: 1, healScore: 0 };
        const rec = (0, heuristic_1.getHeuristicRecommendations)(profile, "Lux", (0, fixtures_1.makeGameState)());
        expect(rec.strategy).toBeDefined();
        expect(["early", "mid", "late"]).toContain(rec.strategy.winCondition);
        expect(rec.strategy.summary).toBeTruthy();
        expect(rec.strategy.immediateAction).toBeTruthy();
        expect(rec.strategy.lateGamePlan).toBeTruthy();
    });
});
describe("buildHeuristicStrategy", () => {
    const profile = { apRatio: 0.5, adRatio: 0.5, ccScore: 0, healScore: 0 };
    it("buildHeuristicStrategy_EarlyGameAhead_ReturnsEarlyWinCondition", () => {
        const state = (0, fixtures_1.makeGameState)({
            activePlayer: { ...(0, fixtures_1.makeGameState)().activePlayer, currentGold: 2000 },
            localPlayer: {
                ...(0, fixtures_1.makeGameState)().localPlayer,
                scores: { kills: 3, deaths: 0, assists: 2, creepScore: 80, wardScore: 0 },
            },
            gameTime: 5 * 60,
        });
        const strategy = (0, heuristic_1.buildHeuristicStrategy)(state, profile, "Zed");
        expect(strategy.winCondition).toBe("early");
        expect(strategy.summary).toContain("ahead");
    });
    it("buildHeuristicStrategy_EarlyGameBehind_ReturnsLateWinConditionForApChamp", () => {
        const state = (0, fixtures_1.makeGameState)({ gameTime: 5 * 60 });
        const strategy = (0, heuristic_1.buildHeuristicStrategy)(state, profile, "Lux");
        expect(strategy.winCondition).toBe("late");
    });
    it("buildHeuristicStrategy_LateGamePhase_ReturnsLateWinCondition", () => {
        const state = (0, fixtures_1.makeGameState)({ gameTime: 26 * 60 });
        const strategy = (0, heuristic_1.buildHeuristicStrategy)(state, profile, "Caitlyn");
        expect(strategy.winCondition).toBeDefined();
    });
});
