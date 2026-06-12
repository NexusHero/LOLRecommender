import type { WebSocket } from "ws";
import type { BridgeOrchestrator } from "./orchestrator.js";

import { createLlmProvider, friendlyApiError } from "./llmProvider.js";
import type { ProviderType } from "./llmProvider.js";

export class MessageRouter {
  constructor(private readonly orchestrator: BridgeOrchestrator) {}

  async handle(ws: WebSocket, message: Record<string, unknown>): Promise<void> {
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

  private async handleGetModels(ws: WebSocket, message: Record<string, unknown>): Promise<void> {
    const providerType = message.provider as ProviderType | undefined;
    const apiKey = message.apiKey as string | undefined;

    if (!providerType || !apiKey) {
      ws.send(JSON.stringify({ event: "MODELS_ERROR", error: "Provider and API key are required" }));
      return;
    }

    try {
      const provider = await createLlmProvider(providerType, apiKey);
      const models = await provider.listModels();
      ws.send(JSON.stringify({ event: "MODELS_AVAILABLE", provider: providerType, models }));
    } catch (err) {
      ws.send(JSON.stringify({ event: "MODELS_ERROR", error: friendlyApiError(err) }));
    }
  }

  private async handleValidateKey(ws: WebSocket, message: Record<string, unknown>): Promise<void> {
    const providerType = message.provider as ProviderType | undefined;
    const apiKey = message.apiKey as string | undefined;

    if (!providerType || !apiKey) {
      ws.send(JSON.stringify({ event: "KEY_INVALID", error: "Provider and API key are required" }));
      return;
    }

    try {
      const provider = await createLlmProvider(providerType, apiKey);
      await provider.listModels();
      ws.send(JSON.stringify({ event: "KEY_VALID", provider: providerType }));
    } catch (err) {
      ws.send(JSON.stringify({ event: "KEY_INVALID", provider: providerType, error: friendlyApiError(err) }));
    }
  }

  private async handleSetLlmProvider(message: Record<string, unknown>): Promise<void> {
    const providerType = message.provider as ProviderType | undefined;
    const apiKey = message.apiKey as string | undefined;
    const model = message.model as string | undefined;
    const tokenBudget = typeof message.tokenBudget === "number" ? message.tokenBudget : 0;

    this.orchestrator.setTokenBudget(tokenBudget);

    if (!providerType || !apiKey) {
      console.log("[MessageRouter] LLM provider disabled.");
      this.orchestrator.setLlmProvider(null);
      return;
    }

    try {
      const provider = await createLlmProvider(providerType, apiKey, model);
      this.orchestrator.setLlmProvider(provider);
    } catch (err) {
      console.error("[MessageRouter] Failed to create LLM provider:", err);
      this.orchestrator.setLlmProvider(null);
    }
  }
}
