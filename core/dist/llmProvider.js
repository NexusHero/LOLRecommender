"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_PROMPT = void 0;
exports.buildUserPrompt = buildUserPrompt;
exports.parseAnalysisResponse = parseAnalysisResponse;
exports.createLlmProvider = createLlmProvider;
const stateMinifier_js_1 = require("./stateMinifier.js");
const stateMinifier_js_2 = require("./stateMinifier.js");
const claudeProvider_js_1 = require("./providers/claudeProvider.js");
const openaiProvider_js_1 = require("./providers/openaiProvider.js");
const geminiProvider_js_1 = require("./providers/geminiProvider.js");
exports.SYSTEM_PROMPT = `You are an experienced League of Legends coach.
Analyze the game state and respond ONLY with a JSON object — no markdown, no code blocks, no extra text.
Use this exact format:
{
  "itemReasoning": "2-3 sentences explaining why the suggested items are a good choice right now",
  "strategy": {
    "winCondition": "early" or "mid" or "late",
    "summary": "1 sentence: when and how the player wins this game",
    "immediateAction": "1 sentence: what to do RIGHT NOW in-game",
    "lateGamePlan": "1 sentence: how to close out the game with the final build"
  }
}
Be specific. Consider KDA, gold, champion matchups, and the current game phase.`;
function buildUserPrompt(state, heuristicRec) {
    const itemNames = heuristicRec.items.map((i) => i.name).join(", ") || "None";
    const phase = (0, stateMinifier_js_2.getGamePhase)(state.gameTime);
    return `Current Game State:
${(0, stateMinifier_js_1.minifyGameState)(state)}
Game Phase: ${phase} (< 14min = early, 14-25min = mid, > 25min = late)

Suggested items: ${itemNames}

Respond with the JSON object as instructed.`;
}
function parseAnalysisResponse(raw, fallback) {
    try {
        const clean = raw.replace(/```(?:json)?\n?/g, "").trim();
        const parsed = JSON.parse(clean);
        const strat = parsed.strategy;
        return {
            reasoning: parsed.itemReasoning ?? fallback.reasoning,
            strategy: {
                winCondition: strat?.winCondition ?? fallback.strategy.winCondition,
                summary: strat?.summary ?? fallback.strategy.summary,
                immediateAction: strat?.immediateAction ?? fallback.strategy.immediateAction,
                lateGamePlan: strat?.lateGamePlan ?? fallback.strategy.lateGamePlan,
            },
        };
    }
    catch {
        return { reasoning: fallback.reasoning, strategy: fallback.strategy };
    }
}
/**
 * Factory function — creates the correct LlmProvider from a type string + API key.
 * Imports are now static so Webpack and pkg bundle them correctly for the .exe.
 */
async function createLlmProvider(type, apiKey) {
    switch (type) {
        case "claude":
            return new claudeProvider_js_1.ClaudeProvider(apiKey);
        case "openai":
            return new openaiProvider_js_1.OpenAiProvider(apiKey);
        case "gemini":
            return new geminiProvider_js_1.GeminiProvider(apiKey);
        default:
            throw new Error(`Unknown LLM provider: ${type}`);
    }
}
