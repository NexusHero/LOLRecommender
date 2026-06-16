import { injectable } from "tsyringe";
import type { ParsedGameState, RiskLevel } from "./types.js";
import { DEFAULT_RISK_LEVEL } from "./types.js";
import type { LlmAnalysis } from "./llmProvider.js";
import { getGamePhase } from "./stateMinifier.js";

const CACHE_TTL_MS = 10 * 60 * 1000;

interface CacheEntry {
  analysis: LlmAnalysis;
  cachedAt: number;
}

@injectable()
export class CacheService {
  private readonly store = new Map<string, CacheEntry>();

  get(key: string): LlmAnalysis | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      this.store.delete(key);
      return undefined;
    }
    return entry.analysis;
  }

  set(key: string, analysis: LlmAnalysis): void {
    this.store.set(key, { analysis, cachedAt: Date.now() });
  }

  clear(): void {
    this.store.clear();
  }

  buildKey(state: ParsedGameState, risk: RiskLevel = DEFAULT_RISK_LEVEL): string {
    const goldBucket = Math.floor(state.activePlayer.currentGold / 500);
    const phase = getGamePhase(state.gameTime);
    const killsBucket = Math.floor(state.localPlayer.scores.kills / 3);
    // Deaths are exact (not bucketed): each death changes the live situation
    // meaningfully, so consecutive deaths must not collapse into one cache entry.
    const deaths = state.localPlayer.scores.deaths;
    const enemyNames = state.enemies.map((e) => e.championName).sort().join(",");
    const myItems = state.localPlayer.items.map((i) => i.itemID).sort().join(",");
    return [
      state.localPlayer.championName,
      phase,
      `g${goldBucket}`,
      `k${killsBucket}`,
      `d${deaths}`,
      `r:${risk}`,
      `e:${enemyNames}`,
      `myitems:${myItems}`,
    ].join("|");
  }
}
