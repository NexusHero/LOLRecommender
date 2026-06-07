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
  private llmProvider: LlmProvider | null;
  private lastState: ParsedGameState | null = null;

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
    this.lastState = state;
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
      state,
    );

    const useLlm =
      this.llmProvider !== null &&
      this.wsServer.clientCount > 0 &&
      (eventType === "GAME_STARTED" || eventType === "PLAYER_DIED" || eventType === "MANUAL");

    let finalRec = heuristicRec;

    if (useLlm) {
      try {
        const llmAnalysis = await this.llmProvider!.getAnalysis(
          state,
          heuristicRec,
        );
        finalRec = {
          ...heuristicRec,
          reasoning: llmAnalysis.reasoning,
          strategy: llmAnalysis.strategy,
          source: "llm",
          provider: this.llmProvider!.name,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[Orchestrator] LLM failed for ${eventType}:`, msg);
        this.wsServer.broadcast({
          event: "LLM_ERROR",
          timestamp: this.clock(),
          error: msg,
        });
        // finalRec stays as heuristicRec — source remains "heuristic"
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

  async triggerManualAnalysis(): Promise<void> {
    if (!this.lastState) {
      console.log("[Orchestrator] Manual analysis requested but no game state available.");
      return;
    }
    console.log("[Orchestrator] Manual analysis triggered.");
    await this.sendRecommendation(this.lastState, "MANUAL");
  }

  resetDetector(): void {
    this.lastState = null;
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
