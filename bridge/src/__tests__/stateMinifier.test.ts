import { minifyGameState } from "../stateMinifier.js";
import { makeGameState, makePlayer, makeActivePlayer, makeItem } from "./fixtures.js";

describe("minifyGameState", () => {
  it("minifyGameState_StandardMidGameState_ContainsAllPlayerFields", () => {
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
    expect(result).toContain("Me: Ahri [MID] (Lvl 6, Gold: 1300, KDA: 2/1/0, CS: 30)");
    expect(result).toContain("My Items: Lost Chapter");
    expect(result).toContain("Allies: Lee Sin [MID] (Lvl 5, KDA: 1/0/2, CS: 20)");
    expect(result).toContain("Enemies: Zed [MID] (Lvl 6, KDA: 3/0/0, CS: 35)");
  });

  it("minifyGameState_EmptyItemsAndTeams_ShowsNonePlaceholders", () => {
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

  describe("early game phase", () => {
    it("minifyGameState_LevelOneZeroItemsAt30Seconds_FormatsCorrectly", () => {
      const state = makeGameState({
        gameTime: 30,
        localPlayer: makePlayer({
          championName: "Lux",
          level: 1,
          scores: { kills: 0, deaths: 0, assists: 0, creepScore: 0, wardScore: 0 },
          items: [],
        }),
        activePlayer: makeActivePlayer({ currentGold: 500 }),
      });

      const result = minifyGameState(state);

      expect(result).toContain("Time: 0:30");
      expect(result).toContain("Me: Lux [MID] (Lvl 1, Gold: 500, KDA: 0/0/0, CS: 0)");
      expect(result).toContain("My Items: None");
    });
  });

  describe("mid game phase", () => {
    it("minifyGameState_Level11WithTwoItemsAt15Minutes_FormatsCorrectly", () => {
      const state = makeGameState({
        gameTime: 900,
        localPlayer: makePlayer({
          championName: "Yasuo",
          level: 11,
          scores: { kills: 5, deaths: 2, assists: 1, creepScore: 120, wardScore: 5 },
          items: [
            makeItem({ displayName: "Berserker's Greaves" }),
            makeItem({ displayName: "Kraken Slayer" }),
          ],
        }),
        activePlayer: makeActivePlayer({ currentGold: 850 }),
      });

      const result = minifyGameState(state);

      expect(result).toContain("Time: 15:00");
      expect(result).toContain("Me: Yasuo [MID] (Lvl 11, Gold: 850, KDA: 5/2/1, CS: 120, Vision: 5)");
      expect(result).toContain("My Items: Berserker's Greaves, Kraken Slayer");
    });
  });

  describe("late game phase", () => {
    it("minifyGameState_Level18FullBuildAt40Minutes_FormatsCorrectly", () => {
      const state = makeGameState({
        gameTime: 2400,
        localPlayer: makePlayer({
          championName: "Vayne",
          level: 18,
          scores: { kills: 15, deaths: 4, assists: 8, creepScore: 350, wardScore: 12 },
          items: Array(6).fill(makeItem({ displayName: "Infinity Edge" })),
        }),
        activePlayer: makeActivePlayer({ currentGold: 3200 }),
      });

      const result = minifyGameState(state);

      expect(result).toContain("Time: 40:00");
      expect(result).toContain("Me: Vayne [MID] (Lvl 18, Gold: 3200, KDA: 15/4/8, CS: 350, Vision: 12)");
      expect(result).toContain(
        "Infinity Edge, Infinity Edge, Infinity Edge, Infinity Edge, Infinity Edge, Infinity Edge",
      );
    });

    it("minifyGameState_HighKdaAndMassiveGoldLead_FormatsSnowballScenario", () => {
      const state = makeGameState({
        gameTime: 1200,
        localPlayer: makePlayer({
          championName: "Draven",
          level: 14,
          scores: { kills: 20, deaths: 0, assists: 5, creepScore: 200, wardScore: 2 },
          items: [makeItem({ displayName: "Bloodthirster" })],
        }),
        activePlayer: makeActivePlayer({ currentGold: 10500 }),
      });

      const result = minifyGameState(state);

      expect(result).toContain("Me: Draven [MID] (Lvl 14, Gold: 10500, KDA: 20/0/5, CS: 200, Vision: 2)");
    });
  });

  describe("edge cases", () => {
    it("minifyGameState_NegativeGameTime_ClampsToZero", () => {
      const state = makeGameState({
        gameTime: -15.5,
        localPlayer: makePlayer({
          championName: "Zilean",
          level: 30,
          scores: { kills: 999, deaths: 999, assists: 999, creepScore: 999, wardScore: 999 },
          items: [],
        }),
        activePlayer: makeActivePlayer({ currentGold: -500 }),
      });

      const result = minifyGameState(state);

      expect(result).toContain("Time: 0:00");
      expect(result).toContain("Me: Zilean [MID] (Lvl 30, Gold: -500, KDA: 999/999/999, CS: 999, Vision: 999)");
    });
  });
});
