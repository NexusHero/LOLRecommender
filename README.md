# LoL Coach

An AI-powered in-game coaching assistant for League of Legends. A local Node.js bridge reads live game data from the Riot Games Live Client API and streams real-time recommendations to a Flutter mobile app over WebSocket.

The coaching engine combines a rule-based heuristic (zero latency, no internet) with an optional LLM layer (Claude, OpenAI, or Gemini) that produces role-aware, matchup-specific advice — not generic tips.

---

## What it does

- **Role-aware strategy** — advice adapts to your role. A support gets vision-score feedback and ADC-protection cues; a Tryndamere top gets split-push timing, not "group for teamfights".
- **Lane matchup analysis** — compares your CS, KDA, level and items against your specific lane opponent in real time.
- **Concrete counter-play** — one actionable sentence: what to do *right now* against this specific champion.
- **Counter-item recommendations** — flags Grievous Wounds, Banshee's Veil, QSS, or Randuin's based on the enemy composition across all 170+ champions.
- **Multi-provider AI** — plug in your own Claude, OpenAI, or Gemini API key, or run heuristic-only with no key required.
- **Trigger on events** — recommendations fire on `GAME_STARTED`, `ITEM_PURCHASED`, `PLAYER_DIED`, and on manual request via the in-app FAB.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Your PC (in-game)                    │
│                                                          │
│  LoL Client  ──►  Riot Live Client API (port 2999)       │
│                            │                             │
│                            ▼                             │
│              Node.js Bridge (TypeScript)                 │
│          ┌─────────────────────────────────┐             │
│          │  Poller → Parser → EventDetector│             │
│          │  Heuristic Engine               │             │
│          │  StateMinifier                  │             │
│          │  LLM Provider (Claude/OpenAI/..)│             │
│          │  WebSocket Server (port 8765)   │             │
│          └─────────────────────────────────┘             │
└──────────────────────────────────────────────────────────┘
                            │  WebSocket (LAN)
                            ▼
              ┌─────────────────────────┐
              │   Flutter Mobile App    │
              │  Live scoreboard        │
              │  Counter-item picks     │
              │  Lane matchup analysis  │
              │  Role-specific strategy │
              │  Settings & Connection  │
              └─────────────────────────┘
```

| Component | Tech |
|-----------|------|
| Bridge | Node.js 18+, TypeScript, Zod, ws, @anthropic-ai/sdk, openai, @google/genai |
| Mobile app | Flutter 3.x, Dart, Provider, web_socket_channel, shared_preferences |
| Tests | Jest + ts-jest (bridge), flutter_test (app) |

---

## Prerequisites

- Node.js 18+
- Flutter SDK 3.4+
- League of Legends installed (the bridge reads from the local Live Client API)

---

## Setup

### 1. Bridge

```bash
cd bridge
npm install
```

Start the bridge:
```bash
npm run dev        # development (watch mode)
npm start          # production (requires npm run build first)
```

The bridge waits for an active game. Once detected it starts pushing game state and recommendations over WebSocket.

### 2. Flutter app

```bash
cd flutter_app
flutter pub get
flutter run
```

In the **Settings** tab configure:
- Your Summoner Name
- The Bridge IP and Port (default `127.0.0.1:8765`)
- Your LLM Provider (None, Claude, OpenAI, or Gemini) and API Key

Settings are persisted locally via `shared_preferences`. Once connected the app switches to the **Coach** tab automatically.

---

## How it works

1. **Polling** — The bridge polls `https://127.0.0.1:2999/liveclientdata/allgamedata` every second.
2. **Event detection** — `EventDetector` compares consecutive snapshots and emits typed events.
3. **Heuristic recommendations** — On each trigger event, `buildCompProfile` analyses the enemy team across 170+ categorised champions and recommends counter-items instantly.
4. **State minification** — Before calling the LLM, `StateMinifier` distils the game snapshot to CS, vision score, KDA, position, gold and live status for every player — minimising token cost while keeping all coaching-relevant data.
5. **Role-aware LLM analysis** — The LLM receives the minified state, the player's role, their lane opponent's stats, and role-specific instructions. It returns a structured JSON with `winCondition`, `immediateAction`, `lateGamePlan`, `laneMatchupAnalysis` and `counterPlay`.
6. **WebSocket broadcast** — Events and recommendations are pushed to all connected Flutter clients as JSON.

---

## Project structure

```
lolclient/
├── bridge/                   # Backend (Node.js/TypeScript)
│   ├── src/
│   │   ├── types.ts          # Zod schemas + TypeScript types
│   │   ├── poller.ts         # Live Client API polling
│   │   ├── parser.ts         # Raw data → ParsedGameState
│   │   ├── eventDetector.ts  # State-change event detection
│   │   ├── stateMinifier.ts  # Token optimisation for LLM
│   │   ├── heuristic.ts      # Rule-based item recommendations
│   │   ├── llmProvider.ts    # AI factory + prompt builder
│   │   ├── orchestrator.ts   # Wires events → recommendations → broadcast
│   │   ├── wsServer.ts       # WebSocket server
│   │   ├── data/
│   │   │   ├── champions.json  # AP / CC / healer classification (~170 champs)
│   │   │   └── items.json      # Item ID → name mapping
│   │   └── index.ts          # Entry point / DI wiring
│   └── src/__tests__/        # Jest unit + integration + E2E tests
│
├── flutter_app/              # UI (Flutter)
│   ├── lib/
│   │   ├── models/           # Data models (Strategy, ItemRecommendation, …)
│   │   ├── services/         # WsService (ChangeNotifier)
│   │   ├── screens/          # MainScreen, HomeScreen (Coach tab)
│   │   └── widgets/          # RecommendationPanel, GameView, ConnectionForm
│   └── test/                 # Widget, unit and golden tests
│
└── deployment/               # Build & packaging scripts
    ├── build_unix.sh         # macOS + Linux build script
    └── build_installer.ps1   # Windows MSIX build script
```

---

## Running tests

### All-in-one script (`test.sh`)

```bash
./test.sh                    # bridge + flutter (goldens excluded)
./test.sh --coverage         # bridge tests with coverage report
./test.sh --goldens          # include flutter golden pixel tests
./test.sh --update-goldens   # regenerate golden baselines, then run all
./test.sh --bridge-only      # skip flutter
./test.sh --flutter-only     # skip bridge
./test.sh --watch            # jest watch mode (flutter skipped)
```


#### Mutation testing (Stryker)

```bash
cd bridge
npx stryker run
# Report: bridge/reports/mutation/report.html
```

### Flutter only

```bash
cd flutter_app
flutter test                                              # unit + widget tests
flutter test --update-goldens test/widgets/recommendation_panel_golden_test.dart
                                                          # regenerate golden baselines
```

> **Golden tests** require a baseline PNG committed under `flutter_app/test/goldens/`.
> Run `--update-goldens` once and commit the generated files before golden tests will pass.

---

## License

MIT
