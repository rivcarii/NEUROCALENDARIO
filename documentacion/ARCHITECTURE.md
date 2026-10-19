# Arquitectura

## Principios
- **Local primero**: SQLite en el dispositivo es la única fuente de verdad. Sin red no se pierde función.
- **Toda lectura/escritura de datos de salud pasa por `Store`** (`src/db/store.ts`): valida (zod), comprueba permisos por perfil, audita (sin contenido clínico) y encola cambios de sincronización.
- **La lógica no depende de React ni de Expo**: se prueba en Node con `node:sqlite` mediante la interfaz `SqlDb`.

## Capas
```
src/app/            Pantallas (Expo Router). Solo presentación y orquestación.
src/components/     UI reutilizable (Screen, Button, TextField, DateTimeField, gráficos…).
src/services/       Adaptadores de plataforma: SQLite (expo-sqlite), archivos, notificaciones, sesión.
src/domain/         Lógica pura: esquemas zod, tiempo, estadísticas, recordatorios, informe HTML, copias.
src/db/             SqlDb (abstracción + transacciones), migraciones, Store (autorización/CRUD), errores.
supabase/           Esquema PostgreSQL + RLS para la sincronización opcional (sin cliente aún) y sus pruebas.
tests/ e2e/ scripts/ Pruebas.
```

## Flujo de una escritura
Pantalla → `store.create/update/remove(entity, profileId, input)` → validación zod → transacción: verificación de permiso (`permissions`), referencias del mismo perfil, `INSERT/UPDATE`, `audit_log`, `sync_queue` (solo si hay sincronización) → `bump()` recarga las pantallas desde SQLite (`useData`).

## Decisiones clave
| Decisión | Motivo |
|---|---|
| El perfil se **fija al abrir un formulario** y se re-comprueba al guardar | Evita guardar en el perfil equivocado si cambia el perfil activo. |
| Los ids de otro perfil devuelven «no existe» y las referencias cruzadas se rechazan | Separación estricta aunque se manipulen identificadores. |
| Instantes en **ISO UTC normalizado**; los días se calculan en hora local | Orden/filtrado correcto y consistente con cambios de hora (probado en 5–6 zonas). |
| Transacciones serializadas con cola (`createSqlDb`) | expo-sqlite usa una conexión; evita intercalar operaciones dentro de una transacción. |
| Restauración **siempre a un perfil nuevo** con ids y rutas de archivo nuevos | Nunca sobrescribe datos ni comparte archivos entre perfiles. |
| Recordatorios: se cancelan y reprograman (≤60, los más próximos) tras cada cambio | iOS limita a 64 notificaciones locales pendientes. |
| Sincronización no implementada; esquema y RLS listos y probados | El cliente (auth, resolución de conflictos, cifrado) requiere un proyecto Supabase real para verificarse. |

## Versiones (SDK 58)
Expo ~58.0, React Native 0.88, React 19.3, TypeScript ~6.0 (estricto + `noUncheckedIndexedAccess`), Expo Router ~58, expo-sqlite ~58, expo-notifications ~58.1, zod 4, react-hook-form 7, @noble/ciphers y @noble/hashes 2.4. Jest 30 + jest-expo + @testing-library/react-native 14.
