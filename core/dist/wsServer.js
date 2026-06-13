"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BridgeWsServer = void 0;
const ws_1 = require("ws");
class BridgeWsServer {
    wss;
    onMessage;
    clients = new Set();
    constructor(wss, onMessage) {
        this.wss = wss;
        this.onMessage = onMessage;
        this.setupHandlers();
    }
    setupHandlers() {
        this.wss.on("listening", () => {
            const addr = this.wss.address();
            const port = typeof addr === "object" && addr ? addr.port : "?";
            console.log(`[WS] Server listening on ws://0.0.0.0:${port}`);
        });
        this.wss.on("connection", (ws, req) => {
            const ip = req.socket.remoteAddress ?? "unbekannt";
            console.log(`[WS] Client connected: ${ip} (${this.clients.size + 1} total)`);
            this.clients.add(ws);
            ws.on("message", (data) => {
                try {
                    const parsed = JSON.parse(data.toString());
                    if (this.onMessage) {
                        this.onMessage(ws, parsed);
                    }
                }
                catch (err) {
                    console.warn(`[WS] Failed to parse message from ${ip}`, err);
                }
            });
            ws.on("close", () => {
                this.clients.delete(ws);
                console.log(`[WS] Client disconnected: ${ip} (${this.clients.size} remaining)`);
            });
            ws.on("error", (err) => {
                console.error(`[WS] Client error (${ip}):`, err.message);
                this.clients.delete(ws);
            });
            this.sendTo(ws, { event: "CONNECTED", timestamp: Date.now() });
        });
        this.wss.on("error", (err) => {
            console.error("[WS] Server error:", err);
        });
    }
    broadcast(message) {
        if (this.clients.size === 0)
            return;
        const payload = JSON.stringify(message);
        for (const client of this.clients) {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(payload);
            }
        }
    }
    sendTo(ws, message) {
        if (ws.readyState === ws_1.WebSocket.OPEN) {
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
exports.BridgeWsServer = BridgeWsServer;
