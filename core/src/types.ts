import { z } from "zod";

// --- Riot Live Client API Schemas ---

export const ActivePlayerSchema = z.object({
  championStats: z.object({
    abilityPower: z.number().catch(0),
    armor: z.number().catch(0),
    attackDamage: z.number().catch(0),
    critChance: z.number().catch(0),
    healthMax: z.number().catch(0),
    magicResist: z.number().catch(0),
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

export const SummonerSpellSchema = z.object({
  displayName: z.string().catch(""),
});

export const SummonerSpellsSchema = z
  .object({
    summonerSpellOne: SummonerSpellSchema.optional(),
    summonerSpellTwo: SummonerSpellSchema.optional(),
  })
  .optional();

export const PlayerSchema = z.object({
  championName: z.string(),
  isBot: z.boolean(),
  isDead: z.boolean(),
  items: z.array(ItemSchema),
  level: z.number(),
  position: z.string().catch(""),
  rawChampionName: z.string(),
  summonerSpells: SummonerSpellsSchema,
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

export type RolePosition = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY" | "UNKNOWN" | string;

/**
 * Playstyle the user wants the coaching tuned to.
 * Shapes only the *tone/aggressiveness* of the single recommendation — never
 * produces multiple parallel recommendations.
 */
export type RiskLevel = "safe" | "normal" | "risky";

export const DEFAULT_RISK_LEVEL: RiskLevel = "normal";

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
  | { type: "GAME_TICK"; state: ParsedGameState }
  | { type: "PLAYER_DIED"; state: ParsedGameState }
  | { type: "HIGH_GOLD_REACHED"; state: ParsedGameState };

// --- WebSocket Message Schema (an Flutter gesendet) ---

export interface WsTokenUsage {
  lastInput: number;
  lastOutput: number;
  sessionInput: number;
  sessionOutput: number;
}

export interface WsMessage {
  event: string;
  timestamp: number;
  gameState?: ParsedGameState;
  recommendation?: ItemRecommendation;
  error?: string;
  correlationId?: string;
  tokenUsage?: WsTokenUsage;
  sessionInputTokens?: number;
  budget?: number;
}

export interface Strategy {
  winCondition: "early" | "mid" | "late";
  summary: string;
  immediateAction: string;
  lateGamePlan: string;
  laneMatchupAnalysis?: string;
  counterPlay?: string;
}

export interface ItemRecommendation {
  items: RecommendedItem[];
  reasoning: string;
  source: "heuristic" | "llm";
  provider: string;
  strategy: Strategy;
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
