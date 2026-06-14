import { parseGameState } from "./parser.js";
import { EventDetector } from "./eventDetector.js";
import { BridgeWsServer } from "./wsServer.js";
import type { LlmProvider } from "./llmProvider.js";
import type { AllGameData, ParsedGameState } from "./types.js";
import { Logger } from "./logger.js";
import { RecommendationEngine } from "./recommendationEngine.js";

export interface OrchestratorConfig {
  summonerName: string;
  llmCooldownMs: number;
  tokenBudget?: number; // session input token budget; 0 or undefined = unlimited
}

export class BridgeOrchestrator {
  private lastState: ParsedGameState | null = null;
  private correlationCounter = 0;
  private readonly engine = new RecommendationEngine();

  constructor(
    private readonly wsServer: BridgeWsServer,
    private readonly eventDetector: EventDetector,
    llmProvider: LlmProvider | null,
    private readonly config: OrchestratorConfig,
    private readonly clock: () => number = Date.now,
  ) {
    this.engine.setLlmProvider(llmProvider);
    if (this.config.tokenBudget) {
      this.engine.setTokenBudget(this.config.tokenBudget);
    }
  }

  async handleGameData(raw: AllGameData): Promise<void> {
    const stateResult = parseGameState(raw, this.config.summonerName);
    if (!stateResult.ok) {
      Logger.warn(`[Orchestrator] Failed to parse game state: ${stateResult.error.message}`);
      return;
    }
    const state = stateResult.value;
    this.lastState = state;
    const events = this.eventDetector.detect(state);

    for (const event of events) {
      Logger.info(`[Event] ${event.type}`);

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
    const correlationId = `${eventType}_${++this.correlationCounter}`;
    const hasClients = this.wsServer.clientCount > 0;

    await this.engine.process(state, eventType, hasClients, {
      onLlmBudgetExceeded: (sessionTokens, budget) => {
        this.wsServer.broadcast({
          event: "LLM_BUDGET_EXCEEDED",
          timestamp: this.clock(),
          sessionInputTokens: sessionTokens,
          budget,
        });
      },
      onLlmError: (msg) => {
        this.wsServer.broadcast({ event: "LLM_ERROR", timestamp: this.clock(), error: msg });
      },
      onLlmSuccess: (rec, tokenUsage) => {
        this.wsServer.broadcast({
          event: "RECOMMENDATION_UPDATE",
          timestamp: this.clock(),
          gameState: state,
          recommendation: rec,
          correlationId,
          tokenUsage,
        });
      },
    });
  }

  async triggerManualAnalysis(): Promise<void> {
    if (!this.lastState) {
      Logger.info("[Orchestrator] Manual analysis requested but no game state available.");
      return;
    }
    Logger.info("[Orchestrator] Manual analysis triggered.");
    await this.sendRecommendation(this.lastState, "MANUAL");
  }

  resetDetector(): void {
    this.lastState = null;
    this.eventDetector.reset();
    this.engine.reset();
  }

  setTokenBudget(budget: number): void {
    this.config.tokenBudget = budget;
    this.engine.setTokenBudget(budget);
  }

  setSummonerName(name: string): void {
    if (this.config.summonerName !== name) {
      Logger.info(`[Orchestrator] Changing summoner name to '${name}'`);
      this.config.summonerName = name;
      this.resetDetector();
    }
  }

  setLlmProvider(provider: LlmProvider | null): void {
    this.engine.setLlmProvider(provider);
  }
}
