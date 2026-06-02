import { EventEmitter } from "events";
import { WebSocket } from "ws";
import { BridgeWsServer } from "../wsServer";
import type { WsMessage } from "../types";

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
    it("increments clientCount on connection", () => {
      mockWss.emit("connection", new MockWebSocket(), fakeReq());

      expect(server.clientCount).toBe(1);
    });

    it("decrements clientCount on close", () => {
      const ws = new MockWebSocket();
      mockWss.emit("connection", ws, fakeReq());
      ws.emit("close");

      expect(server.clientCount).toBe(0);
    });

    it("decrements clientCount on error", () => {
      const ws = new MockWebSocket();
      mockWss.emit("connection", ws, fakeReq());
      ws.emit("error", new Error("test"));

      expect(server.clientCount).toBe(0);
    });

    it("sends CONNECTED message on new connection", () => {
      const ws = new MockWebSocket();
      mockWss.emit("connection", ws, fakeReq());

      expect(ws.send).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(ws.send.mock.calls[0][0] as string);
      expect(payload.event).toBe("CONNECTED");
    });
  });

  describe("broadcast", () => {
    it("sends message to all open clients", () => {
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

    it("does not send to clients with non-OPEN readyState", () => {
      const ws = new MockWebSocket();
      mockWss.emit("connection", ws, fakeReq());
      ws.readyState = WebSocket.CLOSED;
      ws.send.mockClear();

      server.broadcast({ event: "GAME_TICK", timestamp: 0 });

      expect(ws.send).not.toHaveBeenCalled();
    });

    it("is a no-op when there are no clients", () => {
      expect(() =>
        server.broadcast({ event: "GAME_TICK", timestamp: 0 })
      ).not.toThrow();
    });
  });

  describe("close", () => {
    it("delegates to the underlying WebSocketServer", () => {
      server.close();

      expect(mockWss.close).toHaveBeenCalledTimes(1);
    });
  });
});
