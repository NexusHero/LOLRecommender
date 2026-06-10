# CLAUDE.md

Claude-specific guidance for this repository.
For project architecture, conventions, and runbook see `AGENTS.md` first.

---

## Model & API Defaults

- Default model: `claude-opus-4-8`
- Use `thinking: {type: "adaptive"}` for anything non-trivial
- Use `effort: "xhigh"` for coding and agentic tasks
- Do **not** pass `thinking: {type: "disabled"}` — omit the param instead (returns 400 on current models)
- Do **not** use `budget_tokens` in new code — use adaptive thinking

## Skills

Project slash commands live in `.claude/commands/`. Add new commands there to share workflows with the team.

## Style Preferences

- No trailing summaries at end of responses — the diff is readable
- Terse, direct answers preferred
- No co-author lines in commits unless explicitly requested

## Commits & Tests

Conventions are defined in `AGENTS.md` → **Commit Messages** and **Test Naming & Structure**.
Apply them automatically — do not wait to be asked:
- All commits: Conventional Commits format, English
- All tests: Microsoft naming (`Subject_State_Expected`) + AAA pattern
