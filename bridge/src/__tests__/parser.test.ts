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

    const state = parseGameState(raw, "MyPlayer");

    expect(state.localPlayer.summonerName).toBe("MyPlayer");
  });

  it("parseGameState_NoMatchingSummonerName_FallsBackToFirstPlayer", () => {
    const first = makePlayer({ summonerName: "FirstPlayer", team: "ORDER" });
    const raw = makeRaw([first]);

    const state = parseGameState(raw, "NonExistent");

    expect(state.localPlayer.summonerName).toBe("FirstPlayer");
  });

  it("parseGameState_ThreePlayersOnDifferentTeams_SeparatesAlliesAndEnemies", () => {
    const local = makePlayer({ summonerName: "Local", team: "ORDER" });
    const ally = makePlayer({ summonerName: "Ally", team: "ORDER" });
    const enemy = makePlayer({ summonerName: "Enemy", team: "CHAOS" });
    const raw = makeRaw([local, ally, enemy]);

    const state = parseGameState(raw, "Local");

    expect(state.allies).toHaveLength(1);
    expect(state.allies[0].summonerName).toBe("Ally");
    expect(state.enemies).toHaveLength(1);
    expect(state.enemies[0].summonerName).toBe("Enemy");
  });

  it("parseGameState_SingleLocalPlayer_ExcludesLocalPlayerFromAllies", () => {
    const local = makePlayer({ summonerName: "Local", team: "ORDER" });
    const raw = makeRaw([local]);

    const state = parseGameState(raw, "Local");

    expect(state.allies).toHaveLength(0);
  });

  it("parseGameState_AramGameMode_CopiesGameTimeAndMode", () => {
    const raw = makeRaw([makePlayer()]);
    raw.gameData.gameTime = 300;
    raw.gameData.gameMode = "ARAM";

    const state = parseGameState(raw, "TestPlayer");

    expect(state.gameTime).toBe(300);
    expect(state.gameMode).toBe("ARAM");
  });
});
