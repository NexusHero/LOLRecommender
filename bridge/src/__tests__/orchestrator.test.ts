import { BridgeOrchestrator } from "../orchestrator";
import { EventDetector } from "../eventDetector";
import { BridgeWsServer } from "../wsServer";
import { makeRawGameData, makePlayer, makeItem, makeActivePlayer } from "./fixtures";
import type { WsMessage } from "../types";
import type { LlmProvider } from "../llmProvider";

function setup(overrides: {
  hasLlm?: boolean;
  clientCount?: number;
  llmResult?: string;
  clock?: () => number;
} = {}) {
  const broadcasts: WsMessage[] = [];
  const wsServer = {
    broadcast: jest.fn((msg: WsMessage) => broadcasts.push(msg)),
    clientCount: overrides.clientCount ?? 1,
    close: jest.fn(),
  } as unknown as BridgeWsServer;

  const llmProvider = {
    name: "mock",
    getExplanation: jest.fn().mockResolvedValue(overrides.llmResult ?? "LLM says buy this"),
  } as unknown as LlmProvider;

  const orchestrator = new BridgeOrchestrator(
    wsServer,
    new EventDetector(),
    overrides.hasLlm === false ? null : llmProvider,
    {
      summonerName: "TestPlayer",
      llmCooldownMs: 60_000,
    },
    overrides.clock ?? (() => 1000),
  );

  return { orchestrator, wsServer, llmProvider, broadcasts };
}

describe("BridgeOrchestrator", () => {
  describe("handleGameData", () => {
    it("broadcasts GAME_STARTED on first call", async () => {
      const { orchestrator, broadcasts } = setup();

      await orchestrator.handleGameData(makeRawGameData());

      const events = broadcasts.map((b) => b.event);
      expect(events).toContain("GAME_STARTED");
    });

    it("broadcasts RECOMMENDATION on GAME_STARTED", async () => {
      const { orchestrator, broadcasts } = setup();

      await orchestrator.handleGameData(makeRawGameData());

      const events = broadcasts.map((b) => b.event);
      expect(events).toContain("RECOMMENDATION");
    });

    it("broadcasts RECOMMENDATION on ITEM_PURCHASED", async () => {
      const enemy = makePlayer({ summonerName: "Enemy1", team: "CHAOS" });
      const { orchestrator, broadcasts } = setup();

      // First call — GAME_STARTED
      await orchestrator.handleGameData(
        makeRawGameData([makePlayer(), enemy]),
      );
      broadcasts.length = 0;

      // Second call — enemy bought an item
      const enemyWithItem = { ...enemy, items: [makeItem({ itemID: 3102 })] };
      await orchestrator.handleGameData(
        makeRawGameData([makePlayer(), enemyWithItem]),
      );

      const events = broadcasts.map((b) => b.event);
      expect(events).toContain("ITEM_PURCHASED");
      expect(events).toContain("RECOMMENDATION");
    });

    it("does NOT broadcast RECOMMENDATION on GAME_TICK", async () => {
      const { orchestrator, broadcasts } = setup();

      // First call at gameTime=1
      const raw1 = makeRawGameData();
      raw1.gameData.gameTime = 1;
      await orchestrator.handleGameData(raw1);
      broadcasts.length = 0;

      // Second call at gameTime=31 — crosses 30s tick boundary
      const raw2 = makeRawGameData();
      raw2.gameData.gameTime = 31;
      await orchestrator.handleGameData(raw2);

      const events = broadcasts.map((b) => b.event);
      expect(events).toContain("GAME_TICK");
      expect(events).not.toContain("RECOMMENDATION");
    });

    it("does NOT broadcast RECOMMENDATION on LEVEL_UP", async () => {
      const { orchestrator, broadcasts } = setup();

      const raw1 = makeRawGameData([makePlayer({ level: 1 })]);
      await orchestrator.handleGameData(raw1);
      broadcasts.length = 0;

      const raw2 = makeRawGameData([makePlayer({ level: 2 })]);
      await orchestrator.handleGameData(raw2);

      const events = broadcasts.map((b) => b.event);
      expect(events).toContain("LEVEL_UP");
      expect(events).not.toContain("RECOMMENDATION");
    });

    it("includes gameState in broadcast", async () => {
      const { orchestrator, broadcasts } = setup();

      await orchestrator.handleGameData(makeRawGameData());

      const gameStarted = broadcasts.find((b) => b.event === "GAME_STARTED");
      expect(gameStarted?.gameState).toBeDefined();
      expect(gameStarted?.gameState?.gameMode).toBe("CLASSIC");
    });
  });

  describe("LLM cooldown", () => {
    it("uses heuristic source when no LLM provider", async () => {
      const { orchestrator, broadcasts } = setup({ hasLlm: false });

      await orchestrator.handleGameData(makeRawGameData());

      const rec = broadcasts.find((b) => b.event === "RECOMMENDATION");
      expect(rec?.recommendation?.source).toBe("heuristic");
    });

    it("uses LLM source when provider is set and cooldown passed", async () => {
      const { orchestrator, broadcasts } = setup({
        hasLlm: true,
        clientCount: 1,
        clock: () => 100_000,
      });

      await orchestrator.handleGameData(makeRawGameData());

      const rec = broadcasts.find((b) => b.event === "RECOMMENDATION");
      expect(rec?.recommendation?.source).toBe("llm");
    });

    it("ITEM_PURCHASED always uses heuristic (LLM is not triggered for item events)", async () => {
      const { orchestrator, broadcasts, llmProvider } = setup({
        hasLlm: true,
        clientCount: 1,
        clock: () => 100_000,
      });

      const enemy = makePlayer({ summonerName: "Enemy1", team: "CHAOS" });

      // First call — GAME_STARTED
      await orchestrator.handleGameData(makeRawGameData([makePlayer(), enemy]));
      (llmProvider.getExplanation as jest.Mock).mockClear();
      broadcasts.length = 0;

      // Enemy buys item — ITEM_PURCHASED, LLM must NOT be called
      const enemyWithItem = { ...enemy, items: [makeItem({ itemID: 3102 })] };
      await orchestrator.handleGameData(makeRawGameData([makePlayer(), enemyWithItem]));

      const rec = broadcasts.find((b) => b.event === "RECOMMENDATION");
      expect(rec?.recommendation?.source).toBe("heuristic");
      expect(llmProvider.getExplanation).not.toHaveBeenCalled();
    });

    it("skips LLM when no clients are connected", async () => {
      const { orchestrator, broadcasts, llmProvider } = setup({
        hasLlm: true,
        clientCount: 0,
        clock: () => 100_000,
      });

      await orchestrator.handleGameData(makeRawGameData());

      const rec = broadcasts.find((b) => b.event === "RECOMMENDATION");
      expect(rec?.recommendation?.source).toBe("heuristic");
      expect(llmProvider.getExplanation).not.toHaveBeenCalled();
    });
  });

  describe("PLAYER_DIED trigger", () => {
    it("always uses LLM regardless of current gold", async () => {
      const { orchestrator, broadcasts, llmProvider } = setup({
        hasLlm: true,
        clientCount: 1,
        clock: () => 100_000,
      });

      await orchestrator.handleGameData(makeRawGameData());
      (llmProvider.getExplanation as jest.Mock).mockClear();
      broadcasts.length = 0;

      // Player dies with very low gold — old code would have skipped LLM
      const raw2 = makeRawGameData([makePlayer({ isDead: true })]);
      raw2.activePlayer = makeActivePlayer({ currentGold: 50 });
      await orchestrator.handleGameData(raw2);

      const rec = broadcasts.find((b) => b.event === "RECOMMENDATION");
      expect(rec?.recommendation?.source).toBe("llm");
      expect(llmProvider.getExplanation).toHaveBeenCalledTimes(1);
    });

    it("always uses LLM even when called immediately after GAME_STARTED (no cooldown)", async () => {
      let now = 100_000;
      const { orchestrator, broadcasts, llmProvider } = setup({
        hasLlm: true,
        clientCount: 1,
        clock: () => now,
      });

      await orchestrator.handleGameData(makeRawGameData());
      (llmProvider.getExplanation as jest.Mock).mockClear();
      broadcasts.length = 0;

      // Death only 2 seconds after game start — well within any cooldown window
      now = 102_000;
      await orchestrator.handleGameData(makeRawGameData([makePlayer({ isDead: true })]));

      const rec = broadcasts.find((b) => b.event === "RECOMMENDATION");
      expect(rec?.recommendation?.source).toBe("llm");
      expect(llmProvider.getExplanation).toHaveBeenCalledTimes(1);
    });
  });

  describe("triggerManualAnalysis", () => {
    it("does nothing and emits no broadcasts when no game state has been received", async () => {
      const { orchestrator, broadcasts } = setup({ hasLlm: true, clientCount: 1 });

      await orchestrator.triggerManualAnalysis();

      expect(broadcasts).toHaveLength(0);
    });

    it("broadcasts a RECOMMENDATION using the last known state", async () => {
      const { orchestrator, broadcasts } = setup({ hasLlm: false, clientCount: 1 });

      await orchestrator.handleGameData(makeRawGameData());
      broadcasts.length = 0;

      await orchestrator.triggerManualAnalysis();

      const rec = broadcasts.find((b) => b.event === "RECOMMENDATION");
      expect(rec).toBeDefined();
      expect(rec?.gameState).toBeDefined();
    });

    it("uses LLM when a provider is set", async () => {
      const { orchestrator, broadcasts, llmProvider } = setup({
        hasLlm: true,
        clientCount: 1,
      });

      await orchestrator.handleGameData(makeRawGameData());
      (llmProvider.getExplanation as jest.Mock).mockClear();
      broadcasts.length = 0;

      await orchestrator.triggerManualAnalysis();

      expect(llmProvider.getExplanation).toHaveBeenCalledTimes(1);
      const rec = broadcasts.find((b) => b.event === "RECOMMENDATION");
      expect(rec?.recommendation?.source).toBe("llm");
    });

    it("falls back to heuristic when no LLM provider is configured", async () => {
      const { orchestrator, broadcasts } = setup({ hasLlm: false, clientCount: 1 });

      await orchestrator.handleGameData(makeRawGameData());
      broadcasts.length = 0;

      await orchestrator.triggerManualAnalysis();

      const rec = broadcasts.find((b) => b.event === "RECOMMENDATION");
      expect(rec?.recommendation?.source).toBe("heuristic");
    });

    it("does nothing after resetDetector clears the last state", async () => {
      const { orchestrator, broadcasts } = setup({ hasLlm: true, clientCount: 1 });

      await orchestrator.handleGameData(makeRawGameData());
      orchestrator.resetDetector();
      broadcasts.length = 0;

      await orchestrator.triggerManualAnalysis();

      expect(broadcasts).toHaveLength(0);
    });
  });

  describe("resetDetector", () => {
    it("causes GAME_STARTED to fire again on next handleGameData", async () => {
      const { orchestrator, broadcasts } = setup();

      await orchestrator.handleGameData(makeRawGameData());
      broadcasts.length = 0;

      orchestrator.resetDetector();
      await orchestrator.handleGameData(makeRawGameData());

      const events = broadcasts.map((b) => b.event);
      expect(events).toContain("GAME_STARTED");
    });
  });

  describe("setSummonerName", () => {
    it("updates the summoner used for parsing game data", async () => {
      const player1 = makePlayer({ summonerName: "Player1", team: "ORDER" });
      const player2 = makePlayer({ summonerName: "Player2", team: "ORDER", championName: "Garen" });
      const enemy = makePlayer({ summonerName: "Enemy1", team: "CHAOS" });
      const { orchestrator, broadcasts } = setup();

      // Before setSummonerName — default "TestPlayer" not found, falls back to first
      await orchestrator.handleGameData(makeRawGameData([player1, player2, enemy]));
      const rec1 = broadcasts.find((b) => b.event === "RECOMMENDATION");
      expect(rec1?.gameState?.localPlayer.summonerName).toBe("Player1");

      broadcasts.length = 0;
      orchestrator.setSummonerName("Player2");

      await orchestrator.handleGameData(makeRawGameData([player1, player2, enemy]));
      const rec2 = broadcasts.find((b) => b.event === "RECOMMENDATION");
      expect(rec2?.gameState?.localPlayer.summonerName).toBe("Player2");
      expect(rec2?.gameState?.localPlayer.championName).toBe("Garen");
    });

    it("resets the detector so GAME_STARTED fires again", async () => {
      const { orchestrator, broadcasts } = setup();

      await orchestrator.handleGameData(makeRawGameData());
      broadcasts.length = 0;

      orchestrator.setSummonerName("NewPlayer");

      await orchestrator.handleGameData(makeRawGameData());
      const events = broadcasts.map((b) => b.event);
      expect(events).toContain("GAME_STARTED");
    });

    it("does not reset detector if name is unchanged", async () => {
      const { orchestrator, broadcasts } = setup();

      await orchestrator.handleGameData(makeRawGameData());
      broadcasts.length = 0;

      // "TestPlayer" is the default name from setup()
      orchestrator.setSummonerName("TestPlayer");

      await orchestrator.handleGameData(makeRawGameData());
      const events = broadcasts.map((b) => b.event);
      // No GAME_STARTED because detector was not reset
      expect(events).not.toContain("GAME_STARTED");
    });
  });
});
