import type { ParsedGameState, Player } from "./types.js";

export function getGamePhase(gameTimeSec: number): "early" | "mid" | "late" {
  if (gameTimeSec < 14 * 60) return "early";
  if (gameTimeSec < 25 * 60) return "mid";
  return "late";
}

export function minifyGameState(state: ParsedGameState): string {
  const gameTimeSec = Math.max(0, state.gameTime);
  const timeMins = Math.floor(gameTimeSec / 60);
  const timeSecs = Math.floor(gameTimeSec % 60).toString().padStart(2, "0");

  const me = formatPlayer(state.localPlayer, state.activePlayer.currentGold);
  
  const alliesStr = state.allies.length > 0 
    ? state.allies.map(p => formatPlayer(p)).join(", ")
    : "None";
    
  const enemiesStr = state.enemies.length > 0
    ? state.enemies.map(p => formatPlayer(p)).join(", ")
    : "None";

  const myItems = state.localPlayer.items.map(i => i.displayName).join(", ") || "None";

  return `Time: ${timeMins}:${timeSecs}
Me: ${me}
My Items: ${myItems}
Allies: ${alliesStr}
Enemies: ${enemiesStr}`;
}

function formatPlayer(p: Player, gold?: number): string {
  const kda = `${p.scores.kills}/${p.scores.deaths}/${p.scores.assists}`;
  const cs = `CS: ${p.scores.creepScore}`;
  const vision = p.scores.wardScore > 0 ? `, Vision: ${Math.round(p.scores.wardScore)}` : "";
  const pos = p.position ? ` [${p.position}]` : "";
  const dead = p.isDead ? ", DEAD" : "";
  let str = `${p.championName}${pos} (Lvl ${p.level}, KDA: ${kda}, ${cs}${vision}${dead})`;
  if (gold !== undefined) {
    str = `${p.championName}${pos} (Lvl ${p.level}, Gold: ${gold}, KDA: ${kda}, ${cs}${vision}${dead})`;
  }
  return str;
}
