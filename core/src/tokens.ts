import type { InjectionToken } from "tsyringe";
import type { WebSocketServer } from "ws";
import type { LlmProvider } from "./llmProvider.js";
import type { OrchestratorConfig } from "./orchestrator.js";
import type { IEventDetector, IRecommendationEngine, IWsBroadcaster } from "./interfaces.js";

/**
 * tsyringe cannot resolve constructor params by reflected type when the type
 * is an interface, union, primitive, or external (non-decorated) class —
 * those need an explicit injection token registered with a value/factory.
 */
export const WSS_TOKEN: InjectionToken<WebSocketServer> = "WebSocketServer";
export const ORCHESTRATOR_CONFIG_TOKEN: InjectionToken<OrchestratorConfig> = "OrchestratorConfig";
export const LLM_PROVIDER_TOKEN: InjectionToken<LlmProvider | null> = "LlmProvider";
export const CLOCK_TOKEN: InjectionToken<() => number> = "Clock";

/**
 * Interface tokens for BridgeOrchestrator's collaborators (DIP). Registered
 * in the composition root as `useToken` aliases to the existing concrete
 * singletons — NOT separate registrations, which would construct a second,
 * disconnected instance of each (see index.ts comment).
 */
export const WS_BROADCASTER_TOKEN: InjectionToken<IWsBroadcaster> = "IWsBroadcaster";
export const EVENT_DETECTOR_TOKEN: InjectionToken<IEventDetector> = "IEventDetector";
export const RECOMMENDATION_ENGINE_TOKEN: InjectionToken<IRecommendationEngine> = "IRecommendationEngine";
