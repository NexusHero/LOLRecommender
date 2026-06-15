import type { LlmProvider } from "./llmProvider.js";
import { CacheService } from "./cacheService.js";
import type { ParsedGameState, ItemRecommendation, WsTokenUsage } from "./types.js";
import { Logger } from "./logger.js";
import { ddragon } from "./ddragonService.js";

export interface RecommendationCallbacks {
  onLlmBudgetExceeded: (sessionTokens: number, budget: number) => void;
  onLlmError: (msg: string) => void;
  onLlmSuccess: (rec: ItemRecommendation, tokenUsage?: WsTokenUsage) => void;
}

export class RecommendationEngine {
  private llmProvider: LlmProvider | null = null;
  private readonly cache = new CacheService();
  private sessionInputTokens = 0;
  private sessionOutputTokens = 0;
  private tokenBudget = 0;

  setLlmProvider(provider: LlmProvider | null): void {
    const oldName = this.llmProvider?.name ?? "none";
    const newName = provider?.name ?? "none";
    if (oldName !== newName) {
      Logger.info(`[Engine] LLM provider changed: ${oldName} → ${newName}`);
    }
    this.llmProvider = provider;
  }

  setTokenBudget(budget: number): void {
    this.tokenBudget = budget;
  }

  reset(): void {
    this.cache.clear();
    this.sessionInputTokens = 0;
    this.sessionOutputTokens = 0;
  }

  async process(
    state: ParsedGameState,
    eventType: string,
    hasClients: boolean,
    callbacks: RecommendationCallbacks
  ): Promise<void> {
    const useLlm =
      this.llmProvider !== null &&
      hasClients &&
      (eventType === "GAME_STARTED" || eventType === "PLAYER_DIED" || eventType === "MANUAL");

    if (!useLlm) return;

    if (this.tokenBudget > 0 && this.sessionInputTokens >= this.tokenBudget) {
      Logger.warn(`[Engine] Session token budget exhausted (${this.sessionInputTokens}/${this.tokenBudget}). Skipping LLM.`);
      callbacks.onLlmBudgetExceeded(this.sessionInputTokens, this.tokenBudget);
      return;
    }

    const cacheKey = this.cache.buildKey(state);
    const cached = this.cache.get(cacheKey);

    let llmAnalysis: Awaited<ReturnType<LlmProvider["getAnalysis"]>>;
    if (cached) {
      Logger.info(`[Engine] Cache HIT (${eventType})`);
      llmAnalysis = cached;
    } else {
      try {
        llmAnalysis = await this.llmProvider!.getAnalysis(state);
        if (llmAnalysis.tokenUsage) {
          this.sessionInputTokens += llmAnalysis.tokenUsage.input;
          this.sessionOutputTokens += llmAnalysis.tokenUsage.output;
        }
        this.cache.set(cacheKey, llmAnalysis);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        Logger.error(`[Engine] LLM failed for ${eventType}:`, msg);
        callbacks.onLlmError(msg);
        return;
      }
    }

    const ownedItemIds = new Set(state.localPlayer.items.map((i) => i.itemID));
    const seenIds = new Set<number>();
    const rec: ItemRecommendation = {
      items: (llmAnalysis.situationalItems ?? []).filter((i) => {
        if (ownedItemIds.has(i.id)) return false;
        if (!ddragon.getItemInfo(i.id)) { Logger.warn(`[Rec] Dropping hallucinated item id=${i.id} name="${i.name}"`); return false; }
        if (seenIds.has(i.id)) return false;
        seenIds.add(i.id);
        return true;
      }),
      reasoning: llmAnalysis.reasoning,
      strategy: llmAnalysis.strategy,
      source: "llm",
      provider: this.llmProvider!.name,
    };

    const tokenUsageInfo: WsTokenUsage | undefined = llmAnalysis.tokenUsage
      ? {
          lastInput: llmAnalysis.tokenUsage.input,
          lastOutput: llmAnalysis.tokenUsage.output,
          sessionInput: this.sessionInputTokens,
          sessionOutput: this.sessionOutputTokens,
        }
      : undefined;

    callbacks.onLlmSuccess(rec, tokenUsageInfo);
    Logger.info(`[Rec] llm (Trigger: ${eventType}): ${rec.items.map((i) => i.name).join(", ")}`);
  }
}
