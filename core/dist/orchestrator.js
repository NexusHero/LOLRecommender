"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BridgeOrchestrator = void 0;
const parser_js_1 = require("./parser.js");
const logger_js_1 = require("./logger.js");
const recommendationEngine_js_1 = require("./recommendationEngine.js");
class BridgeOrchestrator {
    wsServer;
    eventDetector;
    config;
    clock;
    lastState = null;
    correlationCounter = 0;
    engine = new recommendationEngine_js_1.RecommendationEngine();
    constructor(wsServer, eventDetector, llmProvider, config, clock = Date.now) {
        this.wsServer = wsServer;
        this.eventDetector = eventDetector;
        this.config = config;
        this.clock = clock;
        this.engine.setLlmProvider(llmProvider);
        if (this.config.tokenBudget) {
            this.engine.setTokenBudget(this.config.tokenBudget);
        }
    }
    async handleGameData(raw) {
        const stateResult = (0, parser_js_1.parseGameState)(raw, this.config.summonerName);
        if (!stateResult.ok) {
            logger_js_1.Logger.warn(`[Orchestrator] Failed to parse game state: ${stateResult.error.message}`);
            return;
        }
        const state = stateResult.value;
        this.lastState = state;
        const events = this.eventDetector.detect(state);
        for (const event of events) {
            logger_js_1.Logger.info(`[Event] ${event.type}`);
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
        const correlationId = `${eventType}_${++this.correlationCounter}`;
        const hasClients = this.wsServer.clientCount > 0;
        await this.engine.process(state, eventType, hasClients, {
            onLlmBudgetExceeded: (sessionTokens, budget) => {
                this.wsServer.broadcast({
                    event: "LLM_BUDGET_EXCEEDED",
                    timestamp: this.clock(),
                    sessionInputTokens: sessionTokens,
                    budget,
                });
            },
            onLlmError: (msg) => {
                this.wsServer.broadcast({ event: "LLM_ERROR", timestamp: this.clock(), error: msg });
            },
            onLlmSuccess: (rec, tokenUsage) => {
                this.wsServer.broadcast({
                    event: "RECOMMENDATION_UPDATE",
                    timestamp: this.clock(),
                    gameState: state,
                    recommendation: rec,
                    correlationId,
                    tokenUsage,
                });
            },
        });
    }
    async triggerManualAnalysis() {
        if (!this.lastState) {
            logger_js_1.Logger.info("[Orchestrator] Manual analysis requested but no game state available.");
            return;
        }
        logger_js_1.Logger.info("[Orchestrator] Manual analysis triggered.");
        await this.sendRecommendation(this.lastState, "MANUAL");
    }
    resetDetector() {
        this.lastState = null;
        this.eventDetector.reset();
        this.engine.reset();
    }
    setTokenBudget(budget) {
        this.config.tokenBudget = budget;
        this.engine.setTokenBudget(budget);
    }
    setSummonerName(name) {
        if (this.config.summonerName !== name) {
            logger_js_1.Logger.info(`[Orchestrator] Changing summoner name to '${name}'`);
            this.config.summonerName = name;
            this.resetDetector();
        }
    }
    setLlmProvider(provider) {
        this.engine.setLlmProvider(provider);
    }
}
exports.BridgeOrchestrator = BridgeOrchestrator;
