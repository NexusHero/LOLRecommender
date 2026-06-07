import "dotenv/config";
import { WebSocketServer } from "ws";
import { LiveClientPoller } from "./poller.js";
import { EventDetector } from "./eventDetector.js";
import { BridgeWsServer } from "./wsServer.js";
import { BridgeOrchestrator } from "./orchestrator.js";
import { MessageRouter } from "./messageRouter.js";
import { createLlmProvider } from "./llmProvider.js";
import { ddragon } from "./ddragonService.js";

// DDragon im Hintergrund initialisieren — kein blocking start
ddragon.init().catch((err) => console.error("[Main] DDragon init error:", err));

const LOCAL_SUMMONER = process.env.SUMMONER_NAME ?? "";
if (!LOCAL_SUMMONER) {
  console.warn("[Main] SUMMONER_NAME not set — falling back to first player.");
}

const WS_PORT = parseInt(process.env.WS_PORT ?? "8765");
const DEFAULT_LLM_COOLDOWN_MS = 7 * 60 * 1000;

// --- Parent Process Watchdog ---
const args = process.argv.slice(2);
const parentPidArg = args.find(a => a.startsWith('--parent-pid='));
if (parentPidArg) {
  const parentPid = parseInt(parentPidArg.split('=')[1]);
  if (!isNaN(parentPid)) {
    console.log(`[Main] Watching parent PID: ${parentPid}`);
    setInterval(() => {
      try {
        // signal 0 = existence check only (no actual signal sent)
        // NOTE: On Windows, process.kill(pid, 0) may throw EPERM when the parent
        // has a different integrity level, even if the parent is still alive.
        process.kill(parentPid, 0);
      } catch (e) {
        console.log(`[Main] Parent process ${parentPid} died. Exiting bridge...`);
        process.exit(0);
      }
    }, 2000);
  }
}

// Closure trick: wsServer needs orchestrator reference before orchestrator is constructed
let orchestrator: BridgeOrchestrator;
let messageRouter: MessageRouter;

const wsServer = new BridgeWsServer(
  new WebSocketServer({ host: "0.0.0.0", port: WS_PORT }),
  (_ws, message) => messageRouter.handle(_ws, message),
);

orchestrator = new BridgeOrchestrator(
  wsServer,
  new EventDetector(),
  null,
  {
    summonerName: LOCAL_SUMMONER,
    llmCooldownMs: DEFAULT_LLM_COOLDOWN_MS,
  },
);

messageRouter = new MessageRouter(orchestrator);

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
