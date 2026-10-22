# Avisos en el teléfono (con la app cerrada)

## Cómo funciona
| Plataforma | Mecanismo |
| --- | --- |
| App nativa (Android/iPhone, compilada con EAS) | Avisos **locales** del sistema (`expo-notifications`), sin servidor. |
| Versión web instalada (PWA) en iPhone (iOS 16.4+, agregada a la pantalla de inicio) y Android | **Web Push** con el servicio propio `push-worker/` (Cloudflare Workers + D1, plan gratuito). |

1. En **Más → Privacidad y ajustes → Avisos en este teléfono → Activar avisos**, el teléfono pide permiso y crea una suscripción push.
2. La app envía al servicio la suscripción y las **horas** de los próximos avisos (hasta 8 días, máx. 300) con un identificador opaco (`m3-lq2x…`). Se reenvía cada vez que se abre la app o cambian medicinas/citas.
3. Cada minuto el servicio revisa qué avisos vencen y manda un push cifrado (RFC 8291) firmado con VAPID (RFC 8292) que solo contiene `{ ref, at }`.
4. El service worker del teléfono busca el texto de ese `ref` en su caché local (`ncpush-textos`) y muestra el aviso. Si «mostrar detalles» está apagado, el texto es genérico.

## Privacidad
- El servicio **no recibe** nombres de medicinas, citas, síntomas ni personas: solo la dirección de push del navegador (Apple/Google/Mozilla) y horas.
- Las claves VAPID se generan dentro del propio servicio y se guardan en su base D1.
- Suscripciones sin sincronizar en 60 días y avisos vencidos hace más de 30 min se borran.
- Solo acepta peticiones desde la app publicada y endpoints de servicios push conocidos.

## Puesta en marcha (una vez)
1. Base D1 `neurocalendario-push` (ya creada, id en `push-worker/wrangler.toml`).
2. En Cloudflare: **My Profile → API Tokens → Create Token → plantilla «Edit Cloudflare Workers»**, añadiendo el permiso **Account · D1 · Edit**.
3. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**: `CLOUDFLARE_API_TOKEN` (el token) y `CLOUDFLARE_ACCOUNT_ID` (el «Account ID» que aparece en la página principal de Workers & Pages).
4. Volver a ejecutar **Actions → Publicar web → Run workflow**. El flujo publica el servicio, toma su URL (`https://neurocalendario-push.<subdominio>.workers.dev`) y la incluye en la web.

Sin esos secretos la web sigue funcionando; en Ajustes aparece «El servicio de avisos aún no está configurado».

## Límites
- Puede haber hasta ~1 minuto de retraso (más si el teléfono está en ahorro de energía). No es una alarma médica.
- En iPhone solo funciona con la app abierta desde el icono de la pantalla de inicio.
- Los horarios se envían al abrir la app: si no se abre en 8 días, dejan de llegar avisos hasta la próxima apertura.

## Pruebas
- `cd push-worker && npm test`: descifra los avisos con la librería de referencia `http_ece` y verifica la firma VAPID.
- Se probó el servicio en local (`wrangler dev --test-scheduled`): rechaza endpoints desconocidos, registra horarios y ejecuta la revisión por minuto.
- **No probado aún**: entrega real a un iPhone/Android (necesita el servicio publicado).
