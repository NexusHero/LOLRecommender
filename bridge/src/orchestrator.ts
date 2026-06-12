import { parseGameState } from "./parser.js";
import { EventDetector, HIGH_GOLD_THRESHOLD } from "./eventDetector.js";
import { buildCompProfile, getHeuristicRecommendations } from "./heuristic.js";
import { BridgeWsServer } from "./wsServer.js";
import type { LlmProvider } from "./llmProvider.js";
import { CacheService } from "./cacheService.js";
import type { AllGameData, ParsedGameState } from "./types.js";

export interface OrchestratorConfig {
  summonerName: string;
  llmCooldownMs: number;
  tokenBudget?: number; // session input token budget; 0 or undefined = unlimited
}

export class BridgeOrchestrator {
  private llmProvider: LlmProvider | null;
  private lastState: ParsedGameState | null = null;
  private readonly cache = new CacheService();
  private correlationCounter = 0;
  private sessionInputTokens = 0;
  private sessionOutputTokens = 0;

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
    const correlationId = `${eventType}_${++this.correlationCounter}`;

    // Phase 1: broadcast heuristic items immediately
    this.wsServer.broadcast({
      event: "RECOMMENDATION",
      timestamp: this.clock(),
      gameState: state,
      recommendation: heuristicRec,
      correlationId,
    });
    console.log(`[Rec] heuristic (Trigger: ${eventType}): ${heuristicRec.items.map((i) => i.name).join(", ")}`);

    const useLlm =
      this.llmProvider !== null &&
      this.wsServer.clientCount > 0 &&
      (eventType === "GAME_STARTED" || eventType === "PLAYER_DIED" || eventType === "MANUAL");

    if (!useLlm) return;

    const budget = this.config.tokenBudget ?? 0;
    if (budget > 0 && this.sessionInputTokens >= budget) {
      console.warn(`[Orchestrator] Session token budget exhausted (${this.sessionInputTokens}/${budget}). Skipping LLM.`);
      this.wsServer.broadcast({
        event: "LLM_BUDGET_EXCEEDED",
        timestamp: this.clock(),
        sessionInputTokens: this.sessionInputTokens,
        budget,
      });
      return;
    }

    const heuristicItemIds = heuristicRec.items.map((i) => i.id);
    const cacheKey = this.cache.buildKey(state, heuristicItemIds);
    const cached = this.cache.get(cacheKey);

    let llmAnalysis: Awaited<ReturnType<LlmProvider["getAnalysis"]>>;
    if (cached) {
      console.log(`[Orchestrator] Cache HIT (${eventType})`);
      llmAnalysis = cached;
    } else {
      try {
        llmAnalysis = await this.llmProvider!.getAnalysis(state, heuristicRec);
        if (llmAnalysis.tokenUsage) {
          this.sessionInputTokens += llmAnalysis.tokenUsage.input;
          this.sessionOutputTokens += llmAnalysis.tokenUsage.output;
        }
        this.cache.set(cacheKey, llmAnalysis);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[Orchestrator] LLM failed for ${eventType}:`, msg);
        this.wsServer.broadcast({ event: "LLM_ERROR", timestamp: this.clock(), error: msg });
        return;
      }
    }

    // Merge: heuristic core items + LLM situational additions (dedup by id)
    const coreIds = new Set(heuristicRec.items.map((i) => i.id));
    const situational = (llmAnalysis.situationalItems ?? []).filter((i) => !coreIds.has(i.id));
    const enrichedRec = {
      ...heuristicRec,
      items: [...heuristicRec.items, ...situational],
      reasoning: llmAnalysis.reasoning,
      strategy: llmAnalysis.strategy,
      source: "llm" as const,
      provider: this.llmProvider!.name,
    };

    // Phase 2: broadcast LLM-enriched recommendation
    this.wsServer.broadcast({
      event: "RECOMMENDATION_UPDATE",
      timestamp: this.clock(),
      gameState: state,
      recommendation: enrichedRec,
      correlationId,
      tokenUsage: llmAnalysis.tokenUsage
        ? {
            lastInput: llmAnalysis.tokenUsage.input,
            lastOutput: llmAnalysis.tokenUsage.output,
            sessionInput: this.sessionInputTokens,
            sessionOutput: this.sessionOutputTokens,
          }
        : undefined,
    });
    console.log(`[Rec] llm (Trigger: ${eventType}): ${enrichedRec.items.map((i) => i.name).join(", ")}`);
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
    this.cache.clear();
    this.eventDetector.reset();
    this.sessionInputTokens = 0;
    this.sessionOutputTokens = 0;
  }

  setTokenBudget(budget: number): void {
    this.config.tokenBudget = budget;
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
