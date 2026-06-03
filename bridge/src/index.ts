import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { WebSocketServer } from "ws";
import { LiveClientPoller } from "./poller.js";
import { EventDetector } from "./eventDetector.js";
import { LlmExplainer } from "./llmExplainer.js";
import { BridgeWsServer } from "./wsServer.js";
import { BridgeOrchestrator } from "./orchestrator.js";

const LOCAL_SUMMONER = process.env.SUMMONER_NAME ?? "";
if (!LOCAL_SUMMONER) {
  console.warn("[Main] SUMMONER_NAME not set — falling back to first player.");
}

const WS_PORT = parseInt(process.env.WS_PORT ?? "8765");
const wsServer = new BridgeWsServer(new WebSocketServer({ host: "0.0.0.0", port: WS_PORT }));

const orchestrator = new BridgeOrchestrator(
  wsServer,
  new EventDetector(),
  new LlmExplainer(new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })),
  {
    summonerName: LOCAL_SUMMONER,
    llmCooldownMs: 60_000,
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
  },
);

const poller = new LiveClientPoller(
  (data) => orchestrator.handleGameData(data),
  (active) => {
    if (!active) {
      orchestrator.resetDetector();
      wsServer.broadcast({
        event: "GAME_INACTIVE",
        timestamp: Date.now(),
      });
    }
  },
);

poller.start();

process.on("SIGINT", () => {
  console.log("\n[Main] Shutting down bridge...");
  poller.stop();
  wsServer.close();
  process.exit(0);
});
