"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const ws_1 = require("ws");
const poller_js_1 = require("./poller.js");
const eventDetector_js_1 = require("./eventDetector.js");
const wsServer_js_1 = require("./wsServer.js");
const orchestrator_js_1 = require("./orchestrator.js");
const messageRouter_js_1 = require("./messageRouter.js");
const llmProvider_js_1 = require("./llmProvider.js");
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
            }
            catch (e) {
                console.log(`[Main] Parent process ${parentPid} died. Exiting bridge...`);
                process.exit(0);
            }
        }, 2000);
    }
}
// Closure trick: wsServer needs orchestrator reference before orchestrator is constructed
let orchestrator;
let messageRouter;
const wsServer = new wsServer_js_1.BridgeWsServer(new ws_1.WebSocketServer({ host: "0.0.0.0", port: WS_PORT }), (_ws, message) => messageRouter.handle(_ws, message));
orchestrator = new orchestrator_js_1.BridgeOrchestrator(wsServer, new eventDetector_js_1.EventDetector(), null, {
    summonerName: LOCAL_SUMMONER,
    llmCooldownMs: DEFAULT_LLM_COOLDOWN_MS,
});
messageRouter = new messageRouter_js_1.MessageRouter(orchestrator);
// Backward compatible: use ANTHROPIC_API_KEY from .env if present
if (process.env.ANTHROPIC_API_KEY) {
    (0, llmProvider_js_1.createLlmProvider)("claude", process.env.ANTHROPIC_API_KEY).then((provider) => {
        orchestrator.setLlmProvider(provider);
        console.log("[Main] Using Claude provider from ANTHROPIC_API_KEY env var.");
    });
}
const poller = new poller_js_1.LiveClientPoller((data) => orchestrator.handleGameData(data), (active) => {
    if (!active) {
        orchestrator.resetDetector();
        wsServer.broadcast({
            event: "GAME_INACTIVE",
            timestamp: Date.now(),
        });
    }
});
poller.start();
process.on("SIGINT", () => {
    console.log("\n[Main] Shutting down bridge...");
    poller.stop();
    wsServer.close();
    process.exit(0);
});
