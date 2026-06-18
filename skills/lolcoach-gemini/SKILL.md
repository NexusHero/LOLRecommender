---
name: lolcoach-gemini
description: Gemini-specific guidance for the LoL Coach repository.
---
# LoL Coach Gemini Skill

Gemini-specific guidance for this repository.
For project architecture, conventions, and runbook see the `lolcoach-agents` skill first.

---

## Model Defaults

- Prefer Gemini 2.5 Pro for complex reasoning and code generation
- Use streaming for responses with large output

## Pull Requests

Every change ships through a PR — see `lolcoach-agents` skill → **Pull Request Workflow**.
Branch from `master`, never commit straight to it, and treat the task as done only once the PR is mergeable: all CI checks green, all Quality Gates met, all review comments resolved. CI builds the committed tree, not your working copy, so `git add` every file the code depends on (no untracked sources).

## Notes

- The core backend supports Gemini via `@google/genai` — see `core/src/providers/geminiProvider.ts`
- Do not swap `@google/generative-ai` for `@google/genai` or vice versa without checking the import surface
