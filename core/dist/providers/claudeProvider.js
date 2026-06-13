"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeProvider = void 0;
const sdk_1 = require("@anthropic-ai/sdk");
const llmProvider_js_1 = require("../llmProvider.js");
class ClaudeProvider {
    name = "claude";
    client;
    constructor(apiKey) {
        this.client = new sdk_1.Anthropic({ apiKey });
    }
    async getAnalysis(state, heuristicRec) {
        try {
            const response = await this.client.messages.create({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 400,
                system: [
                    {
                        type: "text",
                        text: llmProvider_js_1.SYSTEM_PROMPT,
                        cache_control: { type: "ephemeral" },
                    },
                ],
                messages: [
                    { role: "user", content: (0, llmProvider_js_1.buildUserPrompt)(state, heuristicRec) },
                ],
            });
            if (response.content.length === 0)
                return { reasoning: heuristicRec.reasoning, strategy: heuristicRec.strategy };
            const block = response.content[0];
            if (block.type !== "text")
                return { reasoning: heuristicRec.reasoning, strategy: heuristicRec.strategy };
            console.log(`[LLM:Claude] Input tokens: ${response.usage.input_tokens} (cache hit: ${response.usage.cache_read_input_tokens ?? 0}), output tokens: ${response.usage.output_tokens}`);
            return (0, llmProvider_js_1.parseAnalysisResponse)(block.text, heuristicRec);
        }
        catch (err) {
            console.error("[LLM:Claude] Error:", err);
            return { reasoning: heuristicRec.reasoning, strategy: heuristicRec.strategy };
        }
    }
}
exports.ClaudeProvider = ClaudeProvider;
