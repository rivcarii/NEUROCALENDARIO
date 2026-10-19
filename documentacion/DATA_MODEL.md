# Modelo de datos (SQLite, migración v1)

Toda fila clínica tiene: `id` (UUID estable), `profile_id` (FK con `ON DELETE CASCADE`), `created_at`, `updated_at`, `created_by`, `updated_by` (FK a `accounts`).

| Tabla | Contenido | Notas |
|---|---|---|
| `accounts` | Propietario (`owner`) y cuentas familiares (`family`) | Identifica al autor de cada registro. |
| `profiles` | Personas (mamá, yo…): nombre, relación, color, `is_primary` | |
| `permissions` | (`profile_id`,`account_id`) → `read`/`write`/`admin`, `revoked_at` | El propietario recibe `admin` explícito; no se puede revocar. |
| `episodes` | inicio/fin (+duración calculada, no almacenada), tipo, intensidad 0–10, síntomas asociados, contexto, sueño, estrés, desencadenantes **declarados**, medicamentos relacionados, recuperación, `is_quick` | `CHECK(fin ≥ inicio)`. |
| `medications` | nombre, dosis (texto), presentación, prescriptor, activo | |
| `med_schedules` | horas `HH:MM`, días de la semana, desde/hasta, indicaciones, recordatorios | Pautas **prescritas**; la app no las sugiere. |
| `med_intakes` | `tomada`/`omitida`/`pospuesta`, `scheduled_at`, `taken_at` | `UNIQUE(schedule_id, scheduled_at)` evita duplicados. |
| `appointments` | título, inicio/fin, profesional, lugar, estado, minutos de aviso | |
| `exams` | nombre, fecha, estado, resultado, **`result_source`** (`informe_medico` / `declarado_por_usuario`) | Distingue observación documentada de declaración. |
| `documents` | metadatos + `sha256` + `storage_path` (ruta relativa privada) | Solo PDF/JPG/PNG ≤ 15 MB. |
| `notes` | texto, `author_role` (`persona`/`cuidador`), fecha | |
| `symptom_catalog` | catálogo de síntomas (reservado; la UI usa listas integradas) | Sin uso aún. |
| `reminders` | notificaciones programadas (id de la notificación del SO) | Se regenera. |
| `reports` | registro de informes generados (periodo y secciones, sin contenido) | |
| `audit_log` | quién, cuándo, acción, entidad, id; `detail` = nombres de campos cambiados | **Sin contenido clínico** (probado). |
| `sync_queue` | (entidad, id, op) pendientes | Solo con `sync_enabled=1`; sin contenido. |
| `settings` | clave/valor no clínicos (perfil activo, bloqueo, notificaciones) | |

## Tipos de dato
- **Observación**: lo registra el usuario en el momento (episodio).
- **Declaración del usuario**: p. ej. desencadenantes, resultado de examen sin informe.
- **Valor calculado**: duración, estadísticas, adherencia (nunca se guardan).
- Los campos desconocidos son `NULL`; nunca se rellenan con valores inventados. Los promedios indican con cuántos registros se calcularon.

## Migraciones
`src/db/migrations.ts`: versión en `PRAGMA user_version`, cada migración en su transacción; rechaza bases más nuevas que la app. Probado: idempotencia, migración v1→v2 conservando datos y reversión de una migración fallida.

## Servidor (opcional)
`supabase/migrations/0001_neurocalendario.sql`: `profiles`, `profile_members`, `records` (JSONB genérico), bucket privado `documents`. RLS activado y forzado en todas. Ver `documentacion/SECURITY.md`.
