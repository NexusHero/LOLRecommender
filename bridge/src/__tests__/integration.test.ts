import { BridgeOrchestrator } from "../orchestrator.js";
import { EventDetector } from "../eventDetector.js";
import type { BridgeWsServer } from "../wsServer.js";
import { makeRawGameData, makePlayer, makeActivePlayer } from "./fixtures.js";
import type { LlmProvider } from "../llmProvider.js";
import type { WsMessage } from "../types.js";

describe("Integration Tests: Match Progressions", () => {
  function setup() {
    let currentTime = 1000;
    const clock = () => currentTime;
    const advanceTime = (ms: number) => { currentTime += ms; };

    const broadcasts: WsMessage[] = [];
    const wsServer = {
      broadcast: jest.fn((msg: WsMessage) => broadcasts.push(msg)),
      clientCount: 1,
      close: jest.fn(),
    } as unknown as BridgeWsServer;

    const llmProvider = {
      name: "mock-llm",
      getExplanation: jest.fn().mockResolvedValue("Mock Integration Reason"),
    } as unknown as LlmProvider;

    const orchestrator = new BridgeOrchestrator(
      wsServer,
      new EventDetector(),
      llmProvider,
      {
        summonerName: "TestPlayer",
        llmCooldownMs: 7 * 60 * 1000, // 7 minutes
      },
      clock,
    );

    return { orchestrator, wsServer, llmProvider, broadcasts, advanceTime };
  }

  const makeEnemy = (championName: string, kills: number, deaths: number, level: number) => {
    return makePlayer({
      team: "CHAOS",
      summonerName: championName + "Player",
      championName,
      level,
      scores: { kills, deaths, assists: 0, creepScore: level * 10, wardScore: 0 }
    });
  };

  const getLatestLlmCallArg = (llmProvider: any): any => {
    const calls = llmProvider.getExplanation.mock.calls;
    if (calls.length === 0) return null;
    return calls[calls.length - 1][0]; // returns the 'state' argument
  };

  it("Case 1: Verliert hoch (Losing hard)", async () => {
    const { orchestrator, advanceTime, llmProvider } = setup();

    // Early Game: GAME_STARTED
    await orchestrator.handleGameData(makeRawGameData([
      makePlayer({ championName: "Lux", level: 5, scores: { kills: 0, deaths: 3, assists: 0, creepScore: 20, wardScore: 0 } }),
      makeEnemy("Zed", 3, 0, 6)
    ]));
    expect(llmProvider.getExplanation).toHaveBeenCalledTimes(1);

    advanceTime(10 * 60 * 1000); // 10 minutes pass

    // Mid Game: PLAYER_DIED (Gold > 1000 triggers LLM)
    const rawMid = makeRawGameData([
      makePlayer({ championName: "Lux", level: 9, isDead: true, scores: { kills: 0, deaths: 8, assists: 1, creepScore: 60, wardScore: 0 } }),
      makeEnemy("Zed", 10, 0, 12)
    ]);
    rawMid.activePlayer = makeActivePlayer({ currentGold: 1200 }); // enough gold
    await orchestrator.handleGameData(rawMid);

    expect(llmProvider.getExplanation).toHaveBeenCalledTimes(2);
    const midState = getLatestLlmCallArg(llmProvider);
    expect(midState.localPlayer.scores.deaths).toBe(8);
  });

  it("Case 2: Gewinnt hoch (Winning hard)", async () => {
    const { orchestrator, advanceTime, llmProvider } = setup();

    // Early Game
    await orchestrator.handleGameData(makeRawGameData([
      makePlayer({ championName: "Draven", level: 5, scores: { kills: 4, deaths: 0, assists: 0, creepScore: 40, wardScore: 0 } }),
      makeEnemy("Vayne", 0, 4, 4)
    ]));

    advanceTime(10 * 60 * 1000);

    // Mid Game
    const rawMid = makeRawGameData([
      makePlayer({ championName: "Draven", level: 11, isDead: true, scores: { kills: 12, deaths: 0, assists: 2, creepScore: 120, wardScore: 0 } }),
      makeEnemy("Vayne", 0, 8, 8)
    ]);
    rawMid.activePlayer = makeActivePlayer({ currentGold: 3000 });
    await orchestrator.handleGameData(rawMid);

    expect(llmProvider.getExplanation).toHaveBeenCalledTimes(2);
    const midState = getLatestLlmCallArg(llmProvider);
    expect(midState.localPlayer.scores.kills).toBe(12);
  });

  it("Case 3: Gewinnt early, verliert mid, gewinnt late", async () => {
    const { orchestrator, advanceTime, llmProvider } = setup();

    // Early: Gewinnt
    await orchestrator.handleGameData(makeRawGameData([
      makePlayer({ championName: "Ahri", level: 6, scores: { kills: 2, deaths: 0, assists: 0, creepScore: 50, wardScore: 0 } }),
      makeEnemy("Yasuo", 0, 2, 5)
    ]));

    advanceTime(15 * 60 * 1000);

    // Mid: Verliert
    const rawMid = makeRawGameData([
      makePlayer({ championName: "Ahri", level: 12, isDead: true, scores: { kills: 2, deaths: 5, assists: 1, creepScore: 100, wardScore: 0 } }),
      makeEnemy("Yasuo", 6, 2, 13)
    ]);
    rawMid.activePlayer = makeActivePlayer({ currentGold: 1100 });
    await orchestrator.handleGameData(rawMid);
    expect(getLatestLlmCallArg(llmProvider).localPlayer.scores.deaths).toBe(5);

    advanceTime(20 * 60 * 1000);
    // Flush detector death state
    orchestrator.resetDetector();

    // Late: Gewinnt
    const rawLate = makeRawGameData([
      makePlayer({ championName: "Ahri", level: 18, isDead: true, scores: { kills: 10, deaths: 5, assists: 8, creepScore: 250, wardScore: 0 } }),
      makeEnemy("Yasuo", 7, 7, 17)
    ]);
    rawLate.activePlayer = makeActivePlayer({ currentGold: 2500 });
    await orchestrator.handleGameData(rawLate);
    expect(getLatestLlmCallArg(llmProvider).localPlayer.scores.kills).toBe(10);
  });

  it("Case 4: Verliert early, verliert mid, gewinnt late", async () => {
    const { orchestrator, advanceTime, llmProvider } = setup();

    // Early: Verliert
    await orchestrator.handleGameData(makeRawGameData([
      makePlayer({ championName: "Kayle", level: 4, scores: { kills: 0, deaths: 2, assists: 0, creepScore: 20, wardScore: 0 } }),
      makeEnemy("Renekton", 2, 0, 5)
    ]));

    advanceTime(15 * 60 * 1000);

    // Mid: Verliert
    const rawMid = makeRawGameData([
      makePlayer({ championName: "Kayle", level: 10, isDead: true, scores: { kills: 0, deaths: 6, assists: 0, creepScore: 80, wardScore: 0 } }),
      makeEnemy("Renekton", 7, 0, 12)
    ]);
    rawMid.activePlayer = makeActivePlayer({ currentGold: 1200 });
    await orchestrator.handleGameData(rawMid);
    expect(getLatestLlmCallArg(llmProvider).localPlayer.scores.deaths).toBe(6);

    advanceTime(20 * 60 * 1000);
    orchestrator.resetDetector();

    // Late: Gewinnt (Scaling Kayle)
    const rawLate = makeRawGameData([
      makePlayer({ championName: "Kayle", level: 16, isDead: true, scores: { kills: 8, deaths: 6, assists: 4, creepScore: 300, wardScore: 0 } }),
      makeEnemy("Renekton", 8, 5, 15)
    ]);
    rawLate.activePlayer = makeActivePlayer({ currentGold: 3000 });
    await orchestrator.handleGameData(rawLate);
    expect(getLatestLlmCallArg(llmProvider).localPlayer.scores.kills).toBe(8);
  });

  it("Case 5: Gewinnt, gewinnt, gewinnt", async () => {
    const { orchestrator, advanceTime, llmProvider } = setup();

    // Early
    await orchestrator.handleGameData(makeRawGameData([
      makePlayer({ championName: "Lee Sin", level: 5, scores: { kills: 3, deaths: 0, assists: 0, creepScore: 40, wardScore: 0 } }),
      makeEnemy("Amumu", 0, 2, 4)
    ]));

    advanceTime(15 * 60 * 1000);

    // Mid
    const rawMid = makeRawGameData([
      makePlayer({ championName: "Lee Sin", level: 13, isDead: true, scores: { kills: 9, deaths: 1, assists: 5, creepScore: 120, wardScore: 0 } }),
      makeEnemy("Amumu", 0, 5, 10)
    ]);
    rawMid.activePlayer = makeActivePlayer({ currentGold: 1500 });
    await orchestrator.handleGameData(rawMid);

    advanceTime(15 * 60 * 1000);
    orchestrator.resetDetector();

    // Late
    const rawLate = makeRawGameData([
      makePlayer({ championName: "Lee Sin", level: 18, isDead: true, scores: { kills: 15, deaths: 2, assists: 10, creepScore: 200, wardScore: 0 } }),
      makeEnemy("Amumu", 1, 9, 15)
    ]);
    rawLate.activePlayer = makeActivePlayer({ currentGold: 2000 });
    await orchestrator.handleGameData(rawLate);
    expect(getLatestLlmCallArg(llmProvider).localPlayer.scores.kills).toBe(15);
  });

  it("Case 6: Mehrere aufeinanderfolgende Tode — jeder Tod triggert LLM ohne Cooldown", async () => {
    const { orchestrator, llmProvider } = setup();

    // GAME_STARTED → LLM call #1
    await orchestrator.handleGameData(makeRawGameData([
      makePlayer({ championName: "Yasuo", isDead: false }),
    ]));
    expect(llmProvider.getExplanation).toHaveBeenCalledTimes(1);

    // Erster Tod → LLM call #2 (kein Cooldown nötig)
    await orchestrator.handleGameData(makeRawGameData([
      makePlayer({ championName: "Yasuo", isDead: true }),
    ]));
    expect(llmProvider.getExplanation).toHaveBeenCalledTimes(2);

    // Respawn — kein Event, kein LLM-Aufruf
    await orchestrator.handleGameData(makeRawGameData([
      makePlayer({ championName: "Yasuo", isDead: false }),
    ]));
    expect(llmProvider.getExplanation).toHaveBeenCalledTimes(2);

    // Zweiter Tod direkt danach → LLM call #3
    await orchestrator.handleGameData(makeRawGameData([
      makePlayer({ championName: "Yasuo", isDead: true }),
    ]));
    expect(llmProvider.getExplanation).toHaveBeenCalledTimes(3);

    // Dritter Tod nach weiterem Respawn → LLM call #4
    await orchestrator.handleGameData(makeRawGameData([
      makePlayer({ championName: "Yasuo", isDead: false }),
    ]));
    await orchestrator.handleGameData(makeRawGameData([
      makePlayer({ championName: "Yasuo", isDead: true }),
    ]));
    expect(llmProvider.getExplanation).toHaveBeenCalledTimes(4);
  });

  it("Case 7: Manuelle Analyse im laufenden Spiel sendet Empfehlung mit aktuellem Spielzustand", async () => {
    const { orchestrator, broadcasts, llmProvider } = setup();

    // Spielstart
    await orchestrator.handleGameData(makeRawGameData([
      makePlayer({ championName: "Jinx", level: 10, scores: { kills: 5, deaths: 1, assists: 3, creepScore: 150, wardScore: 0 } }),
      makeEnemy("Malphite", 1, 3, 10),
    ]));
    expect(llmProvider.getExplanation).toHaveBeenCalledTimes(1);
    (llmProvider.getExplanation as jest.Mock).mockClear();
    broadcasts.length = 0;

    // Manuelle Analyse
    await orchestrator.triggerManualAnalysis();

    expect(llmProvider.getExplanation).toHaveBeenCalledTimes(1);
    const rec = broadcasts.find((b) => b.event === "RECOMMENDATION");
    expect(rec).toBeDefined();
    expect(rec?.recommendation?.source).toBe("llm");
    expect(rec?.gameState?.localPlayer.championName).toBe("Jinx");
  });

  it("Case 8: Manuelle Analyse vor Spielstart sendet nichts", async () => {
    const { orchestrator, broadcasts, llmProvider } = setup();

    await orchestrator.triggerManualAnalysis();

    expect(llmProvider.getExplanation).not.toHaveBeenCalled();
    expect(broadcasts).toHaveLength(0);
  });
});
