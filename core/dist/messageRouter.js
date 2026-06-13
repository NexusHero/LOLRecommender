"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRouter = void 0;
const llmProvider_js_1 = require("./llmProvider.js");
class MessageRouter {
    orchestrator;
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
    }
    async handle(_ws, message) {
        if (message.event === "SET_SUMMONER" && typeof message.summonerName === "string") {
            this.orchestrator.setSummonerName(message.summonerName);
        }
        if (message.event === "TRIGGER_ANALYSIS") {
            await this.orchestrator.triggerManualAnalysis();
        }
        if (message.event === "SET_LLM_PROVIDER") {
            await this.handleSetLlmProvider(message);
        }
    }
    async handleSetLlmProvider(message) {
        const providerType = message.provider;
        const apiKey = message.apiKey;
        if (!providerType || !apiKey) {
            console.log("[MessageRouter] LLM provider disabled.");
            this.orchestrator.setLlmProvider(null);
            return;
        }
        try {
            const provider = await (0, llmProvider_js_1.createLlmProvider)(providerType, apiKey);
            this.orchestrator.setLlmProvider(provider);
        }
        catch (err) {
            console.error("[MessageRouter] Failed to create LLM provider:", err);
            this.orchestrator.setLlmProvider(null);
        }
    }
}
exports.MessageRouter = MessageRouter;
