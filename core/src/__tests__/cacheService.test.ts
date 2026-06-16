import { CacheService } from "../cacheService";
import { makeGameState, makePlayer } from "./fixtures";

describe("CacheService.buildKey", () => {
  it("buildKey_DifferentRiskLevels_ProducesDifferentKeys", () => {
    const cache = new CacheService();
    const state = makeGameState();

    const safeKey = cache.buildKey(state, "safe");
    const riskyKey = cache.buildKey(state, "risky");

    expect(safeKey).not.toBe(riskyKey);
  });

  it("buildKey_ConsecutiveDeaths_ProducesDifferentKeys", () => {
    const cache = new CacheService();
    const before = makeGameState({
      localPlayer: makePlayer({ scores: { assists: 0, creepScore: 0, deaths: 0, kills: 0, wardScore: 0 } }),
    });
    const after = makeGameState({
      localPlayer: makePlayer({ scores: { assists: 0, creepScore: 0, deaths: 1, kills: 0, wardScore: 0 } }),
    });

    expect(cache.buildKey(before)).not.toBe(cache.buildKey(after));
  });

  it("buildKey_SameStateAndRisk_ProducesStableKey", () => {
    const cache = new CacheService();
    const state = makeGameState();

    expect(cache.buildKey(state, "normal")).toBe(cache.buildKey(state, "normal"));
  });
});
