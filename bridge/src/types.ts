import { z } from "zod";

// --- Riot Live Client API Schemas ---

export const ActivePlayerSchema = z.object({
  championStats: z.object({
    abilityPower: z.number(),
    armor: z.number(),
    attackDamage: z.number(),
    critChance: z.number(),
    healthMax: z.number(),
    magicResist: z.number(),
  }),
  currentGold: z.number(),
  level: z.number(),
  summonerName: z.string(),
});

export const ItemSchema = z.object({
  canUse: z.boolean(),
  consumable: z.boolean(),
  count: z.number(),
  displayName: z.string(),
  itemID: z.number(),
  price: z.number(),
  rawDescription: z.string(),
  slot: z.number(),
});

export const PlayerSchema = z.object({
  championName: z.string(),
  isBot: z.boolean(),
  isDead: z.boolean(),
  items: z.array(ItemSchema),
  level: z.number(),
  position: z.string().catch(""),
  rawChampionName: z.string(),
  scores: z.object({
    assists: z.number(),
    creepScore: z.number(),
    deaths: z.number(),
    kills: z.number(),
    wardScore: z.number().catch(0),
  }),
  skinID: z.number(),
  summonerName: z.string(),
  team: z.enum(["ORDER", "CHAOS"]).catch("ORDER" as any),
});

export const GameDataSchema = z.object({
  gameMode: z.string(),
  gameTime: z.number(),
  mapName: z.string(),
  mapNumber: z.number(),
  mapTerrain: z.string().catch(""),
});

export const AllGameDataSchema = z.object({
  activePlayer: ActivePlayerSchema,
  allPlayers: z.array(PlayerSchema),
  gameData: GameDataSchema,
});

export type ActivePlayer = z.infer<typeof ActivePlayerSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type GameData = z.infer<typeof GameDataSchema>;
export type AllGameData = z.infer<typeof AllGameDataSchema>;

// --- Interne Bridge-Typen ---

export interface ParsedGameState {
  gameTime: number;
  gameMode: string;
  localPlayer: Player;
  allies: Player[];
  enemies: Player[];
  activePlayer: ActivePlayer;
}

export type GameEvent =
  | { type: "GAME_STARTED"; state: ParsedGameState }
  | { type: "ITEM_PURCHASED"; player: Player; state: ParsedGameState }
  | { type: "LEVEL_UP"; player: Player; newLevel: number; state: ParsedGameState }
  | { type: "GAME_TICK"; state: ParsedGameState };

// --- WebSocket Message Schema (an Flutter gesendet) ---

export interface WsMessage {
  event: string;
  timestamp: number;
  gameState?: ParsedGameState;
  recommendation?: ItemRecommendation;
  error?: string;
}

export interface ItemRecommendation {
  items: RecommendedItem[];
  reasoning: string;
  source: "heuristic" | "llm";
}

export interface RecommendedItem {
  id: number;
  name: string;
  reason: string;
  priority: "core" | "situational";
}

export interface CompProfile {
  adRatio: number;
  apRatio: number;
  ccScore: number;
  healScore: number;
}
