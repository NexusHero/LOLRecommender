# AGENTS.md

Vendor-neutral context for AI assistants working on this repository.
Claude → also read `CLAUDE.md`. Gemini → also read `GEMINI.md`.

---

## Purpose

LoL Coach is a real-time in-game coaching assistant for League of Legends.
A local Node.js bridge reads live game data from the Riot Live Client API and streams recommendations to a Flutter desktop app over WebSocket.
The coaching engine combines a zero-latency rule-based heuristic with an optional LLM layer (Claude, OpenAI, or Gemini) for role-aware, matchup-specific advice.

---

## Architecture

```
Riot Live Client API (port 2999, self-signed TLS)
        │
        ▼
Node.js Bridge  (TypeScript, port 8765 WebSocket out)
  Poller → Parser → EventDetector
  Heuristic Engine
  StateMinifier
  LLM Provider (Claude / OpenAI / Gemini)
  WebSocket Server
        │  WebSocket (LAN)
        ▼
Flutter Desktop App  (macOS / Windows / Linux)
  Coach tab  ·  Settings tab  ·  Connection form
```

| Component | Tech |
|-----------|------|
| Bridge | Node.js 18+, TypeScript ~5.8 strict, Zod v3, ws, Jest 29 + ts-jest 29 |
| Flutter app | Flutter 3.x, Dart, Provider, web_socket_channel, flutter_secure_storage |
| Wire protocol | `bridge/asyncapi.yml` |

---

## Key Files

| File | Role |
|------|------|
| `bridge/src/index.ts` | Entry point — DI wiring, `DEFAULT_LLM_COOLDOWN_MS` |
| `bridge/src/orchestrator.ts` | Wires events → recommendations → broadcast |
| `bridge/src/eventDetector.ts` | Emits typed events; exports `HIGH_GOLD_THRESHOLD = 1000` |
| `bridge/src/poller.ts` | Polls Riot API every second; exports `MAX_POLL_FAILURES = 3` |
| `bridge/src/heuristic.ts` | Rule-based counter-item logic; reads from `src/data/*.json` |
| `bridge/src/llmProvider.ts` | AI factory + prompt builder |
| `bridge/src/stateMinifier.ts` | Reduces game snapshot to coaching-relevant fields before LLM call |
| `bridge/src/data/champions.json` | AP/CC/healer classification (~170 champs) — update without code change |
| `bridge/src/data/items.json` | Item ID → name mapping — update without code change |
| `flutter_app/lib/services/ws_service.dart` | WebSocket client with exponential-backoff reconnect |
| `flutter_app/lib/widgets/game_top_bar.dart` | Extracted top bar widget |

---

## Domain Knowledge

- **Riot Live Client API** runs on `https://127.0.0.1:2999`. It uses a self-signed certificate — HTTP requests must disable TLS verification. The endpoint is `GET /liveclientdata/allgamedata`.
- **Event triggers** for recommendations: `GAME_STARTED`, `ITEM_PURCHASED`, `PLAYER_DIED`, manual FAB press.
- **Champion/item data** lives in JSON files, not in code — update them to add new champions or items without touching logic.
- **StateMinifier** exists for a reason: LLM calls use minified state to minimise token cost while retaining all coaching signals.

---

## Conventions

- TypeScript `strict: true` — no implicit `any`, full null checks.
- Zod stays on **v3** (v4 has breaking changes not worth migrating).
- `HIGH_GOLD_THRESHOLD` and `MAX_POLL_FAILURES` are exported constants — import them, do not hardcode their values.
- API keys are stored via `flutter_secure_storage`. Non-sensitive preferences use `shared_preferences`. Never swap these roles.
- `@yao-pkg/pkg` is the packager (`pkg` alias in scripts) — do not replace with the original `pkg`.
- LLM cooldown default is 7 minutes (`DEFAULT_LLM_COOLDOWN_MS`).

---

## Quality Gates

A change is considered done when:
- `npm test` passes in `bridge/` (91 tests, 12 suites)
- `flutter test` passes in `flutter_app/` (golden tests excluded unless baselines are updated)
- TypeScript compiles without errors (`tsc --noEmit`)
- No new `any` types introduced
- New logic is covered by at least one test

---

## Testing Strategy

- **Bridge**: Jest unit + integration tests. Do not mock the WebSocket server or the Riot API HTTP layer — use the mock Live Client server (`src/mock-lol-server.ts`) instead.
- **Flutter**: widget tests + golden pixel tests. Goldens require committed baseline PNGs under `flutter_app/test/goldens/`; run `--update-goldens` and commit before they will pass.
- **Mutation testing**: `npx stryker run` inside `bridge/` — report at `bridge/reports/mutation/report.html`.

---

## Security Rules

- No secrets or API keys in source files or committed `.env` files.
- Input from the Riot API and from WebSocket clients must be validated with Zod before use.
- TLS verification is intentionally disabled only for the local Riot endpoint (localhost).
- Dependency additions require explicit justification — prefer the already-vendored SDKs.

---

## Error Handling

- Bridge errors propagate via thrown exceptions; the orchestrator catches and logs them without crashing the process.
- Flutter errors surface in the UI via `WsService` state — do not swallow errors silently.
- Log at `error` level for unexpected failures, `warn` for recoverable degradations (e.g., LLM timeout → fallback to heuristic).

---

## Runbook

```bash
# Bridge — development
cd bridge && npm install && npm run dev

# Bridge — production
cd bridge && npm run build && npm start

# Bridge — tests
cd bridge && npm test

# Flutter — development
cd flutter_app && flutter pub get && flutter run

# Flutter — tests
cd flutter_app && flutter test

# All tests (bridge + flutter, goldens excluded)
./test.sh
```

---

## External References

- Riot Live Client API: https://developer.riotgames.com/docs/lol#league-client-update_live-client-data-api
- AsyncAPI wire protocol: `bridge/asyncapi.yml`
