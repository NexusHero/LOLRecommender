import { EventDetector } from "../eventDetector";
import { makeGameState, makePlayer, makeItem, makeActivePlayer } from "./fixtures";

describe("EventDetector", () => {
  let detector: EventDetector;

  beforeEach(() => {
    detector = new EventDetector();
  });

  describe("detect", () => {
    it("fires GAME_STARTED on first call", () => {
      const events = detector.detect(makeGameState());

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("GAME_STARTED");
    });

    it("does not fire GAME_STARTED on second call", () => {
      const state = makeGameState();
      detector.detect(state);

      const events = detector.detect(state);

      expect(events.every((e) => e.type !== "GAME_STARTED")).toBe(true);
    });

    it("detects item purchase by enemy", () => {
      const enemy = makePlayer({ summonerName: "Enemy1", team: "CHAOS" });
      detector.detect(makeGameState({ enemies: [enemy] }));

      const enemyWithItem = { ...enemy, items: [makeItem({ itemID: 3102 })] };
      const events = detector.detect(makeGameState({ enemies: [enemyWithItem] }));

      expect(events.some((e) => e.type === "ITEM_PURCHASED")).toBe(true);
    });

    it("does not fire ITEM_PURCHASED for already owned items", () => {
      const item = makeItem({ itemID: 3102 });
      const enemy = makePlayer({ summonerName: "Enemy1", team: "CHAOS", items: [item] });
      detector.detect(makeGameState({ enemies: [enemy] }));

      const events = detector.detect(makeGameState({ enemies: [enemy] }));

      expect(events.every((e) => e.type !== "ITEM_PURCHASED")).toBe(true);
    });

    it("detects level up of local player", () => {
      detector.detect(makeGameState({ localPlayer: makePlayer({ level: 1 }) }));

      const events = detector.detect(
        makeGameState({ localPlayer: makePlayer({ level: 2 }) })
      );

      const levelUp = events.find((e) => e.type === "LEVEL_UP");
      expect(levelUp).toBeDefined();
      if (levelUp?.type === "LEVEL_UP") {
        expect(levelUp.newLevel).toBe(2);
      }
    });

    it("fires GAME_TICK when crossing a 30-second boundary", () => {
      detector.detect(makeGameState({ gameTime: 1 }));

      const events = detector.detect(makeGameState({ gameTime: 31 }));

      expect(events.some((e) => e.type === "GAME_TICK")).toBe(true);
    });

    it("does not fire GAME_TICK within same 30-second window", () => {
      detector.detect(makeGameState({ gameTime: 1 }));

      const events = detector.detect(makeGameState({ gameTime: 15 }));

      expect(events.every((e) => e.type !== "GAME_TICK")).toBe(true);
    });

    it("fires PLAYER_DIED when localPlayer.isDead transitions from false to true", () => {
      detector.detect(makeGameState({ localPlayer: makePlayer({ isDead: false }) }));

      const events = detector.detect(makeGameState({ localPlayer: makePlayer({ isDead: true }) }));

      expect(events.some((e) => e.type === "PLAYER_DIED")).toBe(true);
    });

    it("does not fire PLAYER_DIED if localPlayer remains dead", () => {
      detector.detect(makeGameState({ localPlayer: makePlayer({ isDead: true }) }));
      // flush GAME_STARTED
      detector.reset();
      detector.detect(makeGameState({ localPlayer: makePlayer({ isDead: true }) }));

      const events = detector.detect(makeGameState({ localPlayer: makePlayer({ isDead: true }) }));

      expect(events.every((e) => e.type !== "PLAYER_DIED")).toBe(true);
    });

    it("fires HIGH_GOLD_REACHED when activePlayer crosses 1000g", () => {
      detector.detect(makeGameState({ activePlayer: makeActivePlayer({ currentGold: 900 }) }));

      const events = detector.detect(makeGameState({ activePlayer: makeActivePlayer({ currentGold: 1050 }) }));

      expect(events.some((e) => e.type === "HIGH_GOLD_REACHED")).toBe(true);
    });

    it("does not fire HIGH_GOLD_REACHED if gold was already above 1000g", () => {
      detector.detect(makeGameState({ activePlayer: makeActivePlayer({ currentGold: 1100 }) }));

      const events = detector.detect(makeGameState({ activePlayer: makeActivePlayer({ currentGold: 1500 }) }));

      expect(events.every((e) => e.type !== "HIGH_GOLD_REACHED")).toBe(true);
    });
  });

  describe("reset", () => {
    it("fires GAME_STARTED again after reset", () => {
      detector.detect(makeGameState());
      detector.reset();

      const events = detector.detect(makeGameState());

      expect(events[0].type).toBe("GAME_STARTED");
    });

    it("clears last state so old events are not re-detected", () => {
      const enemy = makePlayer({ summonerName: "E", team: "CHAOS", items: [makeItem()] });
      detector.detect(makeGameState({ enemies: [enemy] }));
      detector.reset();
      detector.detect(makeGameState({ enemies: [enemy] })); // re-fires GAME_STARTED

      const events = detector.detect(makeGameState({ enemies: [enemy] }));

      expect(events.every((e) => e.type !== "ITEM_PURCHASED")).toBe(true);
    });
  });
});
