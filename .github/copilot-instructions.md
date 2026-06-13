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

