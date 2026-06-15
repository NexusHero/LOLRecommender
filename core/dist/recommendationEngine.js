"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationEngine = void 0;
const cacheService_js_1 = require("./cacheService.js");
const logger_js_1 = require("./logger.js");
const ddragonService_js_1 = require("./ddragonService.js");
class RecommendationEngine {
    llmProvider = null;
    cache = new cacheService_js_1.CacheService();
    sessionInputTokens = 0;
    sessionOutputTokens = 0;
    tokenBudget = 0;
    setLlmProvider(provider) {
        const oldName = this.llmProvider?.name ?? "none";
        const newName = provider?.name ?? "none";
        if (oldName !== newName) {
            logger_js_1.Logger.info(`[Engine] LLM provider changed: ${oldName} → ${newName}`);
        }
        this.llmProvider = provider;
    }
    setTokenBudget(budget) {
        this.tokenBudget = budget;
    }
    reset() {
        this.cache.clear();
        this.sessionInputTokens = 0;
        this.sessionOutputTokens = 0;
    }
    async process(state, eventType, hasClients, callbacks) {
        const useLlm = this.llmProvider !== null &&
            hasClients &&
            (eventType === "GAME_STARTED" || eventType === "PLAYER_DIED" || eventType === "MANUAL");
        if (!useLlm)
            return;
        if (this.tokenBudget > 0 && this.sessionInputTokens >= this.tokenBudget) {
            logger_js_1.Logger.warn(`[Engine] Session token budget exhausted (${this.sessionInputTokens}/${this.tokenBudget}). Skipping LLM.`);
            callbacks.onLlmBudgetExceeded(this.sessionInputTokens, this.tokenBudget);
            return;
        }
        const cacheKey = this.cache.buildKey(state);
        const cached = this.cache.get(cacheKey);
        let llmAnalysis;
        if (cached) {
            logger_js_1.Logger.info(`[Engine] Cache HIT (${eventType})`);
            llmAnalysis = cached;
        }
        else {
            try {
                llmAnalysis = await this.llmProvider.getAnalysis(state);
                if (llmAnalysis.tokenUsage) {
                    this.sessionInputTokens += llmAnalysis.tokenUsage.input;
                    this.sessionOutputTokens += llmAnalysis.tokenUsage.output;
                }
                this.cache.set(cacheKey, llmAnalysis);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                logger_js_1.Logger.error(`[Engine] LLM failed for ${eventType}:`, msg);
                callbacks.onLlmError(msg);
                return;
            }
        }
        const ownedItemIds = new Set(state.localPlayer.items.map((i) => i.itemID));
        const seenIds = new Set();
        const rec = {
            items: (llmAnalysis.situationalItems ?? []).filter((i) => {
                if (ownedItemIds.has(i.id))
                    return false;
                if (!ddragonService_js_1.ddragon.getItemInfo(i.id)) {
                    logger_js_1.Logger.warn(`[Rec] Dropping hallucinated item id=${i.id} name="${i.name}"`);
                    return false;
                }
                if (seenIds.has(i.id))
                    return false;
                seenIds.add(i.id);
                return true;
            }),
            reasoning: llmAnalysis.reasoning,
            strategy: llmAnalysis.strategy,
            source: "llm",
            provider: this.llmProvider.name,
        };
        const tokenUsageInfo = llmAnalysis.tokenUsage
            ? {
                lastInput: llmAnalysis.tokenUsage.input,
                lastOutput: llmAnalysis.tokenUsage.output,
                sessionInput: this.sessionInputTokens,
                sessionOutput: this.sessionOutputTokens,
            }
            : undefined;
        callbacks.onLlmSuccess(rec, tokenUsageInfo);
        logger_js_1.Logger.info(`[Rec] llm (Trigger: ${eventType}): ${rec.items.map((i) => i.name).join(", ")}`);
    }
}
exports.RecommendationEngine = RecommendationEngine;
