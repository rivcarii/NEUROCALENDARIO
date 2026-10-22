/* NeuroCalendario · service worker (generado por scripts/build-pwa.mjs; no editar a mano)
   Guarda la app en el dispositivo para abrir al instante y funcionar sin internet.
   Cada publicación cambia VERSION, así los dispositivos descargan la actualización y la app avisa. */
const VERSION = "nc-0.1.0+c40b6d1";
const ASSETS = ["_expo/static/js/web/[id]-31e4d0760718ff4e9b8b9b50ebdb3b9b.js","_expo/static/js/web/[id]-4894815e5ef32933fc1f36403a2c1d27.js","_expo/static/js/web/[id]-54eeb914a7c42f0096a0ea305cf8d3e9.js","_expo/static/js/web/[id]-9de61563c4338804dee4b22e152d8ede.js","_expo/static/js/web/[id]-b14efb0114ec9847254a06d108dc0ee9.js","_expo/static/js/web/[id]-ba0f0609de555565b1774ade261a83e4.js","_expo/static/js/web/__common-3705b66ee5b0f5aff6c845803171294a.js","_expo/static/js/web/__expo-metro-runtime-8c088df87a31e4e6accd81c554ec290d.js","_expo/static/js/web/_layout-649f30a8866ab95945cf10d20bb53d8a.js","_expo/static/js/web/_layout-cb9536d4dcc6d3e7a6302fe494da9c0b.js","_expo/static/js/web/acceso-de22a1c2e76f486889f4b1fe57600beb.js","_expo/static/js/web/acerca-b42873de12354f60aeea3372e7cd197f.js","_expo/static/js/web/ajustes-f9474a264c6e2b97cd25bc531375186f.js","_expo/static/js/web/analisis-c3ca2870c931504a431984f4fd7afce0.js","_expo/static/js/web/calendario-ce120c70eefcb9155c497c794fffe2bc.js","_expo/static/js/web/citas-05ddb59da29cbd9501059899952ef505.js","_expo/static/js/web/documentos-d694b145ef688de699f9962350fb7bb4.js","_expo/static/js/web/entry-a7161fa857acc672e6a30a000e305f09.js","_expo/static/js/web/episodios-3e10a3746d0a2af81617b8ec956cf994.js","_expo/static/js/web/estadisticas-ecd29eabb37805568cf33a473606e955.js","_expo/static/js/web/examenes-35bba7c0d8da9d415baf694c845f468f.js","_expo/static/js/web/index-f60236434dd373b7a38682716b285d78.js","_expo/static/js/web/informes-7bd54bd579905ad234699b7da3cd2045.js","_expo/static/js/web/instalar-4c42d32378d520af942653b465fbb848.js","_expo/static/js/web/mas-4c9fe56230b109eb13d5939d42757e68.js","_expo/static/js/web/medicacion-850c66a673df03f056f101fca915da30.js","_expo/static/js/web/notas-b4ca3bf08da713b182f8e87fc9a5f534.js","_expo/static/js/web/perfiles-8e25822a13e6ef9f3c2bb86f5a6ce178.js","_expo/static/js/web/reportPdf-562f3cf1b229d1931ac24ce3061aaa9f.js","_expo/static/js/web/respaldo-21472ba862c425d44cde34f7420f316f.js","_expo/static/js/web/worker-d3090a1c5cb48556d5a7219b003bcafa.js","apple-touch-icon.png","assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.b4eb097d35f44ed943676fd56f6bdc51.ttf","assets/node_modules/expo-router/assets/arrow_down.017bc6ba3fc25503e5eb5e53826d48a8.png","assets/node_modules/expo-router/assets/error.d1ea1496f9057eb392d5bbf3732a61b7.png","assets/node_modules/expo-router/assets/file.19eeb73b9593a38f8e9f418337fc7d10.png","assets/node_modules/expo-router/assets/forward.d8b800c443b8972542883e0b9de2bdc6.png","assets/node_modules/expo-router/assets/pkg.ab19f4cbc543357183a20571f68380a3.png","assets/node_modules/expo-router/assets/react-navigation/elements/back-icon-mask.0a328cd9c1afd0afe8e3b1ec5165b1b4.png","assets/node_modules/expo-router/assets/react-navigation/elements/back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@2x.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@3x.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@4x.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@2x.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@3x.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@4x.png","assets/node_modules/expo-router/assets/react-navigation/elements/search-icon.286d67d3f74808a60a78d3ebf1a5fb57.png","assets/node_modules/expo-router/assets/sitemap.412dd9275b6b48ad28f5e3d81bb1f626.png","assets/node_modules/expo-router/assets/unmatched.20e71bdf79e3a97bf55fd9e164041578.png","assets/node_modules/expo-sqlite/web/wa-sqlite/wa-sqlite.5e61fe84c4a4f49e0b1a33661b45c791.wasm","favicon.ico","icon-192.png","icon-512.png","icon-maskable-512.png","index.html","manifest.webmanifest","metadata.json"];
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
