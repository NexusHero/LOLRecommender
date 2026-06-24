# Contributing to LoL Coach

Thanks for taking the time to contribute!

This project follows a [Code of Conduct](CODE_OF_CONDUCT.md) — by participating you are
expected to uphold it. Pull requests use the [PR template](.github/pull_request_template.md);
its checklist mirrors the quality gates below.

## Before you start

- Check [open issues](https://github.com/NexusHero/LOLRecommender/issues) to avoid duplicate work.
- For bigger changes, open an issue first to discuss the approach.

## Good first issues

Look for the [`good first issue`](https://github.com/NexusHero/LOLRecommender/labels/good%20first%20issue) label. Good starting points:

- Adding a champion or item to `core/src/data/champions.json` / `items.json`
- Improving a heuristic rule in `core/src/heuristic.ts`
- Adding a widget test in `app/test/`
- Improving error messages or UI copy

## Setup

```bash
# Core backend
cd core && npm install

# Flutter app
cd app && flutter pub get

# Install pre-commit hook (runs flutter analyze before every commit)
cp scripts/hooks/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

Run the full test suite before opening a PR:

```bash
./test.sh
```

## Pull request checklist

- [ ] `./test.sh` passes locally
- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org) (`type(scope): summary`)
- [ ] New tests use the `Subject_StateUnderTest_ExpectedBehaviour` naming convention
- [ ] No API keys or personal data committed

## Commit message format

```
feat(heuristic): add Mortal Reminder recommendation for heavy-heal comps
fix(core): prevent double-fire on PLAYER_DIED within 500 ms
docs(readme): add demo GIF
```

Types: `feat` · `fix` · `docs` · `test` · `refactor` · `chore` · `ci`

## Champion / item data

Champion classifications live in `core/src/data/champions.json`. Each champion entry looks like:

```json
"Soraka": { "ap": true, "healer": true, "cc": true }
```

Adding or correcting a classification is one of the easiest contributions — no code required.

## Questions?

Open a [Discussion](https://github.com/NexusHero/LOLRecommender/discussions) or ping in the issue thread.
