#!/usr/bin/env bash
# Genera el HTML del informe con datos ficticios, lo imprime a PDF con Chromium sin interfaz
# y comprueba con pdftotext que el contenido obligatorio está presente.
# Verifica la plantilla y el diseño del PDF; NO sustituye una prueba de expo-print en el teléfono.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-$(mktemp -d)}"; mkdir -p "$OUT"
CHROME="${CHROME:-$(ls /opt/pw-browsers/chromium-*/chrome-linux/chrome 2>/dev/null | head -1)}"
[ -x "$CHROME" ] || CHROME="$(command -v chromium chromium-browser google-chrome | head -1)"
REPORT_HTML_OUT="$OUT/informe.html" npx jest tests/reportSample.test.ts >/dev/null
"$CHROME" --headless --no-sandbox --disable-gpu --no-pdf-header-footer --print-to-pdf="$OUT/informe.pdf" "file://$OUT/informe.html" >/dev/null 2>&1
pdftotext -layout "$OUT/informe.pdf" "$OUT/informe.txt"
fail=0
for needle in "Informe de seguimiento neurológico" "Perfil Mamá (ficticio)" "01/03/2026 a 31/03/2026" "no constituye un diagnóstico" "Episodios neurológicos" "Medicamentos" "Citas médicas" "Exámenes y resultados" "Informe médico" "Observación ficticia 3 & <b>"; do
  if grep -qF "$needle" "$OUT/informe.txt"; then echo "OK   $needle"; else echo "FALTA $needle"; fail=1; fi
done
echo "Páginas: $(pdfinfo "$OUT/informe.pdf" | awk '/Pages/{print $2}')  Archivo: $OUT/informe.pdf"
exit $fail
