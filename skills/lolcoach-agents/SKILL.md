---
name: lolcoach-agents
description: Vendor-neutral context and rules for AI assistants working on the LoL Coach repository.
---
# LoL Coach Agents Skill

Vendor-neutral context for AI assistants working on this repository.
Claude → also read the `lolcoach-claude` skill. Gemini → also read the `lolcoach-gemini` skill.

---

## Purpose

LoL Coach is a real-time in-game coaching assistant for League of Legends.
A local Node.js core backend reads live game data from the Riot Live Client API and streams recommendations to a Flutter desktop app over WebSocket.
The coaching engine combines a zero-latency rule-based heuristic with an optional LLM layer (Claude, OpenAI, or Gemini) for role-aware, matchup-specific advice.

---

## Architecture

```
Riot Live Client API (port 2999, self-signed TLS)
        │
        ▼
Node.js Core  (TypeScript, port 8765 WebSocket out)
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
| Core | Node.js 18+, TypeScript ~5.8 strict, Zod v3, ws, tsyringe (DI), Jest 29 + ts-jest 29 |
| App (UI) | Flutter 3.x, Dart, flutter_riverpod (DI/state), web_socket_channel, flutter_secure_storage |
| Wire protocol | `core/asyncapi.yml` |

---

## Key Files

| File | Role |
|------|------|
| `core/src/index.ts` | Composition root — registers tokens + `container.resolve()`s the tsyringe DI graph, `DEFAULT_LLM_COOLDOWN_MS` |
| `core/src/tokens.ts` | tsyringe injection tokens for non-class deps (config, nullable `LlmProvider`, `WebSocketServer`, clock) |
| `core/src/orchestrator.ts` | Wires events → recommendations → broadcast (singleton, `@inject()`-decorated) |
| `app/lib/providers.dart` | Riverpod provider definitions (`storageServiceProvider`, `coachServiceProvider`, etc.) — services stay plain `ChangeNotifier`s, riverpod only manages construction/lifecycle |
| `core/src/eventDetector.ts` | Emits typed events; exports `HIGH_GOLD_THRESHOLD = 1000` |
| `core/src/poller.ts` | Polls Riot API every second; exports `MAX_POLL_FAILURES = 3` |
| `core/src/heuristic.ts` | Rule-based counter-item logic; reads from `src/data/*.json` |
| `core/src/llmProvider.ts` | AI factory + prompt builder |
| `core/src/stateMinifier.ts` | Reduces game snapshot to coaching-relevant fields before LLM call |
| `core/src/data/champions.json` | AP/CC/healer classification (~170 champs) — update without code change |
| `core/src/data/items.json` | Item ID → name mapping — update without code change |
| `app/lib/services/ws_service.dart` | WebSocket client with exponential-backoff reconnect |
| `app/lib/widgets/game_top_bar.dart` | Extracted top bar widget |

---

## DI Frameworks — tsyringe (core) / riverpod (app)

Both sides use constructor injection through a real container, not hand-rolled wiring. Three non-obvious gotchas, found the hard way — don't rediscover them:

- **tsyringe + `null` via `useValue` is broken.** `isValueProvider` checks `provider.useValue != undefined`, and `null != undefined` is `false` in JS — so `container.register(TOKEN, { useValue: null })` silently mis-registers as a class provider and throws `TypeInfo not known for "undefined"` at resolve time. Use `{ useFactory: () => null }` instead for any token whose value can legitimately be `null` (see `LLM_PROVIDER_TOKEN` in `index.ts`).
- **`tsx`/esbuild (the `npm run dev` / `npm run mock-lol` runner) does not emit `design:paramtypes` metadata**, even though `tsc`/`ts-jest` do. Any constructor param relying on *implicit* type-based resolution (no explicit `@inject()`) silently resolves to `undefined` under `tsx` while working fine under Jest — a passing test suite does not prove the real dev-mode process works. Every constructor param in this codebase is explicitly `@inject()`'d for this reason, even class-typed ones (see `orchestrator.ts`). Always smoke-test DI changes by actually running `npx tsx src/index.ts`, not just `npm test`.
- **tsyringe registrations are Transient by default.** `container.resolve(X)` builds a fresh dependency graph every call — if `BridgeWsServer` isn't `@singleton()`, three separate `container.resolve()` calls (`wsServer`, `orchestrator`, `messageRouter`) each construct their own independent `BridgeWsServer` instance wrapping the same underlying socket, all attaching duplicate `"connection"` listeners (visible as duplicate `CONNECTED` messages to one client). Every class actually resolved through the container in `index.ts` (`EventDetector`, `RecommendationEngine`, `BridgeWsServer`, `BridgeOrchestrator`, `MessageRouter`) is `@singleton()`, not `@injectable()`.
- **`BridgeWsServer` ↔ `MessageRouter` is a genuine constructor cycle** (router needs orchestrator, orchestrator needs wsServer, wsServer needs to call the router on incoming messages). No DI container resolves a true cycle — it's broken via method injection: `BridgeWsServer.setMessageHandler()` is called once, after both are resolved, in `index.ts`.
- **`flutter_riverpod` has no `ChangeNotifierProvider`** (removed/never shipped in modern riverpod). Services stay plain `ChangeNotifier`s; riverpod's plain `Provider` only manages construction + disposal. Widgets that need to rebuild on internal `notifyListeners()` calls must wrap with Flutter's own `ListenableBuilder(listenable: ref.watch(xProvider), builder: ...)` — riverpod's `ref.watch` alone won't trigger a rebuild since the provider's *value* (the instance) never changes.

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

### Commit Messages

All commit messages must follow **Conventional Commits** and be written in **English**:

```
<type>(<scope>): <short summary>
```

Valid types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `perf`, `ci`, `build`.
Scopes follow the component: `core`, `app`, `deps`, `ci`, etc.

Examples:
```
feat(core): add gold-spike event detection
fix(app): resolve deprecated DropdownButtonFormField.value usage
test(core): cover poller retry behaviour with mock server
```

### Test Naming & Structure

Test names use the **Microsoft naming convention** — three segments separated by underscores:

```
MethodOrFeatureName_StateUnderTest_ExpectedBehaviour
```

Examples:
```
loadModels_WhenProviderIsNone_DoesNotEmitGetModels
BridgeModels_AppearInDropdownInsteadOfHardcoded
Poller_WhenMaxFailuresExceeded_EmitsGameInactive
```

Test bodies follow the **AAA pattern** with a blank line between each phase:

```ts
// Arrange
const ws = new WsService();

// Act
ws.loadModels('claude', 'sk-ant-test');

// Assert
expect(emitted).toEqual(['GET_MODELS']);
```

If a phase is trivially obvious (e.g., a one-liner Act with no setup), the comment may be omitted.

---

## Quality Gates

A change is considered done when:
- `npm test` passes in `core/` (20 suites)
- `flutter test` passes in `app/` (golden tests excluded unless baselines are updated)
- TypeScript compiles without errors (`tsc --noEmit`)
- No new `any` types introduced
- New logic is covered by at least one test

---

## Testing Strategy

- **Core**: Jest unit + integration tests. Do not mock the WebSocket server or the Riot API HTTP layer — use the mock Live Client server (`src/mock-lol-server.ts`) instead.
- **Flutter**: widget tests + golden pixel tests. Goldens require committed baseline PNGs under `app/test/goldens/`; run `--update-goldens` and commit before they will pass.
- **Mutation testing**: `npx stryker run` inside `core/` — report at `core/reports/mutation/report.html`.

---

## Security Rules

- No secrets or API keys in source files or committed `.env` files.
- Input from the Riot API and from WebSocket clients must be validated with Zod before use.
- TLS verification is intentionally disabled only for the local Riot endpoint (localhost); `isLocalhostUrl()` in `poller.ts` enforces this guard — do not widen it.
- Dependency additions require explicit justification — prefer the already-vendored SDKs.
- The WebSocket server binds to `127.0.0.1` only — never `0.0.0.0`; the core backend is not reachable from other machines by design.
- **Shared secret auth**: on first run, core auto-generates `~/.lolcoach/.secret` (mode 0600, 64 hex chars) via `secretManager.ts`. Flutter reads the same file and sends it as `Authorization: Bearer <secret>` on every WS upgrade; `verifyClient` rejects any connection with a missing or incorrect token. Never store or log the secret value.
- **Token budget**: `OrchestratorConfig.tokenBudget` caps cumulative session input tokens. When the running total reaches the cap, the orchestrator broadcasts `LLM_BUDGET_EXCEEDED` and skips the LLM call; the heuristic recommendation still fires. `0` (default) means unlimited. The cap resets with `resetDetector()`.

---

## Error Handling

- Core errors propagate via thrown exceptions; the orchestrator catches and logs them without crashing the process.
- Flutter errors surface in the UI via `WsService` state — do not swallow errors silently.
- Log at `error` level for unexpected failures, `warn` for recoverable degradations (e.g., LLM timeout → fallback to heuristic).

---

## Runbook

```bash
# Core — development
cd core && npm install && npm run dev

# Core — production
cd core && npm run build && npm start

# Core — tests
cd core && npm test

# Flutter App — development
cd app && flutter pub get && flutter run

# Flutter App — tests
cd app && flutter test

# All tests (core + app, goldens excluded)
./test.sh
```

---

## External References

- Riot Live Client API: https://developer.riotgames.com/docs/lol#league-client-update_live-client-data-api
- AsyncAPI wire protocol: `core/asyncapi.yml`
