import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { WebSocketServer } from "ws";
import { LiveClientPoller } from "./poller.js";
import { parseGameState } from "./parser.js";
import { EventDetector } from "./eventDetector.js";
import { buildCompProfile, getHeuristicRecommendations } from "./heuristic.js";
import { LlmExplainer } from "./llmExplainer.js";
import { BridgeWsServer } from "./wsServer.js";
import type { AllGameData, ParsedGameState } from "./types.js";

const LOCAL_SUMMONER = process.env.SUMMONER_NAME ?? "";
if (!LOCAL_SUMMONER) {
  console.warn("[Main] SUMMONER_NAME not set — falling back to first player.");
}

const WS_PORT = parseInt(process.env.WS_PORT ?? "8765");
const wsServer = new BridgeWsServer(new WebSocketServer({ host: "0.0.0.0", port: WS_PORT }));
const eventDetector = new EventDetector();
const llmExplainer = new LlmExplainer(new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }));

// LLM-Calls begrenzen: max 1 Call alle 60 Sekunden
let lastLlmCallAt = 0;
const LLM_COOLDOWN_MS = 60_000;

async function handleGameData(raw: AllGameData) {
  const state = parseGameState(raw, LOCAL_SUMMONER);
  const events = eventDetector.detect(state);

  for (const event of events) {
    console.log(`[Event] ${event.type}`);

    const shouldRecommend =
      event.type === "GAME_STARTED" ||
      event.type === "ITEM_PURCHASED";

    if (shouldRecommend) {
      await sendRecommendation(event.state);
    }

    wsServer.broadcast({
      event: event.type,
      timestamp: Date.now(),
      gameState: event.state,
    });
  }
}

async function sendRecommendation(state: ParsedGameState) {
  const profile = buildCompProfile(state.enemies);
  const heuristicRec = getHeuristicRecommendations(profile, state.localPlayer.championName);

  const now = Date.now();
  const useLlm =
    process.env.ANTHROPIC_API_KEY &&
    now - lastLlmCallAt > LLM_COOLDOWN_MS &&
    wsServer.clientCount > 0;

  let finalRec = heuristicRec;

  if (useLlm) {
    lastLlmCallAt = now;
    const llmReasoning = await llmExplainer.getExplanation(state, heuristicRec);
    finalRec = { ...heuristicRec, reasoning: llmReasoning, source: "llm" };
  }

  wsServer.broadcast({
    event: "RECOMMENDATION",
    timestamp: Date.now(),
    gameState: state,
    recommendation: finalRec,
  });

  console.log(`[Rec] ${finalRec.source}: ${finalRec.items.map((i) => i.name).join(", ")}`);
}

const poller = new LiveClientPoller(
  handleGameData,
  (active) => {
    if (!active) {
      eventDetector.reset();
      wsServer.broadcast({
        event: "GAME_INACTIVE",
        timestamp: Date.now(),
      });
    }
  }
);

poller.start();

process.on("SIGINT", () => {
  console.log("\n[Main] Shutting down bridge...");
  poller.stop();
  wsServer.close();
  process.exit(0);
});
