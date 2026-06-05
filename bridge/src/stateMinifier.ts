import type { ParsedGameState, Player } from "./types.js";

export function minifyGameState(state: ParsedGameState): string {
  const timeMins = Math.floor(state.gameTime / 60);
  const timeSecs = Math.floor(state.gameTime % 60).toString().padStart(2, "0");

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
  let str = `${p.championName} (Lvl ${p.level}, KDA: ${kda})`;
  if (gold !== undefined) {
    str = `${p.championName} (Lvl ${p.level}, Gold: ${gold}, KDA: ${kda})`;
  }
  return str;
}
