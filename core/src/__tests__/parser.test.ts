import { parseGameState } from "../parser";
import { makePlayer, makeActivePlayer } from "./fixtures";
import type { AllGameData } from "../types";

function makeRaw(players: ReturnType<typeof makePlayer>[]): AllGameData {
  return {
    activePlayer: makeActivePlayer(),
    allPlayers: players,
    gameData: {
      gameMode: "CLASSIC",
      gameTime: 60,
      mapName: "Summoner's Rift",
      mapNumber: 11,
      mapTerrain: "Default",
    },
  };
}

describe("parseGameState", () => {
  it("parseGameState_MatchingSummonerName_ReturnsCorrectLocalPlayer", () => {
    const local = makePlayer({ summonerName: "MyPlayer", team: "ORDER" });
    const raw = makeRaw([local, makePlayer({ summonerName: "Other", team: "CHAOS" })]);

    const res = parseGameState(raw, "MyPlayer");

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.localPlayer.summonerName).toBe("MyPlayer");
  });

  it("parseGameState_ActivePlayerNameMatchesAllPlayers_ReturnsCorrectPlayer", () => {
    // Riot ID format: activePlayer.summonerName may differ from user-configured name
    const local = makePlayer({ summonerName: "BaklavaBoy#EUW", team: "ORDER" });
    const other = makePlayer({ summonerName: "Jinx#NA1", team: "ORDER" });
    const raw = makeRaw([local, other]);
    raw.activePlayer.summonerName = "BaklavaBoy#EUW";

    const res = parseGameState(raw, "BaklavaBoy");

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.localPlayer.summonerName).toBe("BaklavaBoy#EUW");
  });

  it("parseGameState_NoMatchingSummonerName_FallsBackToFirstPlayer", () => {
    const first = makePlayer({ summonerName: "FirstPlayer", team: "ORDER" });
    const raw = makeRaw([first]);

    const res = parseGameState(raw, "NonExistent");

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.localPlayer.summonerName).toBe("FirstPlayer");
  });

  it("parseGameState_ThreePlayersOnDifferentTeams_SeparatesAlliesAndEnemies", () => {
    const local = makePlayer({ summonerName: "Local", team: "ORDER" });
    const ally = makePlayer({ summonerName: "Ally", team: "ORDER" });
    const enemy = makePlayer({ summonerName: "Enemy", team: "CHAOS" });
    const raw = makeRaw([local, ally, enemy]);

    const res = parseGameState(raw, "Local");

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.allies).toHaveLength(1);
    expect(res.value.allies[0].summonerName).toBe("Ally");
    expect(res.value.enemies).toHaveLength(1);
    expect(res.value.enemies[0].summonerName).toBe("Enemy");
  });

  it("parseGameState_SingleLocalPlayer_ExcludesLocalPlayerFromAllies", () => {
    const local = makePlayer({ summonerName: "Local", team: "ORDER" });
    const raw = makeRaw([local]);

    const res = parseGameState(raw, "Local");

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.allies).toHaveLength(0);
  });

  it("parseGameState_AramGameMode_CopiesGameTimeAndMode", () => {
    const raw = makeRaw([makePlayer()]);
    raw.gameData.gameTime = 300;
    raw.gameData.gameMode = "ARAM";

    const res = parseGameState(raw, "TestPlayer");

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.gameTime).toBe(300);
    expect(res.value.gameMode).toBe("ARAM");
  });
});
