#!/usr/bin/env bash
# test.sh — run all tests for bridge (Node/Jest) and flutter_app side-by-side
#
# Usage:
#   ./test.sh                  run all tests (flutter goldens excluded)
#   ./test.sh --coverage       bridge tests with coverage report
#   ./test.sh --mock-server    start mock LoL server before bridge tests (guaranteed stop)
#   ./test.sh --goldens        include flutter golden tests
#   ./test.sh --update-goldens regenerate golden baselines then run all
#   ./test.sh --bridge-only    skip flutter
#   ./test.sh --flutter-only   skip bridge
#   ./test.sh --watch          bridge jest --watch (flutter skipped)

set -euo pipefail

# ── colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ── flags ────────────────────────────────────────────────────────────────────
RUN_BRIDGE=true
RUN_FLUTTER=true
COVERAGE=false
GOLDENS=false
UPDATE_GOLDENS=false
WATCH=false
WITH_MOCK_SERVER=false

for arg in "$@"; do
  case "$arg" in
    --coverage)       COVERAGE=true ;;
    --mock-server)    WITH_MOCK_SERVER=true ;;
    --goldens)        GOLDENS=true ;;
    --update-goldens) UPDATE_GOLDENS=true; GOLDENS=true ;;
    --bridge-only)    RUN_FLUTTER=false ;;
    --flutter-only)   RUN_BRIDGE=false ;;
    --watch)          WATCH=true; RUN_FLUTTER=false ;;
    --help|-h)
      sed -n '/^# Usage:/,/^[^#]/p' "$0" | grep '^#' | sed 's/^# \?//'
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown flag: $arg${RESET}"
      exit 1
      ;;
  esac
done

ROOT="$(cd "$(dirname "$0")" && pwd)"
BRIDGE_DIR="$ROOT/bridge"
FLUTTER_DIR="$ROOT/flutter_app"

BRIDGE_EXIT=0
FLUTTER_EXIT=0
MOCK_PID=""
MOCK_PORT=29990

# ── helpers ───────────────────────────────────────────────────────────────────
section() { echo -e "\n${CYAN}${BOLD}▶ $1${RESET}"; }
ok()      { echo -e "${GREEN}${BOLD}✔ $1${RESET}"; }
fail()    { echo -e "${RED}${BOLD}✖ $1${RESET}"; }
warn()    { echo -e "${YELLOW}$1${RESET}"; }

check_tool() {
  if ! command -v "$1" &>/dev/null; then
    warn "  $1 not found — skipping ${2:-} tests"
    return 1
  fi
  return 0
}

# ── mock server lifecycle ─────────────────────────────────────────────────────

# Guaranteed cleanup — fires on EXIT (normal, Ctrl-C, error, SIGTERM).
cleanup_mock() {
  if [ -n "$MOCK_PID" ]; then
    kill "$MOCK_PID" 2>/dev/null || true
    wait "$MOCK_PID" 2>/dev/null || true
    MOCK_PID=""
  fi
}
trap cleanup_mock EXIT

start_mock_server() {
  section "Mock LoL Server"

  if ! check_tool node "mock server"; then
    warn "  node not found — skipping mock server"
    return
  fi

  echo "  port : $MOCK_PORT"
  echo "  cmd  : npx tsx src/mock-lol-server.ts"
  echo ""

  MOCK_LOL_PORT=$MOCK_PORT npx --prefix "$BRIDGE_DIR" tsx \
    "$BRIDGE_DIR/src/mock-lol-server.ts" >/tmp/mock-lol.log 2>&1 &
  MOCK_PID=$!

  # Wait until the server responds (max 5s)
  local ready=false
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    if curl -sf \
      "http://localhost:$MOCK_PORT/liveclientdata/allgamedata" \
      >/dev/null 2>&1; then
      ready=true
      break
    fi
    sleep 0.5
  done

  if $ready; then
    ok "Mock LoL server ready  (pid $MOCK_PID)"
    export LIVE_CLIENT_URL="http://localhost:$MOCK_PORT/liveclientdata/allgamedata"
    echo "  LIVE_CLIENT_URL=$LIVE_CLIENT_URL"
  else
    fail "Mock LoL server did not start within 5s"
    cat /tmp/mock-lol.log 2>/dev/null || true
    cleanup_mock
  fi
}

# ── bridge ───────────────────────────────────────────────────────────────────
run_bridge() {
  section "Bridge — Node.js / Jest"

  if ! check_tool node "bridge"; then
    BRIDGE_EXIT=1
    return
  fi

  cd "$BRIDGE_DIR"

  local jest_args=""

  if $WATCH; then
    jest_args="--watch"
  elif $COVERAGE; then
    jest_args="--coverage"
  fi

  echo "  dir  : $BRIDGE_DIR"
  echo "  cmd  : npm test -- $jest_args"
  if [ -n "${LIVE_CLIENT_URL:-}" ]; then
    echo "  env  : LIVE_CLIENT_URL=$LIVE_CLIENT_URL"
  fi
  echo ""

  # shellcheck disable=SC2086
  if npm test -- $jest_args 2>&1; then
    ok "Bridge tests passed"
  else
    BRIDGE_EXIT=$?
    fail "Bridge tests failed (exit $BRIDGE_EXIT)"
  fi

  cd "$ROOT"
}

# ── flutter ───────────────────────────────────────────────────────────────────
run_flutter() {
  section "Flutter App"

  if ! check_tool flutter "flutter"; then
    warn "  Install Flutter SDK and add it to PATH to run Flutter tests."
    FLUTTER_EXIT=1
    return
  fi

  cd "$FLUTTER_DIR"

  echo "  dir  : $FLUTTER_DIR"

  # Update goldens first if requested
  if $UPDATE_GOLDENS; then
    echo ""
    warn "  Regenerating golden baselines…"
    if flutter test \
      --update-goldens \
      test/widgets/recommendation_panel_golden_test.dart 2>&1; then
      ok "Goldens updated"
    else
      fail "Golden update failed"
      FLUTTER_EXIT=1
      cd "$ROOT"
      return
    fi
  fi

  # Build the test file list
  local test_dirs=(
    test/models
    test/services
    test/screens
    test/widgets/recommendation_panel_test.dart
    test/widgets/connection_form_test.dart
  )

  if $GOLDENS; then
    test_dirs+=("test/widgets/recommendation_panel_golden_test.dart")
    echo "  mode : all tests (including goldens)"
  else
    echo "  mode : unit + widget (goldens excluded — use --goldens to include)"
  fi

  echo "  cmd  : flutter test ${test_dirs[*]}"
  echo ""

  if flutter test "${test_dirs[@]}" 2>&1; then
    ok "Flutter tests passed"
  else
    FLUTTER_EXIT=$?
    fail "Flutter tests failed (exit $FLUTTER_EXIT)"
  fi

  cd "$ROOT"
}

# ── summary ───────────────────────────────────────────────────────────────────
print_summary() {
  echo ""
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${BOLD}  Summary${RESET}"
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

  if $WITH_MOCK_SERVER; then
    echo "     Mock LoL server stopped (guaranteed)"
  fi

  if $RUN_BRIDGE; then
    if [ $BRIDGE_EXIT -eq 0 ]; then
      ok "  Bridge  passed"
    else
      fail "  Bridge  FAILED"
    fi
  else
    echo "     Bridge  (skipped)"
  fi

  if $RUN_FLUTTER; then
    if [ $FLUTTER_EXIT -eq 0 ]; then
      ok "  Flutter passed"
    else
      fail "  Flutter FAILED"
    fi
  else
    echo "     Flutter (skipped)"
  fi

  echo ""

  local overall=0
  $RUN_BRIDGE  && [ $BRIDGE_EXIT  -ne 0 ] && overall=1
  $RUN_FLUTTER && [ $FLUTTER_EXIT -ne 0 ] && overall=1

  if [ $overall -eq 0 ]; then
    echo -e "${GREEN}${BOLD}  All tests passed.${RESET}"
  else
    echo -e "${RED}${BOLD}  Some tests failed.${RESET}"
  fi
  echo ""

  return $overall
}

# ── main ──────────────────────────────────────────────────────────────────────
$WITH_MOCK_SERVER && $RUN_BRIDGE && start_mock_server

$RUN_BRIDGE  && run_bridge
$RUN_FLUTTER && run_flutter

print_summary
