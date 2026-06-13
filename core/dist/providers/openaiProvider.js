"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const llmProvider_js_1 = require("../llmProvider.js");
class OpenAiProvider {
    name = "openai";
    client;
    constructor(apiKey) {
        this.client = new openai_1.default({ apiKey });
    }
    async getAnalysis(state, heuristicRec) {
        try {
            const response = await this.client.chat.completions.create({
                model: "gpt-4o-mini",
                max_tokens: 400,
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: llmProvider_js_1.SYSTEM_PROMPT },
                    { role: "user", content: (0, llmProvider_js_1.buildUserPrompt)(state, heuristicRec) },
                ],
            });
            const text = response.choices[0]?.message?.content;
            if (!text)
                return { reasoning: heuristicRec.reasoning, strategy: heuristicRec.strategy };
            console.log(`[LLM:OpenAI] Tokens: ${response.usage?.prompt_tokens ?? "?"} in, ${response.usage?.completion_tokens ?? "?"} out`);
            return (0, llmProvider_js_1.parseAnalysisResponse)(text, heuristicRec);
        }
        catch (err) {
            console.error("[LLM:OpenAI] Error:", err);
            return { reasoning: heuristicRec.reasoning, strategy: heuristicRec.strategy };
        }
    }
}
exports.OpenAiProvider = OpenAiProvider;
