"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const stateMinifier_js_1 = require("./stateMinifier.js");
const CACHE_TTL_MS = 10 * 60 * 1000;
class CacheService {
    store = new Map();
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return undefined;
        if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
            this.store.delete(key);
            return undefined;
        }
        return entry.analysis;
    }
    set(key, analysis) {
        this.store.set(key, { analysis, cachedAt: Date.now() });
    }
    clear() {
        this.store.clear();
    }
    buildKey(state) {
        const goldBucket = Math.floor(state.activePlayer.currentGold / 500);
        const phase = (0, stateMinifier_js_1.getGamePhase)(state.gameTime);
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
exports.CacheService = CacheService;
