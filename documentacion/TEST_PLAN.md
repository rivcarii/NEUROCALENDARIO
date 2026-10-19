# Plan de pruebas y resultados

Resultados de la última ejecución (19-oct-2026, Linux, Node 22). **Todos con datos ficticios.**

| Comando | Qué cubre | Resultado |
|---|---|---|
| `npm run typecheck` | TypeScript estricto | ✅ sin errores |
| `npm run lint` | ESLint (expo + React Compiler rules) | ✅ 0 errores, 4 avisos menores |
| `npm test` | 12 suites Jest | ✅ 67 pasan, 1 omitida (generador de informe de ejemplo, usado por `test:pdf`) |
| `npm run test:tz` | dominio en UTC, Bogotá, Madrid, Auckland, Kolkata | ✅ |
| `npm run test:rls` | 9 bloques de escenarios de autorización en PostgreSQL 16 | ✅ «TODAS LAS PRUEBAS SUPERADAS» |
| `npm run test:pdf` | informe → PDF (Chromium) → texto (`pdftotext`) | ✅ 10/10 textos obligatorios, 2 páginas |
| `npm run test:e2e` | 20 comprobaciones de extremo a extremo en Chromium con SQLite real (WASM) | ✅ sin errores de consola |
| `npm run test:pwa` | web instalable: service worker, caché, sin internet, aviso de versión nueva, «Más tarde», actualizar y conservar datos | ✅ 9 comprobaciones |
| `npx expo export --platform android` | Compila el bundle Hermes | ✅ 4,3 MB |

## Requisitos de la especificación → evidencia

| Requisito | Evidencia | Suite |
|---|---|---|
| Crear/consultar/editar/eliminar | `crud.test.ts`, e2e | automática |
| Persistencia tras cerrar y reabrir | `persistence.test.ts` (archivo SQLite real reabierto), e2e (recarga de página) | automática |
| Migraciones | `persistence.test.ts` (v1, idempotencia, v2 simulada, reversión) | automática |
| Separación mamá/yo | `security.test.ts`, `ui.test.tsx`, e2e | automática |
| Prevención de perfil equivocado | referencias cruzadas rechazadas (`security.test.ts`); perfil fijado al abrir el formulario (revisión de código; **no hay prueba automática del cambio de perfil con formulario abierto**) | parcial |
| Validación de fechas y duración | `crud.test.ts`, `domain.test.ts`, test de zonas horarias/DST | automática |
| Sin conexión | la app no usa red (`hygiene.test.ts`); e2e sin servidor remoto | automática |
| Sincronización y conflictos | **No implementada** (solo cola/enlaces y RLS de servidor) | ❌ |
| Permisos familiares | `security.test.ts` (capa de datos), `rls.test.sql` (servidor), e2e (alta/concesión/revocación en UI) | automática |
| Protección de archivos | `files.test.ts` (validación por contenido), restauración con rutas nuevas; bucket/rutas RLS | automática; **lectura/escritura de archivos en dispositivo no probada** |
| Programación/cancelación de notificaciones | `notifications.test.ts` con `expo-notifications` simulado | automática; **entrega real no verificada** |
| PDF | `test:pdf` + `report.test.ts` | automática; `expo-print` en teléfono **no verificado** |
| Exportación y restauración | `domain.test.ts` (cifrado, manipulación, contraseña errónea, todo-o-nada, rutas) | automática; selector de archivos/compartir en teléfono **no verificado** |
| Manejo de errores y recuperación | transacciones con reversión, restauración todo-o-nada, pantalla de error de arranque | parcial |
| Ausencia de secretos y de datos médicos en logs | `hygiene.test.ts` | automática |
| Accesos no autorizados entre cuentas/perfiles | `security.test.ts`, `rls.test.sql` | automática |
| Accesibilidad básica | etiquetas, objetivos ≥48 px, contraste AA (`contrast.test.ts`) | parcial (sin lector de pantalla real) |

## Lista de comprobación manual en teléfono (pendiente)
1. Instalar el APK; crear perfil; registrar un episodio; cerrar la app desde multitarea; reabrir y verlo.
2. Concederse permiso de notificaciones; crear una cita para dentro de 5 min con aviso 0; bloquear la pantalla; comprobar que llega y que el texto es neutro.
3. Reiniciar el teléfono con recordatorios pendientes y comprobar si llegan (Android: ahorro de batería/alarmas exactas).
4. Adjuntar un PDF y una foto; abrir/compartir; eliminar y comprobar que desaparecen.
5. Generar y compartir un informe PDF; abrirlo en otro dispositivo.
6. Crear copia cifrada, **desinstalar la app**, reinstalar y restaurar; verificar datos y archivos.
7. Activar el bloqueo biométrico; mandar la app a segundo plano; comprobar que pide autenticación.
8. Cambiar tamaño de fuente del sistema y probar TalkBack/VoiceOver en las pantallas principales.
