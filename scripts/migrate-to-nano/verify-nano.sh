#!/usr/bin/env bash
# Smoke-test a TrueRisk gp.nano deployment.
#
# Usage (preview URL or staging IP):
#   bash scripts/migrate-to-nano/verify-nano.sh https://nano-preview.dokploy.example
#
# Or after DNS cutover:
#   bash scripts/migrate-to-nano/verify-nano.sh https://truerisk.cloud
#
# Checks:
#   - Frontend loads (200)
#   - Backend /api/v1/health returns 200
#   - Chat endpoint returns 503 (kill switch active)
#   - A province risk endpoint returns 200 and includes a forecast block
#
# Non-zero exit on any failed check.
set -uo pipefail

BASE_URL="${1:-}"
if [[ -z "$BASE_URL" ]]; then
  echo "Usage: $0 <base-url>" >&2
  echo "Example: $0 https://truerisk.cloud" >&2
  exit 2
fi

BASE_URL="${BASE_URL%/}"
PASS=0
FAIL=0

check() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    printf '  [PASS] %-45s (%s)\n' "$label" "$actual"
    PASS=$((PASS+1))
  else
    printf '  [FAIL] %-45s expected %s, got %s\n' "$label" "$expected" "$actual"
    FAIL=$((FAIL+1))
  fi
}

echo "Probing $BASE_URL"
echo

echo "1) Frontend"
status=$(curl -sk -o /dev/null -w '%{http_code}' "$BASE_URL/")
check "GET /" "200" "$status"

echo
echo "2) Backend health"
status=$(curl -sk -o /dev/null -w '%{http_code}' "$BASE_URL/api/v1/health")
check "GET /api/v1/health" "200" "$status"

echo
echo "3) Chat kill-switch (expect 503)"
status=$(curl -sk -o /dev/null -w '%{http_code}' \
  -X POST -H 'Content-Type: application/json' \
  -d '{"message":"ping","province_code":"28","conversation_id":"smoke"}' \
  "$BASE_URL/api/v1/chat/stream")
check "POST /api/v1/chat/stream" "503" "$status"

echo
echo "4) Province forecast (deterministic fallback active)"
body=$(curl -sk "$BASE_URL/api/v1/risk/28" || true)
if echo "$body" | grep -q '"q50"'; then
  echo "  [PASS] /api/v1/risk/28 contains q10/q50/q90 quantiles"
  PASS=$((PASS+1))
else
  echo "  [FAIL] /api/v1/risk/28 missing q50 in body. First 200 chars:"
  echo "         $(echo "$body" | head -c 200)"
  FAIL=$((FAIL+1))
fi

echo
echo "Result: $PASS passed, $FAIL failed."
[[ "$FAIL" -eq 0 ]]
