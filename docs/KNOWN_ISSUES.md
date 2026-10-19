# Problemas conocidos y limitaciones

## Antes de usar datos reales
La app **está lista para pruebas**, no para uso médico real, hasta completar:
- [ ] La lista de comprobación manual de `docs/TEST_PLAN.md` (notificaciones, adjuntos, PDF, copia/restauración, bloqueo) en SU teléfono.
- [ ] Bloqueo de pantalla y cifrado del teléfono activos; copia de seguridad restaurada con éxito al menos una vez.
- [ ] Consentimiento de la persona cuyos datos se registran (mamá).

## No disponible
| Función | Situación |
|---|---|
| Sincronización entre dispositivos y acceso de mamá desde otro teléfono | **No implementada.** Hay esquema + RLS probados; faltan autenticación, cliente de sincronización, resolución de conflictos y cifrado de extremo a extremo. Las cuentas familiares son solo un modelo local. |
| Cambio de cuenta/usuario en la app | No expuesto en la UI (siempre actúa el propietario). |
| Catálogo de síntomas editable | Reservado en la base; la UI usa listas integradas y texto libre. |
| Iconos y *splash* | Son los de la plantilla de Expo; hay que reemplazarlos. |
| Idioma | Solo español. |

## Parcialmente verificado (necesita teléfono)
- **Notificaciones**: la lógica de programación está probada con un simulador; no se comprobó la entrega real. Android 12+ puede requerir permiso de «alarmas y recordatorios»; el ahorro de batería puede retrasarlas; tras reiniciar el teléfono debe comprobarse. iOS limita a 64 pendientes (la app programa 60).
- **expo-sqlite nativo**: la lógica corre en Node (`node:sqlite`) y en navegador (WASM, `expo-sqlite`); el motor nativo de Android/iOS no se ejecutó aquí.
- **expo-print / expo-sharing / selector de documentos / cámara / biometría**: solo comprobados por compilación de tipos y bundle.
- **Rendimiento del cifrado de copias** (scrypt en JS puro): puede tardar varios segundos en teléfonos modestos y bloquea la interfaz mientras tanto.

## Defectos menores conocidos
- La pantalla «Hoy» no se actualiza sola al pasar la medianoche con la app abierta (se refresca al volver a ella).
- Cambiar el perfil activo mientras un formulario está abierto: el guardado se bloquea con un aviso (por diseño); no hay prueba automática de ese caso.
- Una toma marcada tarde no registra la hora exacta de la toma programada vs real salvo «tomada ahora».
- Los informes muestran «sin hora de fin» en episodios sin fin; las estadísticas de duración excluyen esos episodios (se indica el denominador).
- En iOS los adjuntos pueden incluirse en copias de iCloud del dispositivo.
- 4 avisos de ESLint (uso de `require` en mocks de pruebas y una advertencia del compilador de React sobre `watch()` de react-hook-form).

## Riesgos de seguridad residuales
Ver `docs/SECURITY.md` (SQLite sin cifrar, cuentas locales sin autenticación, RLS probado solo en Postgres local, archivos compartidos fuera de control).
