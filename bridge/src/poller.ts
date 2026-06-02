import https from "https";
import { AllGameDataSchema, type AllGameData } from "./types.js";

const LIVE_CLIENT_URL = "https://127.0.0.1:2999/liveclientdata/allgamedata";
const POLL_INTERVAL_MS = 1000;

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

type PollCallback = (data: AllGameData) => void;
type StatusCallback = (active: boolean) => void;

export class LiveClientPoller {
  private intervalId: NodeJS.Timeout | null = null;
  private gameActive = false;

  constructor(
    private readonly onData: PollCallback,
    private readonly onStatusChange: StatusCallback,
    private readonly fetcher: DataFetcher = createDefaultFetcher(),
  ) {}

  start() {
    console.log("[Poller] Gestartet — warte auf aktives Spiel...");
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
        console.warn("[Poller] Unbekanntes Datenformat:", parsed.error.issues[0]);
        return;
      }

      if (!this.gameActive) {
        this.gameActive = true;
        console.log("[Poller] Spiel erkannt — Daten fliessen.");
        this.onStatusChange(true);
      }

      this.onData(parsed.data);
    } catch {
      if (this.gameActive) {
        this.gameActive = false;
        console.log("[Poller] Kein Spiel aktiv — Warte...");
        this.onStatusChange(false);
      }
    }
  }
}
