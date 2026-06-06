import { parseGameState } from "./parser.js";
import { EventDetector, HIGH_GOLD_THRESHOLD } from "./eventDetector.js";
import { buildCompProfile, getHeuristicRecommendations } from "./heuristic.js";
import { BridgeWsServer } from "./wsServer.js";
import type { LlmProvider } from "./llmProvider.js";
import type { AllGameData, ParsedGameState } from "./types.js";

export interface OrchestratorConfig {
  summonerName: string;
  llmCooldownMs: number;
}

export class BridgeOrchestrator {
  private lastLlmCallAt = 0;
  private llmProvider: LlmProvider | null;

  constructor(
    private readonly wsServer: BridgeWsServer,
    private readonly eventDetector: EventDetector,
    llmProvider: LlmProvider | null,
    private readonly config: OrchestratorConfig,
    private readonly clock: () => number = Date.now,
  ) {
    this.llmProvider = llmProvider;
  }

  async handleGameData(raw: AllGameData): Promise<void> {
    const state = parseGameState(raw, this.config.summonerName);
    const events = this.eventDetector.detect(state);

    for (const event of events) {
      console.log(`[Event] ${event.type}`);

      const shouldRecommend =
        event.type === "GAME_STARTED" ||
        event.type === "ITEM_PURCHASED" ||
        event.type === "PLAYER_DIED" ||
        event.type === "HIGH_GOLD_REACHED";

      if (shouldRecommend) {
        await this.sendRecommendation(event.state, event.type);
      }

      this.wsServer.broadcast({
        event: event.type,
        timestamp: this.clock(),
        gameState: event.state,
      });
    }
  }

  private async sendRecommendation(state: ParsedGameState, eventType: string): Promise<void> {
    const profile = buildCompProfile(state.enemies);
    const heuristicRec = getHeuristicRecommendations(
      profile,
      state.localPlayer.championName,
    );

    const now = this.clock();
    let useLlm = false;

    if (this.llmProvider !== null && this.wsServer.clientCount > 0) {
      if (eventType === "GAME_STARTED") {
        useLlm = true; // Always trigger LLM on game start
      } else if (eventType === "PLAYER_DIED") {
        // Trigger LLM if high gold and cooldown passed
        if (state.activePlayer.currentGold >= HIGH_GOLD_THRESHOLD && now - this.lastLlmCallAt > this.config.llmCooldownMs) {
          useLlm = true;
        }
      }
    }

    let finalRec = heuristicRec;

    if (useLlm) {
      this.lastLlmCallAt = now;
      try {
        const llmReasoning = await this.llmProvider!.getExplanation(
          state,
          heuristicRec,
        );
        finalRec = { ...heuristicRec, reasoning: llmReasoning, source: "llm" };
      } catch (err) {
        console.error(`[Orchestrator] LLM failed for ${eventType}:`, err);
      }
    }

    this.wsServer.broadcast({
      event: "RECOMMENDATION",
      timestamp: this.clock(),
      gameState: state,
      recommendation: finalRec,
    });

    console.log(
      `[Rec] ${finalRec.source} (Trigger: ${eventType}): ${finalRec.items.map((i) => i.name).join(", ")}`,
    );
  }

  resetDetector(): void {
    this.eventDetector.reset();
  }

  setSummonerName(name: string): void {
    if (this.config.summonerName !== name) {
      console.log(`[Orchestrator] Changing summoner name to '${name}'`);
      this.config.summonerName = name;
      this.resetDetector();
    }
  }

  setLlmProvider(provider: LlmProvider | null): void {
    const oldName = this.llmProvider?.name ?? "none";
    const newName = provider?.name ?? "none";
    if (oldName !== newName) {
      console.log(`[Orchestrator] LLM provider changed: ${oldName} → ${newName}`);
    }
    this.llmProvider = provider;
  }
}
