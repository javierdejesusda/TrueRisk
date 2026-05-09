#!/usr/bin/env bash
# Smoke-test a TrueRisk deployment (gp.nano conservative-mode or gp.micro full-features).
#
# Usage:
#   bash scripts/migrate-to-nano/verify-nano.sh <base-url> [--full-features]
#
# Examples:
#   bash scripts/migrate-to-nano/verify-nano.sh https://nano-preview.dokploy.example
#   bash scripts/migrate-to-nano/verify-nano.sh https://truerisk.cloud --full-features
#
# Modes:
#   default          — conservative-mode (chat kill switch active, expects 503).
#   --full-features  — chat is enabled, expects 200 (or 401/403 if endpoint is auth-gated).
#
# Checks:
#   1. Frontend GET /                      -> 200
#   2. Backend  GET /health                -> 200
#   3. Chat     POST /api/v1/chat/stream   -> 503 (default) | 200/401/403 (full-features)
#   4. Forecast GET /api/v1/risk/28        -> 200 with composite_score in body
#
# Non-zero exit on any failed check.
set -uo pipefail

BASE_URL="${1:-}"
MODE="conservative"
shift || true
for arg in "$@"; do
  case "$arg" in
    --full-features) MODE="full-features" ;;
    *) echo "Unknown flag: $arg" >&2; exit 2 ;;
  esac
done
if [[ -z "$BASE_URL" ]]; then
  echo "Usage: $0 <base-url> [--full-features]" >&2
  echo "Example: $0 https://truerisk.cloud --full-features" >&2
  exit 2
fi

BASE_URL="${BASE_URL%/}"
PASS=0
FAIL=0

check_eq() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    printf '  [PASS] %-45s (%s)\n' "$label" "$actual"
    PASS=$((PASS+1))
  else
    printf '  [FAIL] %-45s expected %s, got %s\n' "$label" "$expected" "$actual"
    FAIL=$((FAIL+1))
  fi
}

check_in() {
  local label="$1" actual="$2"
  shift 2
  for expected in "$@"; do
    if [[ "$actual" == "$expected" ]]; then
      printf '  [PASS] %-45s (%s)\n' "$label" "$actual"
      PASS=$((PASS+1))
      return
    fi
  done
  printf '  [FAIL] %-45s expected one of {%s}, got %s\n' "$label" "$*" "$actual"
  FAIL=$((FAIL+1))
}

echo "Probing $BASE_URL  (mode=$MODE)"
echo

echo "1) Frontend"
status=$(curl -sk -o /dev/null -w '%{http_code}' "$BASE_URL/")
check_eq "GET /" "200" "$status"

echo
echo "2) Backend health"
status=$(curl -sk -o /dev/null -w '%{http_code}' "$BASE_URL/health")
check_eq "GET /health" "200" "$status"

echo
if [[ "$MODE" == "conservative" ]]; then
  echo "3) Chat kill-switch (expect 503)"
  status=$(curl -sk -o /dev/null -w '%{http_code}' \
    -X POST -H 'Content-Type: application/json' \
    -d '{"message":"ping","province_code":"28","conversation_id":"smoke"}' \
    "$BASE_URL/api/v1/chat/stream")
  check_eq "POST /api/v1/chat/stream" "503" "$status"
else
  echo "3) Chat enabled (expect 200, or 401/403 if auth-gated)"
  status=$(curl -sk -o /dev/null -w '%{http_code}' \
    -X POST -H 'Content-Type: application/json' \
    -d '{"message":"ping","province_code":"28","conversation_id":"smoke"}' \
    "$BASE_URL/api/v1/chat/stream")
  check_in "POST /api/v1/chat/stream" "$status" "200" "401" "403"
fi

echo
echo "4) Province risk endpoint"
body=$(curl -sk "$BASE_URL/api/v1/risk/28" || true)
if echo "$body" | grep -q '"composite_score"'; then
  echo "  [PASS] /api/v1/risk/28 contains composite_score"
  PASS=$((PASS+1))
else
  echo "  [FAIL] /api/v1/risk/28 missing composite_score in body. First 200 chars:"
  echo "         $(echo "$body" | head -c 200)"
  FAIL=$((FAIL+1))
fi

echo
echo "Result: $PASS passed, $FAIL failed."
[[ "$FAIL" -eq 0 ]]
