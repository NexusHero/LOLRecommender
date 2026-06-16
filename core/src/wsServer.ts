import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import { inject, singleton } from "tsyringe";
import type { WsMessage } from "./types.js";
import { Logger } from "./logger.js";
import { WSS_TOKEN } from "./tokens.js";

@singleton()
export class BridgeWsServer {
  private clients = new Set<WebSocket>();
  private onMessage?: (ws: WebSocket, message: any) => void;

  constructor(@inject(WSS_TOKEN) private readonly wss: WebSocketServer) {
    this.setupHandlers();
  }

  /**
   * BridgeWsServer <-> MessageRouter is a genuine constructor cycle (the
   * router needs the orchestrator, which needs this wsServer). Set after
   * construction by the composition root instead of via constructor param.
   */
  setMessageHandler(handler: (ws: WebSocket, message: any) => void): void {
    this.onMessage = handler;
  }

  private setupHandlers() {
    this.wss.on("listening", () => {
      const addr = this.wss.address();
      const port = typeof addr === "object" && addr ? addr.port : "?";
      Logger.info(`[WS] Server listening on ws://0.0.0.0:${port}`);
    });

    this.wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
      const ip = req.socket.remoteAddress ?? "unbekannt";
      Logger.info(`[WS] Client connected: ${ip} (${this.clients.size + 1} total)`);
      this.clients.add(ws);

      ws.on("message", (data: Buffer) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (this.onMessage) {
            this.onMessage(ws, parsed);
          }
        } catch (err) {
          Logger.warn(`[WS] Failed to parse message from ${ip}`, err);
        }
      });

      ws.on("close", () => {
        this.clients.delete(ws);
        Logger.info(`[WS] Client disconnected: ${ip} (${this.clients.size} remaining)`);
      });

      ws.on("error", (err: Error) => {
        Logger.error(`[WS] Client error (${ip}):`, err.message);
        this.clients.delete(ws);
      });

      this.sendTo(ws, { event: "CONNECTED", timestamp: Date.now() });
    });

    this.wss.on("error", (err: Error) => {
      Logger.error("[WS] Server error:", err);
    });
  }

  broadcast(message: WsMessage) {
    if (this.clients.size === 0) return;
    const payload = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  private sendTo(ws: WebSocket, message: WsMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  get clientCount() {
    return this.clients.size;
  }

  close() {
    this.wss.close();
  }
}
