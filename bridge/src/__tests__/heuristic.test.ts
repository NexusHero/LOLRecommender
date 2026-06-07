import { buildCompProfile, getHeuristicRecommendations } from "../heuristic";
import { makePlayer } from "./fixtures";

describe("buildCompProfile", () => {
  it("buildCompProfile_AllApChampions_ReturnsApRatioOne", () => {
    const enemies = [
      makePlayer({ championName: "Ahri" }),
      makePlayer({ championName: "Lux" }),
      makePlayer({ championName: "Syndra" }),
    ];

    const profile = buildCompProfile(enemies);

    expect(profile.apRatio).toBe(1);
    expect(profile.adRatio).toBe(0);
  });

  it("buildCompProfile_HalfApHalfAd_ReturnsEqualRatios", () => {
    const enemies = [
      makePlayer({ championName: "Ahri" }),
      makePlayer({ championName: "Caitlyn" }),
    ];

    const profile = buildCompProfile(enemies);

    expect(profile.apRatio).toBe(0.5);
    expect(profile.adRatio).toBe(0.5);
  });

  it("buildCompProfile_EmptyEnemyList_ReturnsSafeDefaults", () => {
    const profile = buildCompProfile([]);

    expect(profile.apRatio).toBe(0);
    expect(profile.adRatio).toBe(1);
    expect(profile.ccScore).toBe(0);
    expect(profile.healScore).toBe(0);
  });

  it("buildCompProfile_TwoCcChampions_ReturnsCcScoreTwo", () => {
    const enemies = [
      makePlayer({ championName: "Leona" }),
      makePlayer({ championName: "Nautilus" }),
      makePlayer({ championName: "Ahri" }),
    ];

    const profile = buildCompProfile(enemies);

    expect(profile.ccScore).toBe(2);
  });

  it("buildCompProfile_TwoHealers_ReturnsHealScoreTwo", () => {
    const enemies = [
      makePlayer({ championName: "Soraka" }),
      makePlayer({ championName: "Yuumi" }),
      makePlayer({ championName: "Caitlyn" }),
    ];

    const profile = buildCompProfile(enemies);

    expect(profile.healScore).toBe(2);
  });

  it("buildCompProfile_ApHealerChampion_CountsBothApAndHeal", () => {
    const enemies = [makePlayer({ championName: "Soraka" })];

    const profile = buildCompProfile(enemies);

    expect(profile.apRatio).toBe(1);
    expect(profile.healScore).toBe(1);
  });
});

describe("getHeuristicRecommendations", () => {
  it("getHeuristicRecommendations_ApChampVsTwoHealers_IncludesMorellonomicon", () => {
    const profile = { apRatio: 0.4, adRatio: 0.6, ccScore: 0, healScore: 2 };

    const rec = getHeuristicRecommendations(profile, "Ahri");

    expect(rec.items.some((i) => i.id === 3165)).toBe(true);
  });

  it("getHeuristicRecommendations_AdChampVsTwoHealers_IncludesMortalReminder", () => {
    const profile = { apRatio: 0.4, adRatio: 0.6, ccScore: 0, healScore: 2 };

    const rec = getHeuristicRecommendations(profile, "Caitlyn");

    expect(rec.items.some((i) => i.id === 3033)).toBe(true);
  });

  it("getHeuristicRecommendations_ApHeavyComp_IncludesBansheesVeil", () => {
    const profile = { apRatio: 0.8, adRatio: 0.2, ccScore: 0, healScore: 0 };

    const rec = getHeuristicRecommendations(profile, "Caitlyn");

    expect(rec.items.some((i) => i.id === 3102)).toBe(true);
  });

  it("getHeuristicRecommendations_ThreePlusCcChampions_IncludesQss", () => {
    const profile = { apRatio: 0.4, adRatio: 0.6, ccScore: 3, healScore: 0 };

    const rec = getHeuristicRecommendations(profile, "Caitlyn");

    expect(rec.items.some((i) => i.id === 3140)).toBe(true);
  });

  it("getHeuristicRecommendations_AdHeavyComp_IncludesRanduinsOmen", () => {
    const profile = { apRatio: 0.1, adRatio: 0.9, ccScore: 0, healScore: 0 };

    const rec = getHeuristicRecommendations(profile, "Malphite");

    expect(rec.items.some((i) => i.id === 3143)).toBe(true);
  });

  it("getHeuristicRecommendations_BalancedCompNoThreats_ReturnsEmptyItems", () => {
    const profile = { apRatio: 0.5, adRatio: 0.5, ccScore: 1, healScore: 1 };

    const rec = getHeuristicRecommendations(profile, "Caitlyn");

    expect(rec.items).toHaveLength(0);
  });

  it("getHeuristicRecommendations_AnyInput_SourceIsAlwaysHeuristic", () => {
    const profile = { apRatio: 0, adRatio: 1, ccScore: 0, healScore: 0 };

    const rec = getHeuristicRecommendations(profile, "Caitlyn");

    expect(rec.source).toBe("heuristic");
  });
});
