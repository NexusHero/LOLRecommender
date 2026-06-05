import { minifyGameState } from "../stateMinifier.js";
import { makeGameState, makePlayer, makeActivePlayer, makeItem } from "./fixtures.js";

describe("stateMinifier", () => {
  it("compresses the game state into a readable string", () => {
    const state = makeGameState({
      gameTime: 125,
      localPlayer: makePlayer({
        championName: "Ahri",
        level: 6,
        scores: { kills: 2, deaths: 1, assists: 0, creepScore: 30, wardScore: 0 },
        items: [makeItem({ displayName: "Lost Chapter" })],
      }),
      activePlayer: makeActivePlayer({ currentGold: 1300 }),
      allies: [
        makePlayer({
          championName: "Lee Sin",
          level: 5,
          scores: { kills: 1, deaths: 0, assists: 2, creepScore: 20, wardScore: 0 },
        }),
      ],
      enemies: [
        makePlayer({
          championName: "Zed",
          level: 6,
          scores: { kills: 3, deaths: 0, assists: 0, creepScore: 35, wardScore: 0 },
        }),
      ],
    });

    const result = minifyGameState(state);

    expect(result).toContain("Time: 2:05");
    expect(result).toContain("Me: Ahri (Lvl 6, Gold: 1300, KDA: 2/1/0)");
    expect(result).toContain("My Items: Lost Chapter");
    expect(result).toContain("Allies: Lee Sin (Lvl 5, KDA: 1/0/2)");
    expect(result).toContain("Enemies: Zed (Lvl 6, KDA: 3/0/0)");
  });

  it("handles empty items and empty teams gracefully", () => {
    const state = makeGameState({
      gameTime: 0,
      localPlayer: makePlayer({ items: [] }),
      activePlayer: makeActivePlayer({ currentGold: 500 }),
      allies: [],
      enemies: [],
    });

    const result = minifyGameState(state);

    expect(result).toContain("Time: 0:00");
    expect(result).toContain("My Items: None");
    expect(result).toContain("Allies: None");
    expect(result).toContain("Enemies: None");
  });
});
