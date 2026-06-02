import type { AllGameData, ParsedGameState } from "./types.js";

export function parseGameState(
  raw: AllGameData,
  localSummonerName: string
): ParsedGameState {
  const localPlayer = raw.allPlayers.find(
    (p) => p.summonerName === localSummonerName
  );

  if (!localPlayer) {
    // Fallback: ersten Spieler nehmen (passiert bei Spectate oder falschem Namen)
    console.warn(
      `[Parser] Local player '${localSummonerName}' not found — falling back to first player.`
    );
  }

  const player = localPlayer ?? raw.allPlayers[0];
  const localTeam = player.team;

  const allies = raw.allPlayers.filter(
    (p) => p.team === localTeam && p.summonerName !== player.summonerName
  );
  const enemies = raw.allPlayers.filter((p) => p.team !== localTeam);

  return {
    gameTime: raw.gameData.gameTime,
    gameMode: raw.gameData.gameMode,
    localPlayer: player,
    allies,
    enemies,
    activePlayer: raw.activePlayer,
  };
}
