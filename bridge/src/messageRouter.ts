import type { WebSocket } from "ws";
import type { BridgeOrchestrator } from "./orchestrator.js";
import { createLlmProvider } from "./llmProvider.js";
import type { ProviderType } from "./llmProvider.js";

export class MessageRouter {
  constructor(private readonly orchestrator: BridgeOrchestrator) {}

  async handle(_ws: WebSocket, message: Record<string, unknown>): Promise<void> {
    if (message.event === "SET_SUMMONER" && typeof message.summonerName === "string") {
      this.orchestrator.setSummonerName(message.summonerName);
    }

    if (message.event === "TRIGGER_ANALYSIS") {
      await this.orchestrator.triggerManualAnalysis();
    }

    if (message.event === "SET_LLM_PROVIDER") {
      await this.handleSetLlmProvider(message);
    }
  }

  private async handleSetLlmProvider(message: Record<string, unknown>): Promise<void> {
    const providerType = message.provider as ProviderType | undefined;
    const apiKey = message.apiKey as string | undefined;

    if (!providerType || !apiKey) {
      console.log("[MessageRouter] LLM provider disabled.");
      this.orchestrator.setLlmProvider(null);
      return;
    }

    try {
      const provider = await createLlmProvider(providerType, apiKey);
      this.orchestrator.setLlmProvider(provider);
    } catch (err) {
      console.error("[MessageRouter] Failed to create LLM provider:", err);
      this.orchestrator.setLlmProvider(null);
    }
  }
}
