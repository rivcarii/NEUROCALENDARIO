#!/usr/bin/env bash
# Prueba de humo de extremo a extremo en navegador (Chromium sin interfaz) con SQLite real (WASM).
# Requisitos: npm i (playwright-core es devDependency) y un Chromium (PLAYWRIGHT_BROWSERS_PATH o CHROME).
# Es una verificación de la lógica y la interfaz en web; NO sustituye las pruebas en un teléfono real.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-$(mktemp -d)}"
CHROME="${CHROME:-$(ls /opt/pw-browsers/chromium-*/chrome-linux/chrome 2>/dev/null | head -1)}"
export CHROME
npx expo export --platform web --output-dir "$OUT/web" >/dev/null
PORT="${E2E_PORT:-8197}" node e2e/server.mjs "$OUT/web" >"$OUT/server.log" 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null || true' EXIT
sleep 1
E2E_BASE="http://localhost:${E2E_PORT:-8197}/" E2E_SHOTS="$OUT" node e2e/e2e.mjs
echo "Capturas en $OUT"
