# GitHub Copilot Instructions

For project architecture, conventions, and runbook see `AGENTS.md` first.

---

## Code Completion Preferences

- TypeScript `strict: true` — always infer the narrowest type; never suggest `any`
- Zod schemas live in `core/src/types.ts` — reuse them, do not duplicate validation logic
- For new core modules, follow the existing pattern: pure functions, no side effects in constructors
- For Flutter widgets, use `Provider` for state — do not introduce new state management patterns

## What Not to Suggest

- Do not suggest replacing `@yao-pkg/pkg` with `pkg`
- Do not suggest upgrading Zod to v4 (breaking changes not yet evaluated)
- Do not suggest `budget_tokens` in LLM calls — use adaptive thinking instead
- Do not add `console.log` for debugging — use the existing logger pattern

## Test Suggestions

- New core logic → add a Jest test in `core/src/__tests__/`
- New Flutter widget → add a widget test in `app/test/`
- Do not mock the Riot API HTTP layer — use `src/mock-lol-server.ts`

---

## Pull Request Review

When reviewing a pull request, analyze the diff against the rules below and
flag concrete, actionable issues. Prefer a few high-confidence findings over a
long list of nits. Reference `file:line` and suggest a fix.

### Correctness

- Verify Zod schemas in `core/src/types.ts` are reused — flag duplicated or
  hand-rolled validation that bypasses an existing schema.
- Flag any new `any`, non-null assertions, or widened types in `strict` code.
- Check event/wire-protocol changes against `bridge/asyncapi.yml`: any new or
  renamed field on a WS message must be reflected in the AsyncAPI spec and the
  Flutter model that decodes it.
- For poller/orchestrator changes, confirm failure paths still respect the
  retry/cooldown constants (`MAX_POLL_FAILURES`, `DEFAULT_LLM_COOLDOWN_MS`).

### Security

- The bridge must stay bound to `127.0.0.1`; flag any bind to `0.0.0.0` or a
  public interface.
- API keys belong in `flutter_secure_storage`, never `shared_preferences`,
  logs, or commits.
- Flag disabled TLS/cert validation that is not behind the existing loopback
  guard.

### Tests & CI

- Every behavioral change should land with a matching test (Jest for core,
  widget/golden test for Flutter). Flag PRs that change logic without tests.
- Golden-test image updates must be intentional — flag baseline changes that
  accompany unrelated logic edits.

### Style & Conventions

- Commit titles must follow Conventional Commits (`feat`, `fix`, `chore`, …).
- Flutter code must satisfy `very_good_analysis` (80-char lines, trailing
  commas).
- Do not approve changes that reintroduce anything from the "What Not to
  Suggest" list above.

### Out of Scope (do not flag)

- The `@yao-pkg/pkg` bin alias staying named `pkg`.
- Zod remaining on v3 and TypeScript on ~5.8.
- Champion/item data edits in `bridge/src/data/*.json` (data, not code).

