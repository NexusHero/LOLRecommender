import { EventEmitter } from "events";
import { WebSocket } from "ws";
import { BridgeWsServer } from "../wsServer";
import type { WsMessage } from "../types";

jest.mock("../logger.js");

class MockWss extends EventEmitter {
  close = jest.fn();
  address = jest.fn().mockReturnValue({ port: 8765 });
}

class MockWebSocket extends EventEmitter {
  readyState: number = WebSocket.OPEN;
  send = jest.fn();
}

function fakeReq(ip = "127.0.0.1") {
  return { socket: { remoteAddress: ip } } as any;
}

describe("BridgeWsServer", () => {
  let mockWss: MockWss;
  let server: BridgeWsServer;

  beforeEach(() => {
    mockWss = new MockWss();
    server = new BridgeWsServer(mockWss as any);
  });

  describe("connection management", () => {
    it("connection_ClientConnects_IncrementsClientCount", () => {
      mockWss.emit("connection", new MockWebSocket(), fakeReq());

      expect(server.clientCount).toBe(1);
    });

    it("connection_ClientCloses_DecrementsClientCount", () => {
      const ws = new MockWebSocket();
      mockWss.emit("connection", ws, fakeReq());

      ws.emit("close");

      expect(server.clientCount).toBe(0);
    });

    it("connection_ClientErrors_DecrementsClientCount", () => {
      const ws = new MockWebSocket();
      mockWss.emit("connection", ws, fakeReq());

      ws.emit("error", new Error("test"));

      expect(server.clientCount).toBe(0);
    });

    it("connection_ClientConnects_SendsConnectedMessage", () => {
      const ws = new MockWebSocket();

      mockWss.emit("connection", ws, fakeReq());

      expect(ws.send).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(ws.send.mock.calls[0][0] as string);
      expect(payload.event).toBe("CONNECTED");
    });
  });

  describe("broadcast", () => {
    it("broadcast_MultipleOpenClients_SendsToAll", () => {
      const ws1 = new MockWebSocket();
      const ws2 = new MockWebSocket();
      mockWss.emit("connection", ws1, fakeReq());
      mockWss.emit("connection", ws2, fakeReq());
      ws1.send.mockClear();
      ws2.send.mockClear();

      const msg: WsMessage = { event: "GAME_TICK", timestamp: 0 };
      server.broadcast(msg);

      expect(ws1.send).toHaveBeenCalledTimes(1);
      expect(ws2.send).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(ws1.send.mock.calls[0][0] as string);
      expect(payload.event).toBe("GAME_TICK");
    });

    it("broadcast_ClientNotOpen_SkipsClosedClient", () => {
      const ws = new MockWebSocket();
      mockWss.emit("connection", ws, fakeReq());
      ws.readyState = WebSocket.CLOSED;
      ws.send.mockClear();

      server.broadcast({ event: "GAME_TICK", timestamp: 0 });

      expect(ws.send).not.toHaveBeenCalled();
    });

    it("broadcast_NoClients_DoesNotThrow", () => {
      expect(() =>
        server.broadcast({ event: "GAME_TICK", timestamp: 0 }),
      ).not.toThrow();
    });
  });

  describe("message handling", () => {
    it("onMessage_ClientSendsValidJson_ParsesAndCallsHandler", () => {
      const handler = jest.fn();
      const serverWithHandler = new BridgeWsServer(mockWss as any, handler);
      const ws = new MockWebSocket();
      mockWss.emit("connection", ws, fakeReq());

      ws.emit("message", Buffer.from(JSON.stringify({ event: "TRIGGER_ANALYSIS" })));

      expect(handler).toHaveBeenCalledWith(ws, { event: "TRIGGER_ANALYSIS" });
    });

    it("onMessage_ClientSendsMalformedJson_DoesNotThrow", () => {
      const serverWithHandler = new BridgeWsServer(mockWss as any, jest.fn());
      const ws = new MockWebSocket();
      mockWss.emit("connection", ws, fakeReq());

      expect(() => {
        ws.emit("message", Buffer.from("not json {{{"));
      }).not.toThrow();
    });

    it("onMessage_NoHandlerRegistered_IgnoresMessageSilently", () => {
      const ws = new MockWebSocket();
      mockWss.emit("connection", ws, fakeReq());

      expect(() => {
        ws.emit("message", Buffer.from(JSON.stringify({ event: "SET_SUMMONER" })));
      }).not.toThrow();
    });

    it("onMessage_SetSummonerMessage_PassesParsedObjectToHandler", () => {
      const handler = jest.fn();
      const serverWithHandler = new BridgeWsServer(mockWss as any, handler);
      const ws = new MockWebSocket();
      mockWss.emit("connection", ws, fakeReq());
      const msg = { event: "SET_SUMMONER", summonerName: "Faker" };

      ws.emit("message", Buffer.from(JSON.stringify(msg)));

      expect(handler).toHaveBeenCalledWith(ws, msg);
    });
  });

  describe("close", () => {
    it("close_Called_DelegatesToUnderlyingWss", () => {
      server.close();

      expect(mockWss.close).toHaveBeenCalledTimes(1);
    });
  });
});
