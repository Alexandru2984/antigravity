#!/usr/bin/env bash
# PolyMarket health check — verify all services are responsive
set -euo pipefail

BASE="${API_GATEWAY:-http://localhost:4001}"
PASS=0; FAIL=0

check() {
    local name=$1; local url=$2
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
    if [[ "$code" == "200" ]]; then
        echo "  ✅ $name ($url) → $code"
        (( PASS++ ))
    else
        echo "  ❌ $name ($url) → $code"
        (( FAIL++ ))
    fi
}

echo "🔍 PolyMarket Health Check — $(date)"
echo "────────────────────────────────────"

# Direct service checks (internal ports)
check "auth-service"          "http://localhost:4000/health"
check "api-gateway"           "http://localhost:4001/health"
check "listing-service"       "http://localhost:4002/health"
check "search-service"        "http://localhost:4003/health"
check "image-service"         "http://localhost:4004/health"
check "profile-service"       "http://localhost:4005/health"
check "payment-service"       "http://localhost:4006/health"
check "notification-service"  "http://localhost:4007/health"
check "feed-service"          "http://localhost:4008/health"
check "review-service"        "http://localhost:4009/health"
check "analytics-service"     "http://localhost:4010/health"
check "chat-service"          "http://localhost:4011/health"
check "ml-service"            "http://localhost:4012/health"
check "stream-processor"      "http://localhost:4013/health"
check "config-service"        "http://localhost:4014/health"
check "contract-validator"    "http://localhost:4015/health"
check "admin-panel"           "http://localhost:4016/health"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]] && echo "🎉 All services healthy!" || echo "⚠️  $FAIL service(s) failing"
exit $FAIL
