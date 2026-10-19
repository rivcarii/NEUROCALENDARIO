# Seguridad

## Lo que SÍ hace (con prueba)
| Control | Prueba |
|---|---|
| Autorización por perfil en la capa de datos (`read`/`write`/`admin`), no solo en la interfaz | `tests/security.test.ts` (12) |
| Id de otro perfil → «no existe»; referencias cruzadas (medicamento, pauta, vínculo de documento) rechazadas; `profileId`/`createdBy` no pueden cambiarse por un *patch* | idem |
| Revocación inmediata; el propietario no puede ser revocado; cuentas familiares no crean perfiles/cuentas | idem |
| Entradas validadas con zod (fechas, rangos, MIME, tamaño, horas); filtros por lista blanca; `LIKE` con escape; SQL parametrizado | `tests/crud.test.ts`, `security.test.ts` |
| Adjuntos validados **por contenido** (PDF/JPG/PNG), ≤15 MB, nombre saneado, ruta privada con patrón estricto | `tests/files.test.ts` |
| Copias cifradas con contraseña (scrypt N=2¹⁵ + XChaCha20-Poly1305, sal y nonce aleatorios); detecta manipulación; límites de coste anti-DoS en el KDF | `tests/domain.test.ts` |
| Restauración: perfil nuevo, rutas de archivo regeneradas (una ruta maliciosa en la copia no se usa), todo o nada | idem |
| Auditoría de autoría sin contenido clínico | `crud.test.ts`, `hygiene.test.ts` |
| Notificaciones neutras por defecto | `notifications.test.ts`, `domain.test.ts` |
| Sin secretos en el repo, sin `service_role`, sin llamadas de red ni `console.*` en `src/` | `tests/hygiene.test.ts` |
| **Servidor (RLS)**: aislamiento entre usuarios y perfiles, lectura vs escritura vs admin, revocación, propietario protegido, *upsert* sobre id ajeno, mover registros entre perfiles, autoría no falsificable, `anon` sin acceso, bucket privado, rutas de archivo estrictas | `supabase/tests/rls.test.sql` contra PostgreSQL 16 real |

## Lo que NO hace / límites honestos
1. **SQLite no está cifrado** por la app. La protección es el almacenamiento privado de la app + el cifrado/bloqueo del propio teléfono. No se afirma cifrado de la base de datos ni cifrado de extremo a extremo.
2. **Las «cuentas» locales no son autenticación.** Todo el que desbloquee el teléfono/app actúa como propietario. El modelo de permisos se aplica en la capa de datos (probado) pero el cambio de cuenta no está expuesto en la UI. La barrera real entre personas llegará con la sincronización (Supabase Auth + RLS).
3. El bloqueo biométrico (`expo-local-authentication`) está implementado pero **no verificado en un teléfono**; en web/Jest está simulado.
4. Las políticas RLS se probaron contra un PostgreSQL local con *stubs* de Supabase (`auth.uid()`, roles, `storage`). **No se probaron contra un proyecto Supabase real**; Supabase Storage puede comportarse distinto del stub.
5. Un informe PDF o una copia compartida sale del control de la app.
6. Android: `allowBackup=false` (sin copia automática a la nube de Google). iOS: los archivos de la app pueden entrar en copias de iCloud/iTunes del dispositivo.
7. No hay protección contra un dispositivo con *root*/*jailbreak*, ni contra capturas de pantalla.
8. La contraseña de la copia es la única protección del archivo `.ncbackup`; no hay recuperación si se olvida.

## Si se habilita la sincronización (pendiente)
- Solo clave `anon` + sesión de usuario en el móvil; la `service_role` nunca en el cliente.
- Activar RLS (ya forzado en la migración) y revisar `security definer` (`private.has_level`) con el rol propietario correcto.
- Evaluar cifrado de extremo a extremo antes de subir datos de salud reales; el proveedor puede leer JSONB en claro.
- Política de retención y borrado (derecho de supresión) y acuerdo de tratamiento con el proveedor.
