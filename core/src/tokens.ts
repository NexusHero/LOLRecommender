import type { InjectionToken } from "tsyringe";
import type { WebSocketServer } from "ws";
import type { LlmProvider } from "./llmProvider.js";
import type { OrchestratorConfig } from "./orchestrator.js";

/**
 * tsyringe cannot resolve constructor params by reflected type when the type
 * is an interface, union, primitive, or external (non-decorated) class —
 * those need an explicit injection token registered with a value/factory.
 */
export const WSS_TOKEN: InjectionToken<WebSocketServer> = "WebSocketServer";
export const ORCHESTRATOR_CONFIG_TOKEN: InjectionToken<OrchestratorConfig> = "OrchestratorConfig";
export const LLM_PROVIDER_TOKEN: InjectionToken<LlmProvider | null> = "LlmProvider";
export const CLOCK_TOKEN: InjectionToken<() => number> = "Clock";
