#!/usr/bin/env bash
# Prueba de la versión instalable (PWA): compila dos versiones, publica la 1, comprueba caché y modo sin internet,
# publica la 2 y comprueba el aviso «Hay una versión nueva» y la actualización.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-$(mktemp -d)}"; mkdir -p "$OUT"
CHROME="${CHROME:-$(ls /opt/pw-browsers/chromium-*/chrome-linux/chrome 2>/dev/null | head -1)}"; export CHROME
APP_BUILD="0.1.0+v1test" ./scripts/build-web.sh "$OUT/v1" >/dev/null 2>&1
APP_BUILD="0.1.0+v2test" ./scripts/build-web.sh "$OUT/v2" >/dev/null 2>&1
ln -sfn "$OUT/v1" "$OUT/current"
PORT="${E2E_PORT:-8198}" node e2e/server.mjs "$OUT/current" >"$OUT/server.log" 2>&1 &
SRV=$!; trap 'kill $SRV 2>/dev/null || true' EXIT; sleep 1
E2E_BASE="http://localhost:${E2E_PORT:-8198}/" E2E_SHOTS="$OUT" V1="v1test" V2="0.1.0+v2test" \
  E2E_SWITCH="ln -sfn $OUT/v2 $OUT/current" node e2e/pwa.mjs
