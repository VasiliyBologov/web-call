#!/usr/bin/env bash
set -euo pipefail

# Simple curl-based smoke test for Web Call (Docker Compose up assumed)
# Usage:
#   chmod +x scripts/curl_smoke.sh
#   scripts/curl_smoke.sh
# Optional env vars:
#   BASE_WEB (default http://localhost:5173)
#   BASE_API (default http://localhost:8000)

BASE_WEB=${BASE_WEB:-http://localhost:5173}
BASE_API=${BASE_API:-http://localhost:8000}

echo "==> Checking backend health at $BASE_API/api/health"
curl -fsS "$BASE_API/api/health"; echo; echo

echo "==> Creating a room at $BASE_API/api/rooms"
CREATE=$(curl -fsS -X POST "$BASE_API/api/rooms" -H 'Content-Type: application/json')
echo "$CREATE"; echo

ROOM_URL=$(echo "$CREATE" | sed -n 's/.*"url":"\([^"]*\)".*/\1/p')
if [ -z "${ROOM_URL}" ]; then
  echo "Could not parse room URL from response" >&2
  exit 1
fi
TOKEN=$(echo "$ROOM_URL" | awk -F'/r/' '{print $2}')
if [ -z "${TOKEN}" ]; then
  echo "Could not parse token from room URL: $ROOM_URL" >&2
  exit 1
fi

echo "==> Getting room info for token=$TOKEN"
curl -fsS "$BASE_API/api/rooms/$TOKEN"; echo; echo

echo "==> Frontend availability check at $BASE_WEB"
curl -I -s "$BASE_WEB" | head -n 1

cat <<EOF

Notes:
- If you previously built images with VITE_API_BASE pointing to http://backend:8000, rebuild images: docker compose build --no-cache
- Access the app via http://localhost:5173. Access via container bridge IPs like 172.18.x.x may not work on Docker Desktop (non-routable from host).
EOF
