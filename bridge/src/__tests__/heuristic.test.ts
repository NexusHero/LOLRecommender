import { buildCompProfile, getHeuristicRecommendations } from "../heuristic";
import { makePlayer } from "./fixtures";

describe("buildCompProfile", () => {
  it("returns full AP ratio for all-AP team", () => {
    const enemies = [
      makePlayer({ championName: "Ahri" }),
      makePlayer({ championName: "Lux" }),
      makePlayer({ championName: "Syndra" }),
    ];

    const profile = buildCompProfile(enemies);

    expect(profile.apRatio).toBe(1);
    expect(profile.adRatio).toBe(0);
  });

  it("returns correct ratios for mixed team", () => {
    const enemies = [
      makePlayer({ championName: "Ahri" }),
      makePlayer({ championName: "Caitlyn" }),
    ];

    const profile = buildCompProfile(enemies);

    expect(profile.apRatio).toBe(0.5);
    expect(profile.adRatio).toBe(0.5);
  });

  it("handles empty enemy list without dividing by zero", () => {
    const profile = buildCompProfile([]);

    expect(profile.apRatio).toBe(0);
    expect(profile.adRatio).toBe(1);
    expect(profile.ccScore).toBe(0);
    expect(profile.healScore).toBe(0);
  });

  it("counts CC champions correctly", () => {
    const enemies = [
      makePlayer({ championName: "Leona" }),
      makePlayer({ championName: "Nautilus" }),
      makePlayer({ championName: "Ahri" }),
    ];

    const profile = buildCompProfile(enemies);

    expect(profile.ccScore).toBe(2);
  });

  it("counts healer champions correctly", () => {
    const enemies = [
      makePlayer({ championName: "Soraka" }),
      makePlayer({ championName: "Yuumi" }),
      makePlayer({ championName: "Caitlyn" }),
    ];

    const profile = buildCompProfile(enemies);

    expect(profile.healScore).toBe(2);
  });

  it("champions can count as both AP and healer", () => {
    const enemies = [makePlayer({ championName: "Soraka" })];

    const profile = buildCompProfile(enemies);

    expect(profile.apRatio).toBe(1);
    expect(profile.healScore).toBe(1);
  });
});

describe("getHeuristicRecommendations", () => {
  it("recommends Morellonomicon vs 2+ healers for AP champion", () => {
    const profile = { apRatio: 0.4, adRatio: 0.6, ccScore: 0, healScore: 2 };

    const rec = getHeuristicRecommendations(profile, "Ahri");

    expect(rec.items.some((i) => i.id === 3165)).toBe(true);
  });

  it("recommends Mortal Reminder vs 2+ healers for AD champion", () => {
    const profile = { apRatio: 0.4, adRatio: 0.6, ccScore: 0, healScore: 2 };

    const rec = getHeuristicRecommendations(profile, "Caitlyn");

    expect(rec.items.some((i) => i.id === 3033)).toBe(true);
  });

  it("recommends Banshee's Veil vs AP-heavy comp", () => {
    const profile = { apRatio: 0.8, adRatio: 0.2, ccScore: 0, healScore: 0 };

    const rec = getHeuristicRecommendations(profile, "Caitlyn");

    expect(rec.items.some((i) => i.id === 3102)).toBe(true);
  });

  it("recommends QSS vs 3+ CC champions", () => {
    const profile = { apRatio: 0.4, adRatio: 0.6, ccScore: 3, healScore: 0 };

    const rec = getHeuristicRecommendations(profile, "Caitlyn");

    expect(rec.items.some((i) => i.id === 3140)).toBe(true);
  });

  it("recommends Randuin's Omen vs AD-heavy comp", () => {
    const profile = { apRatio: 0.1, adRatio: 0.9, ccScore: 0, healScore: 0 };

    const rec = getHeuristicRecommendations(profile, "Malphite");

    expect(rec.items.some((i) => i.id === 3143)).toBe(true);
  });

  it("returns no items for balanced comp with no threats", () => {
    const profile = { apRatio: 0.5, adRatio: 0.5, ccScore: 1, healScore: 1 };

    const rec = getHeuristicRecommendations(profile, "Caitlyn");

    expect(rec.items).toHaveLength(0);
  });

  it("source is always heuristic", () => {
    const profile = { apRatio: 0, adRatio: 1, ccScore: 0, healScore: 0 };

    const rec = getHeuristicRecommendations(profile, "Caitlyn");

    expect(rec.source).toBe("heuristic");
  });
});
