# GEMINI.md

Gemini-specific guidance for this repository.
For project architecture, conventions, and runbook see `AGENTS.md` first.

---

## Model Defaults

- Prefer Gemini 2.5 Pro for complex reasoning and code generation
- Use streaming for responses with large output

## Notes

- The bridge supports Gemini via `@google/genai` — see `bridge/src/providers/geminiProvider.ts`
- Do not swap `@google/generative-ai` for `@google/genai` or vice versa without checking the import surface
