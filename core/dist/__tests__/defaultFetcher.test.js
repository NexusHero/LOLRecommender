"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const poller_js_1 = require("../poller.js");
const fixtures_js_1 = require("./fixtures.js");
const config_js_1 = require("../config.js");
// Integration test: verifies createDefaultFetcher makes a real HTTP request
// and the poller processes the response through the full Zod validation chain.
// The inline server is self-contained — no external process needed.
describe("LiveClientPoller — createDefaultFetcher integration", () => {
    let server;
    let originalUrl;
    beforeEach(async () => {
        originalUrl = config_js_1.config.riot.liveClientUrl;
        server = http_1.default.createServer((_req, res) => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify((0, fixtures_js_1.makeRawGameData)()));
        });
        await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
        const { port } = server.address();
        config_js_1.config.riot.liveClientUrl =
            `http://127.0.0.1:${port}/liveclientdata/allgamedata`;
    });
    afterEach(async () => {
        if (originalUrl !== undefined) {
            config_js_1.config.riot.liveClientUrl = originalUrl;
        }
        await new Promise((resolve) => server.close(() => resolve()));
    });
    it("createDefaultFetcher_InlineHttpServer_FetchesAndValidatesGameData", async () => {
        // Arrange — poller created without injected fetcher → uses createDefaultFetcher()
        const onData = jest.fn();
        const onStatus = jest.fn();
        const poller = new poller_js_1.LiveClientPoller(onData, onStatus);
        // Act — start fires initial poll immediately; real HTTP I/O needed
        let waitResolve;
        const waitPromise = new Promise((r) => (waitResolve = r));
        onData.mockImplementation(() => waitResolve());
        poller.start();
        await waitPromise;
        poller.stop();
        // Assert — onData called with Zod-validated AllGameData shape
        expect(onData).toHaveBeenCalled();
        expect(onData.mock.calls[0][0]).toMatchObject({
            gameData: expect.objectContaining({ gameMode: "CLASSIC" }),
            activePlayer: expect.objectContaining({ summonerName: "TestPlayer" }),
        });
        expect(onStatus).toHaveBeenCalledWith(true);
    }, 10_000);
    it("createDefaultFetcher_ServerReturnsInvalidJson_DoesNotCallOnData", async () => {
        // Override server to return garbage
        server.removeAllListeners("request");
        server.on("request", (_req, res) => {
            res.writeHead(200);
            res.end("not-json{{{");
        });
        const onData = jest.fn();
        const poller = new poller_js_1.LiveClientPoller(onData, jest.fn());
        let waitResolve;
        const waitPromise = new Promise((r) => (waitResolve = r));
        // Hook into internal fetcher resolution if possible, or just wait longer.
        // Since it's invalid JSON, onData is not called. We'll wait 300ms.
        poller.start();
        await new Promise((resolve) => setTimeout(resolve, 300));
        poller.stop();
        // small extra wait to let pending promises flush
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(onData).not.toHaveBeenCalled();
    }, 10_000);
});
