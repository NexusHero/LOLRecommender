"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGameScenario = buildGameScenario;
const fixtures_js_1 = require("./fixtures.js");
// Thornmail — anti-heal/armor item, identifiable by heuristic
const THORNMAIL = (0, fixtures_js_1.makeItem)({ itemID: 3076, displayName: "Thornmail", price: 2700, slot: 0 });
// Builds one raw game snapshot as the Riot Live Client API would return it.
function snap(gameTime, localOverrides, enemyItemMap, gold) {
    const mk = (name, champion, team) => (0, fixtures_js_1.makePlayer)({
        summonerName: name,
        team,
        championName: champion,
        items: enemyItemMap[name] ?? [],
    });
    return {
        activePlayer: (0, fixtures_js_1.makeActivePlayer)({
            summonerName: "TestPlayer",
            currentGold: gold,
            level: localOverrides.level ?? 5,
        }),
        allPlayers: [
            (0, fixtures_js_1.makePlayer)({
                summonerName: "TestPlayer",
                team: "ORDER",
                championName: "Ahri",
                level: 5,
                ...localOverrides,
            }),
            mk("Lulu", "Lulu", "ORDER"), // ally support
            mk("Syndra", "Syndra", "CHAOS"), // AP mid  — buys Thornmail in frame 2
            mk("Zed", "Zed", "CHAOS"), // AD assassin
            mk("Thresh", "Thresh", "CHAOS"), // CC support
            mk("Jinx", "Jinx", "CHAOS"), // AD carry
            mk("Malzahar", "Malzahar", "CHAOS"), // AP carry
        ],
        gameData: {
            gameMode: "CLASSIC",
            gameTime,
            mapName: "Summoner's Rift",
            mapNumber: 11,
            mapTerrain: "Default",
        },
    };
}
/**
 * Returns 7 frames that cover every EventDetector branch:
 *
 *   Frame 0  t= 60  →  GAME_STARTED            + RECOMMENDATION
 *   Frame 1  t= 90  →  GAME_TICK
 *   Frame 2  t= 91  →  ITEM_PURCHASED           + RECOMMENDATION
 *   Frame 3  t=120  →  LEVEL_UP + GAME_TICK
 *   Frame 4  t=121  →  PLAYER_DIED              + RECOMMENDATION
 *   Frame 5  t=122  →  HIGH_GOLD_REACHED        + RECOMMENDATION
 *   Frame 6  t=123  →  (stable — no new events)
 *
 * Pumping 3 more fetcher failures after frame 6 triggers GAME_INACTIVE
 * (MAX_POLL_FAILURES = 3).
 */
function buildGameScenario() {
    const withThornmail = { Syndra: [THORNMAIL] };
    return [
        // Frame 0: game first detected at t=60 → GAME_STARTED + RECOMMENDATION
        snap(60, { level: 5 }, {}, 500),
        // Frame 1: clock passes 90s → GAME_TICK (floor(90/30)=3 > floor(60/30)=2)
        snap(90, { level: 5 }, {}, 500),
        // Frame 2: Syndra buys Thornmail → ITEM_PURCHASED + RECOMMENDATION
        snap(91, { level: 5 }, withThornmail, 500),
        // Frame 3: level up to 6 and clock passes 120s → LEVEL_UP + GAME_TICK
        snap(120, { level: 6 }, withThornmail, 500),
        // Frame 4: local player dies → PLAYER_DIED + RECOMMENDATION
        snap(121, { level: 6, isDead: true }, withThornmail, 500),
        // Frame 5: respawn, gold spikes 500→1200 → HIGH_GOLD_REACHED + RECOMMENDATION
        snap(122, { level: 6 }, withThornmail, 1200),
        // Frame 6: stable state — nothing changes, no events
        snap(123, { level: 6 }, withThornmail, 1200),
    ];
}
