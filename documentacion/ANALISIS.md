# Análisis, semáforo e informe clínico

Todo es **descriptivo**: resume lo que el paciente anotó. No diagnostica ni recomienda tratamientos.

## Semáforo y medidor por día (`src/domain/analysis.ts`)
Regla propia de la app (no es una escala clínica validada). Cada día con registros parte de 100 y resta:

| Concepto | Resta |
| --- | --- |
| Fuerza máxima 1–3 (leve) | 5 × fuerza |
| Fuerza 4–6 (moderada) | 7 × fuerza |
| Fuerza 7–10 (intensa) | 9 × fuerza |
| Sin fuerza anotada | se supone 5 |
| Más de un síntoma | 5 por cada extra (máx. 15) |
| Convulsión o desmayo | 60 |
| Dosis anotada como «no la tomé» | 10 por dosis (máx. 30) |

Color: **verde ≥ 80**, **amarillo 50–79**, **rojo < 50**, **gris** = sin síntomas ni tomas anotadas (o día futuro).
Limitación: un día sin ningún registro es gris, no verde, para no afirmar «tranquilo» sin datos.

## Hallazgos semanales y mensuales
Se calculan para la semana (lunes–domingo) o el mes elegido y se comparan con el período anterior de igual duración. Aparecen en **Hoy** (últimos 7 días), **Calendario** y **Más → Análisis semanal y mensual**.

| Hallazgo | Criterio | Base |
| --- | --- | --- |
| Cefalea ≥ 15 días/mes | solo en períodos ≥ 28 días; texto aclara que un mes no basta (se exige > 3 meses) | ICHD-3 (Cephalalgia 2018) |
| Dolor intenso | días con fuerza ≥ 7/10 | Bandas de la escala numérica 0–10 |
| Cambio del dolor | media sube/baja ≥ 2 puntos o ≥ 30 % | Cambio clínicamente relevante (AAFP; revisión Ann Palliat Med 2015; IMMPACT) |
| Convulsión/desmayo | cualquier evento anotado; recordar anotar fecha, duración, desencadenantes | Recomendaciones de diarios de crisis (organizaciones de epilepsia) |
| Adherencia < 80 % | dosis tomadas / programadas | Umbral convencional de buena adherencia |
| Faltan registros | < 50 % de los días con anotaciones | — |
| Momento del día | ≥ 50 % de ≥ 4 síntomas en un tramo | Descriptivo |

Las fuentes consultadas eran sobre todo guías divulgativas y revisiones secundarias (no se accedió al texto íntegro de ICHD-3); los umbrales deben validarlos los médicos tratantes antes de usarlos clínicamente.

## Informe PDF (`reportDoc` → `reportHtml` / `reportPdf`)
Un solo modelo de documento (`buildReportDoc`) se dibuja como **HTML → PDF** en el teléfono (expo-print) y como **PDF directo** en el navegador/PWA (pdf-lib, carga diferida), donde la ventana de impresión no existe o no deja guardar en iPhone. Contiene: resumen clínico (medidor, semáforo por día, comparación con el período anterior, escala de dolor, momento del día, hallazgos), síntomas, medicinas con adherencia, citas, estudios, notas y fuentes.
En web se comparte (hoja de compartir) o se descarga; si falla, se muestran botones «Descargar» y «Abrir».
