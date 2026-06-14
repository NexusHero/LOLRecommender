"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRouter = void 0;
const logger_js_1 = require("./logger.js");
const llmProvider_js_1 = require("./llmProvider.js");
class MessageRouter {
    orchestrator;
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
    }
    async handle(ws, message) {
        if (message.event === "SET_SUMMONER" && typeof message.summonerName === "string") {
            this.orchestrator.setSummonerName(message.summonerName);
        }
        if (message.event === "TRIGGER_ANALYSIS") {
            await this.orchestrator.triggerManualAnalysis();
        }
        if (message.event === "SET_LLM_PROVIDER") {
            await this.handleSetLlmProvider(message);
        }
        if (message.event === "GET_MODELS") {
            await this.handleGetModels(ws, message);
        }
        if (message.event === "VALIDATE_KEY") {
            await this.handleValidateKey(ws, message);
        }
    }
    async handleGetModels(ws, message) {
        const providerType = message.provider;
        const apiKey = message.apiKey;
        if (!providerType || !apiKey) {
            ws.send(JSON.stringify({ event: "MODELS_ERROR", error: "Provider and API key are required" }));
            return;
        }
        try {
            const provider = await (0, llmProvider_js_1.createLlmProvider)(providerType, apiKey);
            const models = await provider.listModels();
            ws.send(JSON.stringify({ event: "MODELS_AVAILABLE", provider: providerType, models }));
        }
        catch (err) {
            ws.send(JSON.stringify({ event: "MODELS_ERROR", error: err instanceof Error ? err.message : String(err) }));
        }
    }
    async handleValidateKey(ws, message) {
        const providerType = message.provider;
        const apiKey = message.apiKey;
        if (!providerType || !apiKey) {
            ws.send(JSON.stringify({ event: "KEY_INVALID", error: "Provider and API key are required" }));
            return;
        }
        try {
            const provider = await (0, llmProvider_js_1.createLlmProvider)(providerType, apiKey);
            await provider.listModels();
            ws.send(JSON.stringify({ event: "KEY_VALID", provider: providerType }));
        }
        catch (err) {
            ws.send(JSON.stringify({ event: "KEY_INVALID", provider: providerType, error: err instanceof Error ? err.message : String(err) }));
        }
    }
    async handleSetLlmProvider(message) {
        const providerType = message.provider;
        const apiKey = message.apiKey;
        const model = message.model;
        const tokenBudget = typeof message.tokenBudget === "number" ? message.tokenBudget : 0;
        this.orchestrator.setTokenBudget(tokenBudget);
        if (!providerType || !apiKey) {
            logger_js_1.Logger.info("[MessageRouter] LLM provider disabled.");
            this.orchestrator.setLlmProvider(null);
            return;
        }
        try {
            const provider = await (0, llmProvider_js_1.createLlmProvider)(providerType, apiKey, model);
            this.orchestrator.setLlmProvider(provider);
        }
        catch (err) {
            logger_js_1.Logger.error("[MessageRouter] Failed to create LLM provider:", err);
            this.orchestrator.setLlmProvider(null);
        }
    }
}
exports.MessageRouter = MessageRouter;
