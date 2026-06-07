import type { AllGameData, ParsedGameState } from "./types.js";

export function parseGameState(
  raw: AllGameData,
  localSummonerName: string
): ParsedGameState {
  // activePlayer.summonerName is always the local player per Riot API contract.
  // We use it to find the matching entry in allPlayers (which has champion/items/team).
  // The user-configured localSummonerName is only a fallback for spectator mode where
  // activePlayer is absent.
  const activeName = raw.activePlayer.summonerName;
  const localPlayer =
    raw.allPlayers.find((p) => p.summonerName === activeName) ??
    raw.allPlayers.find((p) => p.summonerName === localSummonerName);

  if (!localPlayer) {
    console.warn(
      `[Parser] Local player not found (activePlayer='${activeName}', configured='${localSummonerName}') — falling back to first player.`
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
