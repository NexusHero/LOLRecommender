import { parseGameState } from "./parser.js";
import { EventDetector } from "./eventDetector.js";
import { buildCompProfile, getHeuristicRecommendations } from "./heuristic.js";
import { LlmExplainer } from "./llmExplainer.js";
import { BridgeWsServer } from "./wsServer.js";
import type { AllGameData, ParsedGameState } from "./types.js";

export interface OrchestratorConfig {
  summonerName: string;
  llmCooldownMs: number;
  hasApiKey: boolean;
}

export class BridgeOrchestrator {
  private lastLlmCallAt = 0;

  constructor(
    private readonly wsServer: BridgeWsServer,
    private readonly eventDetector: EventDetector,
    private readonly llmExplainer: LlmExplainer,
    private readonly config: OrchestratorConfig,
    private readonly clock: () => number = Date.now,
  ) {}

  async handleGameData(raw: AllGameData): Promise<void> {
    const state = parseGameState(raw, this.config.summonerName);
    const events = this.eventDetector.detect(state);

    for (const event of events) {
      console.log(`[Event] ${event.type}`);

      const shouldRecommend =
        event.type === "GAME_STARTED" ||
        event.type === "ITEM_PURCHASED";

      if (shouldRecommend) {
        await this.sendRecommendation(event.state);
      }

      this.wsServer.broadcast({
        event: event.type,
        timestamp: this.clock(),
        gameState: event.state,
      });
    }
  }

  private async sendRecommendation(state: ParsedGameState): Promise<void> {
    const profile = buildCompProfile(state.enemies);
    const heuristicRec = getHeuristicRecommendations(
      profile,
      state.localPlayer.championName,
    );

    const now = this.clock();
    const useLlm =
      this.config.hasApiKey &&
      now - this.lastLlmCallAt > this.config.llmCooldownMs &&
      this.wsServer.clientCount > 0;

    let finalRec = heuristicRec;

    if (useLlm) {
      this.lastLlmCallAt = now;
      const llmReasoning = await this.llmExplainer.getExplanation(
        state,
        heuristicRec,
      );
      finalRec = { ...heuristicRec, reasoning: llmReasoning, source: "llm" };
    }

    this.wsServer.broadcast({
      event: "RECOMMENDATION",
      timestamp: this.clock(),
      gameState: state,
      recommendation: finalRec,
    });

    console.log(
      `[Rec] ${finalRec.source}: ${finalRec.items.map((i) => i.name).join(", ")}`,
    );
  }

  resetDetector(): void {
    this.eventDetector.reset();
  }
}
