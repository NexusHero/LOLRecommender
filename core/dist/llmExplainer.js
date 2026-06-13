"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmExplainer = void 0;
/**
 * @deprecated — Use LlmProvider interface + createLlmProvider() from ./llmProvider.ts instead.
 * This file is kept for backward compatibility with existing tests.
 */
var claudeProvider_js_1 = require("./providers/claudeProvider.js");
Object.defineProperty(exports, "LlmExplainer", { enumerable: true, get: function () { return claudeProvider_js_1.ClaudeProvider; } });
