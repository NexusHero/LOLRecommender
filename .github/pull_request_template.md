<!--
Thanks for contributing to LoL Coach!
Keep the PR focused — one logical change per PR. Fill in the sections below.
-->

## Summary

<!-- What does this PR do, and why? Link the issue it closes. -->

Closes #

## Type of change

<!-- Tick all that apply. Matches the Conventional Commit type used in your commits. -->

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `docs` — documentation only
- [ ] `test` — adding or fixing tests
- [ ] `refactor` — no behaviour change
- [ ] `chore` / `ci` / `build` — tooling, deps, pipeline

## How was this tested?

<!-- Commands run, scenarios covered, manual verification. -->

## Checklist

- [ ] `./test.sh` passes locally (core Jest + `flutter analyze` + `flutter test`)
- [ ] New logic is covered by at least one test
- [ ] Commits follow [Conventional Commits](https://www.conventionalcommits.org) in English — `type(scope): summary`
- [ ] New tests use the `Subject_StateUnderTest_ExpectedBehaviour` naming convention (AAA structure)
- [ ] No new `any` types; TypeScript compiles (`tsc --noEmit`) and no API keys / personal data committed
- [ ] Every source file the change depends on is committed — `git status` shows no needed file untracked
- [ ] Docs updated where behaviour, a building block, or a runtime flow changed (`docs/architecture.md` + the relevant `docs/umls/*.puml` re-rendered to `.svg`)
- [ ] I have read and agree to abide by the [Code of Conduct](../CODE_OF_CONDUCT.md)

## Quality gates (required for merge)

> All CI checks must be green — none skipped, none red:
> `core — Node.js`, `Bundle core with webpack`, `Flutter app — Dart`, CodeQL, and the security workflow.
> The branch must be up to date with `master` with no merge conflicts, and all review threads resolved.
