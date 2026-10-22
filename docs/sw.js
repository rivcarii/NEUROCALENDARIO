/* NeuroCalendario · service worker (generado por scripts/build-pwa.mjs; no editar a mano)
   Guarda la app en el dispositivo para abrir al instante y funcionar sin internet.
   Cada publicación cambia VERSION, así los dispositivos descargan la actualización y la app avisa. */
const VERSION = "nc-0.1.0+4b9c708";
const ASSETS = ["_expo/static/js/web/[id]-01bc5ec78477e810e6e48cd2b28e8dc8.js","_expo/static/js/web/[id]-31e4d0760718ff4e9b8b9b50ebdb3b9b.js","_expo/static/js/web/[id]-4894815e5ef32933fc1f36403a2c1d27.js","_expo/static/js/web/[id]-562bf1a039bf9e809c9bac34d2ef2cfd.js","_expo/static/js/web/[id]-ba0f0609de555565b1774ade261a83e4.js","_expo/static/js/web/[id]-f11d5d19e73e640dec0ae102b6b5ee96.js","_expo/static/js/web/__common-8f59a0ac897d2eda5119b18fbc25b18c.js","_expo/static/js/web/__expo-metro-runtime-8c088df87a31e4e6accd81c554ec290d.js","_expo/static/js/web/_layout-13222b9f1baf1de3e1077d96726e468c.js","_expo/static/js/web/_layout-cb9536d4dcc6d3e7a6302fe494da9c0b.js","_expo/static/js/web/acceso-de22a1c2e76f486889f4b1fe57600beb.js","_expo/static/js/web/acerca-88a1ddbd35b2fcf6b068f88d20c6102a.js","_expo/static/js/web/ajustes-ade2189343276f6c26dc0ef8d4219f0f.js","_expo/static/js/web/analisis-c70c7d116bd6a88af7618169a91d6137.js","_expo/static/js/web/calendario-ce120c70eefcb9155c497c794fffe2bc.js","_expo/static/js/web/citas-05ddb59da29cbd9501059899952ef505.js","_expo/static/js/web/documentos-ed599c7e51fddebfc5034d3031d06587.js","_expo/static/js/web/entry-7ca18fa3d60251dd3456b06cf31ee276.js","_expo/static/js/web/episodios-3e10a3746d0a2af81617b8ec956cf994.js","_expo/static/js/web/estadisticas-f303995000c1bd59f302b2d46b8a8f86.js","_expo/static/js/web/examenes-35bba7c0d8da9d415baf694c845f468f.js","_expo/static/js/web/index-623ef208ae446a781de5f7ae3ea35042.js","_expo/static/js/web/informes-64d0f5c358dbcafa99e968c6dd012515.js","_expo/static/js/web/instalar-3ad67d92378d12470e9e0232a49af16d.js","_expo/static/js/web/mas-02c63590e8ba9e3c7a78763aafb83e91.js","_expo/static/js/web/medicacion-850c66a673df03f056f101fca915da30.js","_expo/static/js/web/notas-b4ca3bf08da713b182f8e87fc9a5f534.js","_expo/static/js/web/perfiles-8e25822a13e6ef9f3c2bb86f5a6ce178.js","_expo/static/js/web/reportPdf-0d99adaed9cc590aa4a5903b990e6335.js","_expo/static/js/web/respaldo-a11135439ab708942de423242a1d0a05.js","_expo/static/js/web/worker-d63368801549214d33edc1c5657bd981.js","apple-touch-icon.png","assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.b4eb097d35f44ed943676fd56f6bdc51.ttf","assets/node_modules/expo-router/assets/arrow_down.017bc6ba3fc25503e5eb5e53826d48a8.png","assets/node_modules/expo-router/assets/error.d1ea1496f9057eb392d5bbf3732a61b7.png","assets/node_modules/expo-router/assets/file.19eeb73b9593a38f8e9f418337fc7d10.png","assets/node_modules/expo-router/assets/forward.d8b800c443b8972542883e0b9de2bdc6.png","assets/node_modules/expo-router/assets/pkg.ab19f4cbc543357183a20571f68380a3.png","assets/node_modules/expo-router/assets/react-navigation/elements/back-icon-mask.0a328cd9c1afd0afe8e3b1ec5165b1b4.png","assets/node_modules/expo-router/assets/react-navigation/elements/back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@2x.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@3x.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@4x.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@2x.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@3x.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@4x.png","assets/node_modules/expo-router/assets/react-navigation/elements/search-icon.286d67d3f74808a60a78d3ebf1a5fb57.png","assets/node_modules/expo-router/assets/sitemap.412dd9275b6b48ad28f5e3d81bb1f626.png","assets/node_modules/expo-router/assets/unmatched.20e71bdf79e3a97bf55fd9e164041578.png","assets/node_modules/expo-sqlite/web/wa-sqlite/wa-sqlite.5e61fe84c4a4f49e0b1a33661b45c791.wasm","favicon.ico","icon-192.png","icon-512.png","icon-maskable-512.png","index.html","manifest.webmanifest","metadata.json"];
const SCOPE = self.registration.scope;

self.addEventListener('install', (event) => {
  // cache: 'reload' salta la caché HTTP (GitHub Pages guarda 10 min): nunca se mezclan archivos de dos versiones
  event.waitUntil(
    caches.open(VERSION).then((cache) =>
      Promise.all(ASSETS.map((url) =>
        fetch(new Request(new URL(url, SCOPE), { cache: 'reload' })).then((res) => {
          if (!res.ok) throw new Error(res.status + ' ' + url);
          return cache.put(new URL(url, SCOPE).href, res);
        })
      ))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('nc-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Avisos con la app cerrada (Web Push). El servicio solo manda un identificador; el texto se busca aquí, en el dispositivo.
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }
  event.waitUntil((async () => {
    let title = 'NeuroCalendario';
    let body = 'Tiene un recordatorio pendiente.';
    if (data.ref === 'prueba') body = 'Aviso de prueba: los recordatorios llegan a este teléfono.';
    else {
      try {
        const c = await caches.open('ncpush-textos');
        const r = await c.match(new URL('__push-texts.json', SCOPE).href);
        const t = r ? (await r.json())[data.ref] : null;
        if (t) { title = t.title; body = t.body; }
      } catch (e) { /* texto genérico */ }
    }
    await self.registration.showNotification(title, { body, icon: new URL('icon-192.png', SCOPE).href, badge: new URL('icon-192.png', SCOPE).href, tag: data.ref || 'nc', data: { url: SCOPE } });
  })());
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
    for (const w of ws) if ('focus' in w) return w.focus();
    return self.clients.openWindow(SCOPE);
  }));
});

// La app decide cuándo activar la versión nueva (cuando la persona pulsa «Actualizar ahora»).
self.addEventListener('message', (event) => { if (event.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith('/version.json')) return; // siempre desde internet: así se detectan versiones nuevas
  if (req.mode === 'navigate') {
    // app de una sola página: cualquier ruta abre index.html guardado
    event.respondWith(caches.match(new URL('index.html', SCOPE).href).then((r) => r || fetch(req)));
    return;
  }
  // iconos y manifiesto llevan ?v=<huella>: se buscan en la caché sin la consulta
  const ignoreSearch = /\.(png|webmanifest)$/.test(url.pathname);
  event.respondWith(caches.match(req, { ignoreSearch }).then((hit) => hit || fetch(req)));
});
