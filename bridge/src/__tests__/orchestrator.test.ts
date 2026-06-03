import { BridgeOrchestrator } from "../orchestrator";
import { EventDetector } from "../eventDetector";
import { LlmExplainer } from "../llmExplainer";
import { BridgeWsServer } from "../wsServer";
import { makeRawGameData, makePlayer, makeItem } from "./fixtures";
import type { WsMessage } from "../types";

function setup(overrides: {
  hasApiKey?: boolean;
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

  const llmExplainer = {
    getExplanation: jest.fn().mockResolvedValue(overrides.llmResult ?? "LLM says buy this"),
  } as unknown as LlmExplainer;

  const orchestrator = new BridgeOrchestrator(
    wsServer,
    new EventDetector(),
    llmExplainer,
    {
      summonerName: "TestPlayer",
      llmCooldownMs: 60_000,
      hasApiKey: overrides.hasApiKey ?? false,
      },
    overrides.clock ?? (() => 1000),
  );

  return { orchestrator, wsServer, llmExplainer, broadcasts };
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
    it("uses heuristic source when no API key", async () => {
      const { orchestrator, broadcasts } = setup({ hasApiKey: false });

      await orchestrator.handleGameData(makeRawGameData());

      const rec = broadcasts.find((b) => b.event === "RECOMMENDATION");
      expect(rec?.recommendation?.source).toBe("heuristic");
    });

    it("uses LLM source when API key is set and cooldown passed", async () => {
      const { orchestrator, broadcasts } = setup({
        hasApiKey: true,
        clientCount: 1,
        clock: () => 100_000,
      });

      await orchestrator.handleGameData(makeRawGameData());

      const rec = broadcasts.find((b) => b.event === "RECOMMENDATION");
      expect(rec?.recommendation?.source).toBe("llm");
    });

    it("uses heuristic when within LLM cooldown", async () => {
      let now = 100_000;
      const { orchestrator, broadcasts } = setup({
        hasApiKey: true,
        clientCount: 1,
        clock: () => now,
      });

      // First call — LLM fires
      await orchestrator.handleGameData(makeRawGameData());
      const rec1 = broadcasts.find((b) => b.event === "RECOMMENDATION");
      expect(rec1?.recommendation?.source).toBe("llm");

      broadcasts.length = 0;

      // Trigger ITEM_PURCHASED 10 seconds later — within cooldown
      now = 110_000;
      const enemy = makePlayer({ summonerName: "E", team: "CHAOS" });
      orchestrator.resetDetector();
      await orchestrator.handleGameData(makeRawGameData([makePlayer(), enemy]));
      // After reset, GAME_STARTED fires again
      const rec2 = broadcasts.find((b) => b.event === "RECOMMENDATION");
      expect(rec2?.recommendation?.source).toBe("heuristic");
    });

    it("skips LLM when no clients are connected", async () => {
      const { orchestrator, broadcasts, llmExplainer } = setup({
        hasApiKey: true,
        clientCount: 0,
        clock: () => 100_000,
      });

      await orchestrator.handleGameData(makeRawGameData());

      const rec = broadcasts.find((b) => b.event === "RECOMMENDATION");
      expect(rec?.recommendation?.source).toBe("heuristic");
      expect(llmExplainer.getExplanation).not.toHaveBeenCalled();
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
});
