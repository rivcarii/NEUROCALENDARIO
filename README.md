# NeuroCalendario

Aplicación móvil (Expo / React Native, en español) para el **seguimiento neurológico personal y familiar**: episodios y síntomas, medicación y tomas, citas, exámenes, documentos, notas, estadísticas e informes PDF. Los datos se guardan **solo en el dispositivo** (SQLite) y funcionan sin conexión.

> **Estado: versión de pruebas (0.1.0).** No introduzca datos médicos reales hasta haber completado la lista de comprobación de [`documentacion/KNOWN_ISSUES.md`](documentacion/KNOWN_ISSUES.md#antes-de-usar-datos-reales). La app no diagnostica, no sustituye la atención sanitaria y no es un sistema de emergencias.

## Qué incluye (verificado)

| Área | Estado |
|---|---|
| Perfiles independientes (mamá / propio / otros), perfil activo siempre visible | ✅ |
| Hoy, calendario mensual/semanal/diario | ✅ |
| Episodios: registro rápido y completo, duración calculada, historial, búsqueda y filtros | ✅ |
| Medicamentos, horarios prescritos, registro de tomas (sin duplicados) | ✅ |
| Citas con recordatorio, exámenes (resultado «informe médico» vs «declarado por el usuario»), notas (persona/cuidador) | ✅ |
| Documentos PDF/JPG/PNG en almacenamiento privado, validados por contenido | ✅ (lógica); selector/cámara solo en dispositivo |
| Recordatorios locales con texto neutro | ✅ lógica · ⚠️ no verificado en teléfono |
| Estadísticas descriptivas y gráficos | ✅ |
| Informe PDF (período, tablas, gráfico, advertencia) | ✅ plantilla/PDF · ⚠️ `expo-print` no verificado en teléfono |
| Copia de seguridad cifrada (scrypt + XChaCha20-Poly1305) y restauración como perfil nuevo | ✅ |
| Bloqueo de la app con biometría/código | ⚠️ no verificado en teléfono |
| Cuentas familiares y permisos (modelo local) | ✅ local · ❌ acceso desde otro dispositivo |
| Sincronización entre dispositivos | ❌ **no implementada** (solo esquema servidor + RLS probados) |

Detalle completo y limitaciones: [`documentacion/KNOWN_ISSUES.md`](documentacion/KNOWN_ISSUES.md).

## Requisitos

- Node.js 22+ y npm. Para instalar en un teléfono: Expo Go (pruebas rápidas) o una compilación con EAS.
- Para las pruebas RLS: PostgreSQL 14+ (`initdb`, `pg_ctl`, `psql`). Para PDF: Chromium y `pdftotext`.

## Instalación y ejecución

```bash
npm install --legacy-peer-deps   # el flag evita conflictos de peer deps entre paquetes de Expo
npx expo start                   # escanee el QR con Expo Go, o pulse a (Android) / i (iOS)
```

## Comprobaciones

```bash
npm run typecheck   # TypeScript estricto
npm run lint
npm test            # Jest: datos, seguridad, dominio, notificaciones, UI con SQLite real
npm run test:tz     # las pruebas de dominio en 5 zonas horarias
npm run test:rls    # políticas de PostgreSQL/Supabase contra un Postgres temporal
npm run test:pdf    # genera un informe, lo imprime a PDF con Chromium y comprueba su texto
npm run test:e2e    # recorrido completo en Chromium con SQLite real (WASM) y capturas
npm run test:pwa    # web instalable: service worker, sin internet y aviso «Hay una versión nueva»
```

## Instalar en el teléfono (igual que Dulza)

La app se publica como **web instalable (PWA)** en GitHub Pages: se instala abriendo un enlace y no hace falta terminal ni tienda.

1. **Una sola vez** (quien administra el repositorio): *Settings → Pages → Build and deployment → Source: **Deploy from a branch** → Branch: **main** / carpeta **/docs** → Save* (la misma opción que Dulza, pero eligiendo `/docs` en lugar de `/(root)`). En uno o dos minutos queda en `https://rivcarii.github.io/NEUROCALENDARIO/`. Si en cambio se elige `/(root)`, solo se verá el README: la app compilada está en `docs/`.
2. **En el teléfono**, abra ese enlace.
   - **iPhone**: en **Safari** → Compartir → **Agregar a pantalla de inicio**.
   - **Android**: en Chrome → menú ⋮ → **Instalar app** (o **Más → Instalar en este teléfono** dentro de la app).
3. **Actualizaciones**: cada cambio de código en `main` compila y guarda la web en `docs/` (flujo `Publicar web`), y eso publica una versión nueva. La app instalada la detecta al abrirse, al volver a primer plano y cada 10 minutos, y muestra la ventana **«Hay una versión nueva de NeuroCalendario» → Actualizar ahora / Más tarde**. Los datos no se tocan. También puede forzarlo en *Más → Privacidad y ajustes → Buscar actualizaciones*.

Probar la web en su computadora: `npm run web`. Para publicar a mano: `EXPO_BASE_URL=/NEUROCALENDARIO ./scripts/build-web.sh docs` y luego commit y push de `docs/`. La documentación del proyecto está en `documentacion/`.

**Qué cambia en la versión instalada desde el navegador** (la app compilada de Android/iPhone sí lo tiene completo):
- Los **avisos** de medicinas y citas solo suenan **con la app abierta** (un navegador no puede programar avisos con la app cerrada).
- No se pueden **adjuntar documentos ni fotos**.
- El **resumen para el médico** se guarda desde la ventana de impresión («Guardar como PDF»).
- El **respaldo** se descarga a «Descargas» y no incluye adjuntos.
- Cada dispositivo tiene sus propios datos (se pasan con el respaldo).

**App nativa (opcional, para avisos con la app cerrada y adjuntos):** `npx eas-cli@latest build --platform android --profile preview` genera un APK con enlace de descarga (cuenta gratuita de Expo).

## Crear perfiles

1. Primer inicio: escriba su nombre (propietario) y el de la persona principal (p. ej. mamá). Se crea su perfil.
2. **Más → Perfiles → Crear perfil nuevo** para su perfil personal u otros. Cada uno tiene calendario, episodios, medicación, citas, exámenes, documentos e informes **independientes**.
3. La franja de color superior muestra siempre a quién pertenecen los datos; los formularios dicen «Se guardará en: …».

## Copia de seguridad y restauración

**Más → Copias de seguridad.** Se crea un archivo `.ncbackup` cifrado con su contraseña (mínimo 10 caracteres) del perfil activo, con sus documentos. **Sin la contraseña no se puede recuperar.** Restaurar crea un perfil *nuevo* «… (restaurado)»; nunca sobrescribe datos existentes.

## Recuperación ante problemas

- La app no abre y muestra un error de base de datos: no desinstale (se perderían los datos). Cierre y reabra; si persiste, restaure una copia en una instalación nueva.
- Los datos viven en el almacenamiento privado de la app. **Desinstalar la app borra todo**: haga copias periódicas.

## Documentación

[`documentacion/ARCHITECTURE.md`](documentacion/ARCHITECTURE.md) · [`documentacion/DATA_MODEL.md`](documentacion/DATA_MODEL.md) · [`documentacion/SECURITY.md`](documentacion/SECURITY.md) · [`documentacion/PRIVACY.md`](documentacion/PRIVACY.md) · [`documentacion/TEST_PLAN.md`](documentacion/TEST_PLAN.md) · [`documentacion/CHANGELOG.md`](documentacion/CHANGELOG.md) · [`documentacion/KNOWN_ISSUES.md`](documentacion/KNOWN_ISSUES.md)
