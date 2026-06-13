import { EventDetector } from "../eventDetector";
import { makeGameState, makePlayer, makeItem, makeActivePlayer } from "./fixtures";

describe("EventDetector", () => {
  let detector: EventDetector;

  beforeEach(() => {
    detector = new EventDetector();
  });

  describe("detect", () => {
    it("detect_FirstCall_EmitsGameStarted", () => {
      const events = detector.detect(makeGameState());

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("GAME_STARTED");
    });

    it("detect_SameStateSecondCall_DoesNotEmitGameStarted", () => {
      const state = makeGameState();
      detector.detect(state);

      const events = detector.detect(state);

      expect(events.every((e) => e.type !== "GAME_STARTED")).toBe(true);
    });

    it("detect_EnemyBuysNewItem_EmitsItemPurchased", () => {
      const enemy = makePlayer({ summonerName: "Enemy1", team: "CHAOS" });
      detector.detect(makeGameState({ enemies: [enemy] }));
      const enemyWithItem = { ...enemy, items: [makeItem({ itemID: 3102 })] };

      const events = detector.detect(makeGameState({ enemies: [enemyWithItem] }));

      expect(events.some((e) => e.type === "ITEM_PURCHASED")).toBe(true);
    });

    it("detect_EnemyHasExistingItem_DoesNotEmitItemPurchased", () => {
      const item = makeItem({ itemID: 3102 });
      const enemy = makePlayer({ summonerName: "Enemy1", team: "CHAOS", items: [item] });
      detector.detect(makeGameState({ enemies: [enemy] }));

      const events = detector.detect(makeGameState({ enemies: [enemy] }));

      expect(events.every((e) => e.type !== "ITEM_PURCHASED")).toBe(true);
    });

    it("detect_LocalPlayerLevelsUp_EmitsLevelUpWithNewLevel", () => {
      detector.detect(makeGameState({ localPlayer: makePlayer({ level: 1 }) }));

      const events = detector.detect(
        makeGameState({ localPlayer: makePlayer({ level: 2 }) }),
      );

      const levelUp = events.find((e) => e.type === "LEVEL_UP");
      expect(levelUp).toBeDefined();
      if (levelUp?.type === "LEVEL_UP") {
        expect(levelUp.newLevel).toBe(2);
      }
    });

    it("detect_GameTimeCrossesTickBoundary_EmitsGameTick", () => {
      detector.detect(makeGameState({ gameTime: 1 }));

      const events = detector.detect(makeGameState({ gameTime: 31 }));

      expect(events.some((e) => e.type === "GAME_TICK")).toBe(true);
    });

    it("detect_GameTimeWithinSameTickWindow_DoesNotEmitGameTick", () => {
      detector.detect(makeGameState({ gameTime: 1 }));

      const events = detector.detect(makeGameState({ gameTime: 15 }));

      expect(events.every((e) => e.type !== "GAME_TICK")).toBe(true);
    });

    it("detect_LocalPlayerTransitionsToIsDead_EmitsPlayerDied", () => {
      detector.detect(makeGameState({ localPlayer: makePlayer({ isDead: false }) }));

      const events = detector.detect(
        makeGameState({ localPlayer: makePlayer({ isDead: true }) }),
      );

      expect(events.some((e) => e.type === "PLAYER_DIED")).toBe(true);
    });

    it("detect_LocalPlayerRemainsIsDead_DoesNotEmitPlayerDied", () => {
      detector.detect(makeGameState({ localPlayer: makePlayer({ isDead: true }) }));
      detector.reset();
      detector.detect(makeGameState({ localPlayer: makePlayer({ isDead: true }) }));

      const events = detector.detect(
        makeGameState({ localPlayer: makePlayer({ isDead: true }) }),
      );

      expect(events.every((e) => e.type !== "PLAYER_DIED")).toBe(true);
    });

    it("detect_GoldCrossesThreshold_EmitsHighGoldReached", () => {
      detector.detect(makeGameState({ activePlayer: makeActivePlayer({ currentGold: 900 }) }));

      const events = detector.detect(
        makeGameState({ activePlayer: makeActivePlayer({ currentGold: 1050 }) }),
      );

      expect(events.some((e) => e.type === "HIGH_GOLD_REACHED")).toBe(true);
    });

    it("detect_GoldAlreadyAboveThreshold_DoesNotEmitHighGoldReached", () => {
      detector.detect(makeGameState({ activePlayer: makeActivePlayer({ currentGold: 1100 }) }));

      const events = detector.detect(
        makeGameState({ activePlayer: makeActivePlayer({ currentGold: 1500 }) }),
      );

      expect(events.every((e) => e.type !== "HIGH_GOLD_REACHED")).toBe(true);
    });
  });

  describe("reset", () => {
    it("reset_AfterReset_NextDetectEmitsGameStarted", () => {
      detector.detect(makeGameState());
      detector.reset();

      const events = detector.detect(makeGameState());

      expect(events[0].type).toBe("GAME_STARTED");
    });

    it("reset_AfterReset_OldItemsDoNotTriggerItemPurchased", () => {
      const enemy = makePlayer({ summonerName: "E", team: "CHAOS", items: [makeItem()] });
      detector.detect(makeGameState({ enemies: [enemy] }));
      detector.reset();
      detector.detect(makeGameState({ enemies: [enemy] }));

      const events = detector.detect(makeGameState({ enemies: [enemy] }));

      expect(events.every((e) => e.type !== "ITEM_PURCHASED")).toBe(true);
    });
  });
});
