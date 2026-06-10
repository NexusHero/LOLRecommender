Run the full local test suite (bridge + flutter analyze + flutter tests), mirroring CI.

```bash
./test.sh $ARGUMENTS
```

Supported flags (pass as arguments to /test):
- `--flutter-only` — skip bridge, only analyze + flutter tests
- `--bridge-only`  — skip flutter
- `--coverage`     — bridge tests with coverage report
- `--goldens`      — include flutter golden tests
- `--update-goldens` — regenerate golden baselines then run all
- `--watch`        — bridge jest --watch (flutter skipped)
- `-q` / `--quiet` — only the final summary
- `-v` / `--verbose` — full output including console logs

Flutter analyze always runs before flutter tests (same order as CI).
