"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllGameDataSchema = exports.GameDataSchema = exports.PlayerSchema = exports.ItemSchema = exports.ActivePlayerSchema = void 0;
const zod_1 = require("zod");
// --- Riot Live Client API Schemas ---
exports.ActivePlayerSchema = zod_1.z.object({
    championStats: zod_1.z.object({
        abilityPower: zod_1.z.number().catch(0),
        armor: zod_1.z.number().catch(0),
        attackDamage: zod_1.z.number().catch(0),
        critChance: zod_1.z.number().catch(0),
        healthMax: zod_1.z.number().catch(0),
        magicResist: zod_1.z.number().catch(0),
    }),
    currentGold: zod_1.z.number(),
    level: zod_1.z.number(),
    summonerName: zod_1.z.string(),
});
exports.ItemSchema = zod_1.z.object({
    canUse: zod_1.z.boolean(),
    consumable: zod_1.z.boolean(),
    count: zod_1.z.number(),
    displayName: zod_1.z.string(),
    itemID: zod_1.z.number(),
    price: zod_1.z.number(),
    rawDescription: zod_1.z.string(),
    slot: zod_1.z.number(),
});
exports.PlayerSchema = zod_1.z.object({
    championName: zod_1.z.string(),
    isBot: zod_1.z.boolean(),
    isDead: zod_1.z.boolean(),
    items: zod_1.z.array(exports.ItemSchema),
    level: zod_1.z.number(),
    position: zod_1.z.string().catch(""),
    rawChampionName: zod_1.z.string(),
    scores: zod_1.z.object({
        assists: zod_1.z.number(),
        creepScore: zod_1.z.number(),
        deaths: zod_1.z.number(),
        kills: zod_1.z.number(),
        wardScore: zod_1.z.number().catch(0),
    }),
    skinID: zod_1.z.number(),
    summonerName: zod_1.z.string(),
    team: zod_1.z.enum(["ORDER", "CHAOS"]).catch("ORDER"),
});
exports.GameDataSchema = zod_1.z.object({
    gameMode: zod_1.z.string(),
    gameTime: zod_1.z.number(),
    mapName: zod_1.z.string(),
    mapNumber: zod_1.z.number(),
    mapTerrain: zod_1.z.string().catch(""),
});
exports.AllGameDataSchema = zod_1.z.object({
    activePlayer: exports.ActivePlayerSchema,
    allPlayers: zod_1.z.array(exports.PlayerSchema),
    gameData: exports.GameDataSchema,
});
