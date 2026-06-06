import https from "https";
import { AllGameDataSchema, type AllGameData } from "./types.js";

const LIVE_CLIENT_URL = "https://127.0.0.1:2999/liveclientdata/allgamedata";
const POLL_INTERVAL_MS = 1000;

// Number of consecutive fetch failures before signalling GAME_INACTIVE.
// Transient network spikes (e.g. brief API hiccup) will not flip the state.
export const MAX_POLL_FAILURES = 3;

export type DataFetcher = () => Promise<unknown>;

// Self-signed Cert der Live Client API ignorieren
function createDefaultFetcher(): DataFetcher {
  const agent = new https.Agent({ rejectUnauthorized: false });
  return () =>
    new Promise((resolve, reject) => {
      const req = https.get(LIVE_CLIENT_URL, { agent }, (res) => {
        let body = "";
        res.on("data", (chunk: Buffer) => (body += chunk.toString()));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch {
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

export type PollCallback = (data: AllGameData) => void;
export type StatusCallback = (active: boolean) => void;

export class LiveClientPoller {
  private intervalId: NodeJS.Timeout | null = null;
  private gameActive = false;
  private consecutiveFailures = 0;

  constructor(
    private readonly onData: PollCallback,
    private readonly onStatusChange: StatusCallback,
    private readonly fetcher: DataFetcher = createDefaultFetcher(),
  ) {}

  start() {
    console.log("[Poller] Started — waiting for active game...");
    this.poll();
    this.intervalId = setInterval(() => this.poll(), POLL_INTERVAL_MS);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async poll() {
    try {
      const raw = await this.fetcher();
      const parsed = AllGameDataSchema.safeParse(raw);

      if (!parsed.success) {
        console.warn("[Poller] Unexpected data format:", parsed.error.issues[0]);
        return;
      }

      this.consecutiveFailures = 0;

      if (!this.gameActive) {
        this.gameActive = true;
        console.log("[Poller] Game detected — data flowing.");
        this.onStatusChange(true);
      }

      this.onData(parsed.data);
    } catch {
      this.consecutiveFailures++;

      if (this.gameActive && this.consecutiveFailures >= MAX_POLL_FAILURES) {
        this.gameActive = false;
        this.consecutiveFailures = 0;
        console.log("[Poller] No active game — waiting...");
        this.onStatusChange(false);
      }
    }
  }
}
