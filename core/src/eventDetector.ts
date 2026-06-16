import { singleton } from "tsyringe";
import type { ParsedGameState, GameEvent, Player } from "./types.js";
import { config } from "./config.js";

const TICK_INTERVAL_SEC = 30;
export const HIGH_GOLD_THRESHOLD = config.game.highGoldThreshold;

@singleton()
export class EventDetector {
  private lastState: ParsedGameState | null = null;

  detect(current: ParsedGameState): GameEvent[] {
    const events: GameEvent[] = [];
    const prev = this.lastState;

    if (!prev) {
      events.push({ type: "GAME_STARTED", state: current });
      this.lastState = current;
      return events;
    }

    for (const enemy of current.enemies) {
      const prevEnemy = prev.enemies.find(
        (p) => p.summonerName === enemy.summonerName
      );
      if (!prevEnemy) continue;

      const prevItemIds = new Set(prevEnemy.items.map((i) => i.itemID));
      if (enemy.items.some((i) => !prevItemIds.has(i.itemID))) {
        events.push({ type: "ITEM_PURCHASED", player: enemy, state: current });
      }
    }

    if (current.localPlayer.level > prev.localPlayer.level) {
      events.push({
        type: "LEVEL_UP",
        player: current.localPlayer,
        newLevel: current.localPlayer.level,
        state: current,
      });
    }

    const prevTick = Math.floor(prev.gameTime / TICK_INTERVAL_SEC);
    const currTick = Math.floor(current.gameTime / TICK_INTERVAL_SEC);
    if (currTick > prevTick) {
      events.push({ type: "GAME_TICK", state: current });
    }

    if (!prev.localPlayer.isDead && current.localPlayer.isDead) {
      events.push({ type: "PLAYER_DIED", state: current });
    }

    if (
      prev.activePlayer.currentGold < HIGH_GOLD_THRESHOLD &&
      current.activePlayer.currentGold >= HIGH_GOLD_THRESHOLD
    ) {
      events.push({ type: "HIGH_GOLD_REACHED", state: current });
    }

    this.lastState = current;
    return events;
  }

  reset() {
    this.lastState = null;
  }
}
