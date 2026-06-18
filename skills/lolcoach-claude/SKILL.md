---
name: lolcoach-claude
description: Claude-specific guidance for the LoL Coach repository.
---
# LoL Coach Claude Skill

Claude-specific guidance for this repository.
For project architecture, conventions, and runbook see the `lolcoach-agents` skill first.

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

Conventions are defined in the `lolcoach-agents` skill → **Commit Messages** and **Test Naming & Structure**.
Apply them automatically — do not wait to be asked:
- All commits: Conventional Commits format, English
- All tests: Microsoft naming (`Subject_State_Expected`) + AAA pattern

## Pull Requests

Every change ships through a PR — see `lolcoach-agents` skill → **Pull Request Workflow**.
Branch from `master`, never commit straight to it, and treat the task as done only once the PR is mergeable: all CI checks green, all Quality Gates met, all review comments resolved. A green local run is not enough — CI builds the committed tree, so `git add` every file the code depends on (no untracked sources).
