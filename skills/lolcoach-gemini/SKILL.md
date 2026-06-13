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

## Notes

- The core backend supports Gemini via `@google/genai` — see `core/src/providers/geminiProvider.ts`
- Do not swap `@google/generative-ai` for `@google/genai` or vice versa without checking the import surface
