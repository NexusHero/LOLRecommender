import "dotenv/config";
import { WebSocketServer } from "ws";
import { LiveClientPoller } from "./poller.js";
import { EventDetector } from "./eventDetector.js";
import { BridgeWsServer } from "./wsServer.js";
import { BridgeOrchestrator } from "./orchestrator.js";
import { createLlmProvider } from "./llmProvider.js";
import type { ProviderType } from "./llmProvider.js";

const LOCAL_SUMMONER = process.env.SUMMONER_NAME ?? "";
if (!LOCAL_SUMMONER) {
  console.warn("[Main] SUMMONER_NAME not set — falling back to first player.");
}

const WS_PORT = parseInt(process.env.WS_PORT ?? "8765");

// --- Wire-up: wsServer → orchestrator reference is resolved via closure ---

let orchestrator: BridgeOrchestrator;

const wsServer = new BridgeWsServer(
  new WebSocketServer({ host: "0.0.0.0", port: WS_PORT }),
  async (_ws, message) => {
    if (message.event === "SET_SUMMONER" && typeof message.summonerName === "string") {
      orchestrator.setSummonerName(message.summonerName);
    }
    if (message.event === "SET_LLM_PROVIDER") {
      const providerType = message.provider as ProviderType | undefined;
      const apiKey = message.apiKey as string | undefined;

      if (!providerType || !apiKey) {
        console.log("[Main] LLM provider disabled.");
        orchestrator.setLlmProvider(null);
        return;
      }

      try {
        const provider = await createLlmProvider(providerType, apiKey);
        orchestrator.setLlmProvider(provider);
      } catch (err) {
        console.error("[Main] Failed to create LLM provider:", err);
        orchestrator.setLlmProvider(null);
      }
    }
  },
);

orchestrator = new BridgeOrchestrator(
  wsServer,
  new EventDetector(),
  null, // LLM provider starts disabled; set via WS or env below
  {
    summonerName: LOCAL_SUMMONER,
    llmCooldownMs: 60_000,
  },
);

// Backward compatible: use ANTHROPIC_API_KEY from .env if present
if (process.env.ANTHROPIC_API_KEY) {
  createLlmProvider("claude", process.env.ANTHROPIC_API_KEY).then((provider) => {
    orchestrator.setLlmProvider(provider);
    console.log("[Main] Using Claude provider from ANTHROPIC_API_KEY env var.");
  });
}

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
