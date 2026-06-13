"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BridgeOrchestrator = void 0;
const parser_js_1 = require("./parser.js");
const heuristic_js_1 = require("./heuristic.js");
class BridgeOrchestrator {
    wsServer;
    eventDetector;
    config;
    clock;
    llmProvider;
    lastState = null;
    constructor(wsServer, eventDetector, llmProvider, config, clock = Date.now) {
        this.wsServer = wsServer;
        this.eventDetector = eventDetector;
        this.config = config;
        this.clock = clock;
        this.llmProvider = llmProvider;
    }
    async handleGameData(raw) {
        const state = (0, parser_js_1.parseGameState)(raw, this.config.summonerName);
        this.lastState = state;
        const events = this.eventDetector.detect(state);
        for (const event of events) {
            console.log(`[Event] ${event.type}`);
            const shouldRecommend = event.type === "GAME_STARTED" ||
                event.type === "ITEM_PURCHASED" ||
                event.type === "PLAYER_DIED" ||
                event.type === "HIGH_GOLD_REACHED";
            if (shouldRecommend) {
                await this.sendRecommendation(event.state, event.type);
            }
            this.wsServer.broadcast({
                event: event.type,
                timestamp: this.clock(),
                gameState: event.state,
            });
        }
    }
    async sendRecommendation(state, eventType) {
        const profile = (0, heuristic_js_1.buildCompProfile)(state.enemies);
        const heuristicRec = (0, heuristic_js_1.getHeuristicRecommendations)(profile, state.localPlayer.championName, state);
        const useLlm = this.llmProvider !== null &&
            this.wsServer.clientCount > 0 &&
            (eventType === "GAME_STARTED" || eventType === "PLAYER_DIED" || eventType === "MANUAL");
        let finalRec = heuristicRec;
        if (useLlm) {
            try {
                const llmAnalysis = await this.llmProvider.getAnalysis(state, heuristicRec);
                finalRec = {
                    ...heuristicRec,
                    reasoning: llmAnalysis.reasoning,
                    strategy: llmAnalysis.strategy,
                    source: "llm",
                };
            }
            catch (err) {
                console.error(`[Orchestrator] LLM failed for ${eventType}:`, err);
            }
        }
        this.wsServer.broadcast({
            event: "RECOMMENDATION",
            timestamp: this.clock(),
            gameState: state,
            recommendation: finalRec,
        });
        console.log(`[Rec] ${finalRec.source} (Trigger: ${eventType}): ${finalRec.items.map((i) => i.name).join(", ")}`);
    }
    async triggerManualAnalysis() {
        if (!this.lastState) {
            console.log("[Orchestrator] Manual analysis requested but no game state available.");
            return;
        }
        console.log("[Orchestrator] Manual analysis triggered.");
        await this.sendRecommendation(this.lastState, "MANUAL");
    }
    resetDetector() {
        this.lastState = null;
        this.eventDetector.reset();
    }
    setSummonerName(name) {
        if (this.config.summonerName !== name) {
            console.log(`[Orchestrator] Changing summoner name to '${name}'`);
            this.config.summonerName = name;
            this.resetDetector();
        }
    }
    setLlmProvider(provider) {
        const oldName = this.llmProvider?.name ?? "none";
        const newName = provider?.name ?? "none";
        if (oldName !== newName) {
            console.log(`[Orchestrator] LLM provider changed: ${oldName} → ${newName}`);
        }
        this.llmProvider = provider;
    }
}
exports.BridgeOrchestrator = BridgeOrchestrator;
