"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveClientPoller = exports.MAX_POLL_FAILURES = void 0;
exports.isLocalhostUrl = isLocalhostUrl;
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const types_js_1 = require("./types.js");
const config_js_1 = require("./config.js");
const logger_js_1 = require("./logger.js");
const POLL_INTERVAL_MS = 1000;
// Number of consecutive fetch failures before signalling GAME_INACTIVE.
// Transient network spikes (e.g. brief API hiccup) will not flip the state.
exports.MAX_POLL_FAILURES = config_js_1.config.riot.maxPollFailures;
function isLocalhostUrl(url) {
    try {
        const { hostname } = new URL(url);
        return hostname === "127.0.0.1" || hostname === "localhost";
    }
    catch {
        return false;
    }
}
// Supports both https:// (real Riot API, self-signed cert accepted) and
// http:// (local mock-lol-server for development).
// URL is read lazily so LIVE_CLIENT_URL env var set after module load is picked up.
function createDefaultFetcher() {
    const url = config_js_1.config.riot.liveClientUrl;
    const isHttps = url.startsWith("https://");
    const lib = isHttps ? https_1.default : http_1.default;
    // Riot's Live Client API (127.0.0.1:2999) uses a self-signed cert from their
    // internal CA. Validation is skipped only for loopback addresses where MITM
    // is impossible — any non-localhost HTTPS target uses standard validation.
    const agent = isHttps && isLocalhostUrl(url)
        ? new https_1.default.Agent({ rejectUnauthorized: false })
        : undefined;
    return () => new Promise((resolve, reject) => {
        const req = lib.get(url, { agent }, (res) => {
            let body = "";
            res.on("data", (chunk) => (body += chunk.toString()));
            res.on("end", () => {
                try {
                    resolve(JSON.parse(body));
                }
                catch {
                    reject(new Error("JSON parse error"));
                }
            });
        });
        req.on("error", reject);
        req.setTimeout(2000, () => {
            req.destroy();
            reject(new Error("Request timeout"));
        });
    });
}
class LiveClientPoller {
    onData;
    onStatusChange;
    fetcher;
    intervalId = null;
    gameActive = false;
    consecutiveFailures = 0;
    constructor(onData, onStatusChange, fetcher = createDefaultFetcher()) {
        this.onData = onData;
        this.onStatusChange = onStatusChange;
        this.fetcher = fetcher;
    }
    start() {
        logger_js_1.Logger.info("[Poller] Started — waiting for active game...");
        this.poll();
        this.intervalId = setInterval(() => this.poll(), POLL_INTERVAL_MS);
    }
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    async poll() {
        try {
            const raw = await this.fetcher();
            const parsed = types_js_1.AllGameDataSchema.safeParse(raw);
            if (!parsed.success) {
                logger_js_1.Logger.warn("[Poller] Unexpected data format:", parsed.error.issues[0]);
                return;
            }
            this.consecutiveFailures = 0;
            if (!this.gameActive) {
                this.gameActive = true;
                logger_js_1.Logger.info("[Poller] Game detected — data flowing.");
                this.onStatusChange(true);
            }
            this.onData(parsed.data);
        }
        catch {
            this.consecutiveFailures++;
            if (this.gameActive && this.consecutiveFailures >= exports.MAX_POLL_FAILURES) {
                this.gameActive = false;
                this.consecutiveFailures = 0;
                logger_js_1.Logger.info("[Poller] No active game — waiting...");
                this.onStatusChange(false);
            }
        }
    }
}
exports.LiveClientPoller = LiveClientPoller;
