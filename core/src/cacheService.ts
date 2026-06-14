import type { ParsedGameState } from "./types.js";
import type { LlmAnalysis } from "./llmProvider.js";
import { getGamePhase } from "./stateMinifier.js";

const CACHE_TTL_MS = 10 * 60 * 1000;

interface CacheEntry {
  analysis: LlmAnalysis;
  cachedAt: number;
}

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

  buildKey(state: ParsedGameState): string {
    const goldBucket = Math.floor(state.activePlayer.currentGold / 500);
    const phase = getGamePhase(state.gameTime);
    const killsBucket = Math.floor(state.localPlayer.scores.kills / 3);
    const deathsBucket = Math.floor(state.localPlayer.scores.deaths / 2);
    const enemyNames = state.enemies.map((e) => e.championName).sort().join(",");
    const myItems = state.localPlayer.items.map((i) => i.itemID).sort().join(",");
    return [
      state.localPlayer.championName,
      phase,
      `g${goldBucket}`,
      `k${killsBucket}`,
      `d${deathsBucket}`,
      `e:${enemyNames}`,
      `myitems:${myItems}`,
    ].join("|");
  }
}
