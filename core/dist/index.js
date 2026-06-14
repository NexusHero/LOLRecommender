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
const ddragonService_js_1 = require("./ddragonService.js");
const secretManager_js_1 = require("./secretManager.js");
const config_js_1 = require("./config.js");
const logger_js_1 = require("./logger.js");
// DDragon im Hintergrund initialisieren — kein blocking start
ddragonService_js_1.ddragon.init().catch((err) => logger_js_1.Logger.error("[Main] DDragon init error:", err));
const LOCAL_SUMMONER = process.env.SUMMONER_NAME ?? "";
if (!LOCAL_SUMMONER) {
    logger_js_1.Logger.warn("[Main] SUMMONER_NAME not set — falling back to first player.");
}
const WS_PORT = config_js_1.config.ws.port;
const DEFAULT_LLM_COOLDOWN_MS = config_js_1.config.llm.defaultCooldownMs;
// --- Parent Process Watchdog ---
const args = process.argv.slice(2);
const parentPidArg = args.find(a => a.startsWith('--parent-pid='));
if (parentPidArg) {
    const parentPid = parseInt(parentPidArg.split('=')[1]);
    if (!isNaN(parentPid)) {
        logger_js_1.Logger.info(`[Main] Watching parent PID: ${parentPid}`);
        setInterval(() => {
            try {
                // signal 0 = existence check only (no actual signal sent)
                // NOTE: On Windows, process.kill(pid, 0) may throw EPERM when the parent
                // has a different integrity level, even if the parent is still alive.
                process.kill(parentPid, 0);
            }
            catch (e) {
                logger_js_1.Logger.info(`[Main] Parent process ${parentPid} died. Exiting bridge...`);
                process.exit(0);
            }
        }, 2000);
    }
}
const secret = (0, secretManager_js_1.loadOrCreateSecret)();
logger_js_1.Logger.info(`[Main] Bridge secret stored at: ${(0, secretManager_js_1.secretFilePath)()}`);
// Closure trick: wsServer needs orchestrator reference before orchestrator is constructed
let orchestrator;
let messageRouter;
const wsServer = new wsServer_js_1.BridgeWsServer(new ws_1.WebSocketServer({
    host: config_js_1.config.ws.host,
    port: WS_PORT,
    verifyClient: ({ req }) => req.headers["authorization"] === `Bearer ${secret}`,
}), (_ws, message) => messageRouter.handle(_ws, message));
orchestrator = new orchestrator_js_1.BridgeOrchestrator(wsServer, new eventDetector_js_1.EventDetector(), null, {
    summonerName: LOCAL_SUMMONER,
    llmCooldownMs: DEFAULT_LLM_COOLDOWN_MS,
});
messageRouter = new messageRouter_js_1.MessageRouter(orchestrator);
// Backward compatible: use ANTHROPIC_API_KEY from .env if present
if (process.env.ANTHROPIC_API_KEY) {
    (0, llmProvider_js_1.createLlmProvider)("claude", process.env.ANTHROPIC_API_KEY).then((provider) => {
        orchestrator.setLlmProvider(provider);
        logger_js_1.Logger.info("[Main] Using Claude provider from ANTHROPIC_API_KEY env var.");
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
    logger_js_1.Logger.info("\n[Main] Shutting down bridge...");
    poller.stop();
    wsServer.close();
    process.exit(0);
});
