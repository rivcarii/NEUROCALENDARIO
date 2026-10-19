# Registro de cambios

## 0.1.0 — 19-oct-2026 (versión de pruebas)
- Aplicación base Expo SDK 58 / React Native 0.88 con Expo Router y TypeScript estricto.
- Datos locales en SQLite con migraciones versionadas, transacciones, auditoría sin contenido clínico.
- Perfiles independientes, permisos por perfil (`read`/`write`/`admin`), cuentas familiares (modelo local).
- Hoy, calendario (mes/semana/día), episodios (rápido/completo), medicación y tomas, citas, exámenes, documentos, notas.
- Recordatorios locales (texto neutro por defecto).
- Estadísticas descriptivas, gráficos, informe PDF.
- Copias cifradas (scrypt + XChaCha20-Poly1305) y restauración a perfil nuevo.
- Bloqueo biométrico opcional.
- Esquema Supabase con RLS y bucket privado (sin cliente de sincronización).
- Pruebas: unitarias, seguridad, UI, RLS (PostgreSQL real), PDF, E2E en navegador.

### Revisión con skills (accesibilidad, textos, háptica)
- Accesibilidad (WCAG 2.1 AA): textos pulsables sin rol ni área táctil → `TapText` (≥44 px, rol de botón); chips de intensidad se anuncian «6 de 10».
- Textos: confirmaciones como pregunta con la acción como botón («¿Eliminar episodio?» → «Eliminar» / «Conservar»).
- Háptica ligera al marcar tomas y al registro rápido (`expo-haptics`).

### Diseño y movimiento
- Tipografías: Fraunces (títulos) + Atkinson Hyperlegible (cuerpo). Ver `docs/DESIGN_SYSTEM.md`.
- Iconos vectoriales en las pestañas (antes caracteres de texto).
- Movimiento: escala al pulsar y transición de color con Reanimated; sin animación en pestañas ni listas; respeta «reducir movimiento».
- Tokens de radio/movimiento; colores fijos sustituidos por tokens.

### Lenguaje cercano y mascota
- Términos técnicos sustituidos por los que usan los pacientes (ver `docs/LENGUAJE.md`): «episodio» → «síntoma», «intensidad subjetiva» → «¿qué tan fuerte fue?», «medicación/pauta/prescrito» → «medicinas/horarios/recetada», «tomada/omitida» → «la tomé/no la tomé», «informe PDF» → «resumen para el médico», «perfil» → «persona», «copia de seguridad/restaurar» → «respaldo/recuperar»…
- Mascota **Nuri** (neurona amable): bienvenida, listas vacías y «todo al día»; iconos de la app y pantalla de inicio. Ver `docs/MASCOTA.md`.

### Defectos encontrados y corregidos durante el desarrollo
- Restaurar una copia reutilizaba la ruta de los adjuntos del original: borrar un documento en un perfil podía borrar el archivo del otro. **Ahora se generan rutas nuevas** (con prueba).
- Una copia sin `data` provocaba una excepción interna en lugar de un error de validación.
- Tras crear un perfil nuevo no pasaba a ser el activo (comparaba con una lista obsoleta en memoria). Detectado por el E2E.
- La política de Storage permitía claves como `<perfil>/../<otro>/x.pdf`; ahora exige ruta estricta (detectado por la prueba RLS).
- `Alert.alert` no mostraba confirmaciones en web; se usa `window.confirm` allí.
- Un documento podía apuntar a la ruta de un archivo de OTRO perfil (y «Abrir» lo habría compartido). Ahora la ruta debe estar en la carpeta del propio perfil, validado en la capa de datos y en el servicio de archivos (con prueba).
- Color de perfil verde con contraste insuficiente (4,3:1) → oscurecido (guardado por prueba).
