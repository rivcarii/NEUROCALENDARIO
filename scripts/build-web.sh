#!/usr/bin/env bash
# Compila la versión web instalable (PWA) en ./dist.
# Variables: EXPO_BASE_URL (ej. /NEUROCALENDARIO en GitHub Pages; vacío en local), APP_BUILD (opcional).
set -euo pipefail
cd "$(dirname "$0")/.."
VER="$(node -p "require('./package.json').version")"
SHA="${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || echo local)}"
export EXPO_PUBLIC_APP_BUILD="${APP_BUILD:-$VER+${SHA:0:7}}"
export EXPO_PUBLIC_BASE_URL="${EXPO_BASE_URL:-}"
OUT="${1:-dist}"
rm -rf "$OUT"
npx expo export --platform web --output-dir "$OUT"
node scripts/build-pwa.mjs "$OUT"
# Seguridad: ningún archivo de la web puede quedar fuera de git (p. ej. por .gitignore), o la publicación saldría incompleta.
if git rev-parse --git-dir >/dev/null 2>&1 && [ -n "$(find "$OUT" -type f 2>/dev/null | head -1)" ]; then
  if find "$OUT" -type f | git check-ignore --stdin -q 2>/dev/null; then
    echo "ERROR: hay archivos de $OUT ignorados por .gitignore; la publicación estaría incompleta." >&2
    find "$OUT" -type f | git check-ignore --stdin >&2
    exit 1
  fi
fi
