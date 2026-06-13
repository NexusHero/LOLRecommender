"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const generative_ai_1 = require("@google/generative-ai");
const llmProvider_js_1 = require("../llmProvider.js");
class GeminiProvider {
    name = "gemini";
    client;
    constructor(apiKey) {
        this.client = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    async getAnalysis(state, heuristicRec) {
        try {
            const model = this.client.getGenerativeModel({
                model: "gemini-2.0-flash",
                systemInstruction: llmProvider_js_1.SYSTEM_PROMPT,
            });
            const result = await model.generateContent({
                contents: [
                    { role: "user", parts: [{ text: (0, llmProvider_js_1.buildUserPrompt)(state, heuristicRec) }] },
                ],
                generationConfig: {
                    maxOutputTokens: 400,
                    responseMimeType: "application/json",
                },
            });
            const text = result.response.text();
            if (!text)
                return { reasoning: heuristicRec.reasoning, strategy: heuristicRec.strategy };
            console.log(`[LLM:Gemini] Response received (${text.length} chars)`);
            return (0, llmProvider_js_1.parseAnalysisResponse)(text, heuristicRec);
        }
        catch (err) {
            console.error("[LLM:Gemini] Error:", err);
            return { reasoning: heuristicRec.reasoning, strategy: heuristicRec.strategy };
        }
    }
}
exports.GeminiProvider = GeminiProvider;
