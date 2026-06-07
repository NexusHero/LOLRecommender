import http from "http";
import { LiveClientPoller } from "../poller.js";
import { makeRawGameData } from "./fixtures.js";

// Integration test: verifies createDefaultFetcher makes a real HTTP request
// and the poller processes the response through the full Zod validation chain.
// The inline server is self-contained — no external process needed.

describe("LiveClientPoller — createDefaultFetcher integration", () => {
  let server: http.Server;
  let originalUrl: string | undefined;

  beforeEach(async () => {
    originalUrl = process.env.LIVE_CLIENT_URL;

    server = http.createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(makeRawGameData()));
    });

    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );

    const { port } = server.address() as { port: number };
    process.env.LIVE_CLIENT_URL =
      `http://127.0.0.1:${port}/liveclientdata/allgamedata`;
  });

  afterEach(async () => {
    if (originalUrl !== undefined) {
      process.env.LIVE_CLIENT_URL = originalUrl;
    } else {
      delete process.env.LIVE_CLIENT_URL;
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it(
    "createDefaultFetcher_InlineHttpServer_FetchesAndValidatesGameData",
    async () => {
      // Arrange — poller created without injected fetcher → uses createDefaultFetcher()
      const onData = jest.fn();
      const onStatus = jest.fn();
      const poller = new LiveClientPoller(onData, onStatus);

      // Act — start fires initial poll immediately; real HTTP I/O needed
      poller.start();
      await new Promise((resolve) => setTimeout(resolve, 300));
      poller.stop();

      // Assert — onData called with Zod-validated AllGameData shape
      expect(onData).toHaveBeenCalled();
      expect(onData.mock.calls[0][0]).toMatchObject({
        gameData: expect.objectContaining({ gameMode: "CLASSIC" }),
        activePlayer: expect.objectContaining({ summonerName: "TestPlayer" }),
      });
      expect(onStatus).toHaveBeenCalledWith(true);
    },
    10_000,
  );

  it(
    "createDefaultFetcher_ServerReturnsInvalidJson_DoesNotCallOnData",
    async () => {
      // Override server to return garbage
      server.removeAllListeners("request");
      server.on("request", (_req, res) => {
        res.writeHead(200);
        res.end("not-json{{{");
      });

      const onData = jest.fn();
      const poller = new LiveClientPoller(onData, jest.fn());

      poller.start();
      await new Promise((resolve) => setTimeout(resolve, 300));
      poller.stop();

      expect(onData).not.toHaveBeenCalled();
    },
    10_000,
  );
});
