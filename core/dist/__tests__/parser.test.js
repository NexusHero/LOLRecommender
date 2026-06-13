"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parser_1 = require("../parser");
const fixtures_1 = require("./fixtures");
function makeRaw(players) {
    return {
        activePlayer: (0, fixtures_1.makeActivePlayer)(),
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
        const local = (0, fixtures_1.makePlayer)({ summonerName: "MyPlayer", team: "ORDER" });
        const raw = makeRaw([local, (0, fixtures_1.makePlayer)({ summonerName: "Other", team: "CHAOS" })]);
        const state = (0, parser_1.parseGameState)(raw, "MyPlayer");
        expect(state.localPlayer.summonerName).toBe("MyPlayer");
    });
    it("parseGameState_ActivePlayerNameMatchesAllPlayers_ReturnsCorrectPlayer", () => {
        // Riot ID format: activePlayer.summonerName may differ from user-configured name
        const local = (0, fixtures_1.makePlayer)({ summonerName: "BaklavaBoy#EUW", team: "ORDER" });
        const other = (0, fixtures_1.makePlayer)({ summonerName: "Jinx#NA1", team: "ORDER" });
        const raw = makeRaw([local, other]);
        raw.activePlayer.summonerName = "BaklavaBoy#EUW";
        const state = (0, parser_1.parseGameState)(raw, "BaklavaBoy");
        expect(state.localPlayer.summonerName).toBe("BaklavaBoy#EUW");
    });
    it("parseGameState_NoMatchingSummonerName_FallsBackToFirstPlayer", () => {
        const first = (0, fixtures_1.makePlayer)({ summonerName: "FirstPlayer", team: "ORDER" });
        const raw = makeRaw([first]);
        const state = (0, parser_1.parseGameState)(raw, "NonExistent");
        expect(state.localPlayer.summonerName).toBe("FirstPlayer");
    });
    it("parseGameState_ThreePlayersOnDifferentTeams_SeparatesAlliesAndEnemies", () => {
        const local = (0, fixtures_1.makePlayer)({ summonerName: "Local", team: "ORDER" });
        const ally = (0, fixtures_1.makePlayer)({ summonerName: "Ally", team: "ORDER" });
        const enemy = (0, fixtures_1.makePlayer)({ summonerName: "Enemy", team: "CHAOS" });
        const raw = makeRaw([local, ally, enemy]);
        const state = (0, parser_1.parseGameState)(raw, "Local");
        expect(state.allies).toHaveLength(1);
        expect(state.allies[0].summonerName).toBe("Ally");
        expect(state.enemies).toHaveLength(1);
        expect(state.enemies[0].summonerName).toBe("Enemy");
    });
    it("parseGameState_SingleLocalPlayer_ExcludesLocalPlayerFromAllies", () => {
        const local = (0, fixtures_1.makePlayer)({ summonerName: "Local", team: "ORDER" });
        const raw = makeRaw([local]);
        const state = (0, parser_1.parseGameState)(raw, "Local");
        expect(state.allies).toHaveLength(0);
    });
    it("parseGameState_AramGameMode_CopiesGameTimeAndMode", () => {
        const raw = makeRaw([(0, fixtures_1.makePlayer)()]);
        raw.gameData.gameTime = 300;
        raw.gameData.gameMode = "ARAM";
        const state = (0, parser_1.parseGameState)(raw, "TestPlayer");
        expect(state.gameTime).toBe(300);
        expect(state.gameMode).toBe("ARAM");
    });
});
