/* NeuroCalendario · service worker (generado por scripts/build-pwa.mjs; no editar a mano)
   Guarda la app en el dispositivo para abrir al instante y funcionar sin internet.
   Cada publicación cambia VERSION, así los dispositivos descargan la actualización y la app avisa. */
const VERSION = "nc-0.1.0+cd1ff67";
const ASSETS = ["_expo/static/js/web/[id]-1ce18c8bbfd9a9256bde042dcc6c1bbd.js","_expo/static/js/web/[id]-351ea36d64b6f8abee3b8c3a2df7bbb5.js","_expo/static/js/web/[id]-6d5a2d2bbea50b1bac2045c3673049b8.js","_expo/static/js/web/[id]-9dbb1846c528152ac01295359346943f.js","_expo/static/js/web/[id]-b44fe3162aadb49178e1e9c7d8587d86.js","_expo/static/js/web/[id]-d08de3e22ceb097695af428df3c0cd84.js","_expo/static/js/web/__common-980930d89a6efafd82178d1dac3c2283.js","_expo/static/js/web/__expo-metro-runtime-8c088df87a31e4e6accd81c554ec290d.js","_expo/static/js/web/_layout-649f30a8866ab95945cf10d20bb53d8a.js","_expo/static/js/web/_layout-cb9536d4dcc6d3e7a6302fe494da9c0b.js","_expo/static/js/web/acceso-3c4b1f9f328372f5453b8a1ad29e5914.js","_expo/static/js/web/acerca-b42873de12354f60aeea3372e7cd197f.js","_expo/static/js/web/ajustes-b9afa0a682af295fabc681588f67f7c9.js","_expo/static/js/web/analisis-c3ca2870c931504a431984f4fd7afce0.js","_expo/static/js/web/calendario-ce120c70eefcb9155c497c794fffe2bc.js","_expo/static/js/web/citas-05ddb59da29cbd9501059899952ef505.js","_expo/static/js/web/documentos-16e52c78d9af11813d87b1d1290f2216.js","_expo/static/js/web/entry-317d2706b3a25ed4a67be5e95fb89f06.js","_expo/static/js/web/episodios-3e10a3746d0a2af81617b8ec956cf994.js","_expo/static/js/web/estadisticas-ecd29eabb37805568cf33a473606e955.js","_expo/static/js/web/examenes-35bba7c0d8da9d415baf694c845f468f.js","_expo/static/js/web/index-b62726690ae76c4058810cf2520a6052.js","_expo/static/js/web/informes-7c2b917adc5102bc3366761e506e3738.js","_expo/static/js/web/instalar-4c42d32378d520af942653b465fbb848.js","_expo/static/js/web/mas-4c9fe56230b109eb13d5939d42757e68.js","_expo/static/js/web/medicacion-850c66a673df03f056f101fca915da30.js","_expo/static/js/web/notas-b4ca3bf08da713b182f8e87fc9a5f534.js","_expo/static/js/web/perfiles-be741d228bee60c9008ee807cb9c7238.js","_expo/static/js/web/reportPdf-562f3cf1b229d1931ac24ce3061aaa9f.js","_expo/static/js/web/respaldo-d0363503960c24b69b8f413a172ba686.js","_expo/static/js/web/worker-d3090a1c5cb48556d5a7219b003bcafa.js","apple-touch-icon.png","assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.b4eb097d35f44ed943676fd56f6bdc51.ttf","assets/node_modules/expo-router/assets/arrow_down.017bc6ba3fc25503e5eb5e53826d48a8.png","assets/node_modules/expo-router/assets/error.d1ea1496f9057eb392d5bbf3732a61b7.png","assets/node_modules/expo-router/assets/file.19eeb73b9593a38f8e9f418337fc7d10.png","assets/node_modules/expo-router/assets/forward.d8b800c443b8972542883e0b9de2bdc6.png","assets/node_modules/expo-router/assets/pkg.ab19f4cbc543357183a20571f68380a3.png","assets/node_modules/expo-router/assets/react-navigation/elements/back-icon-mask.0a328cd9c1afd0afe8e3b1ec5165b1b4.png","assets/node_modules/expo-router/assets/react-navigation/elements/back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@2x.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@3x.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@4x.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@2x.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@3x.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@4x.png","assets/node_modules/expo-router/assets/react-navigation/elements/search-icon.286d67d3f74808a60a78d3ebf1a5fb57.png","assets/node_modules/expo-router/assets/sitemap.412dd9275b6b48ad28f5e3d81bb1f626.png","assets/node_modules/expo-router/assets/unmatched.20e71bdf79e3a97bf55fd9e164041578.png","assets/node_modules/expo-sqlite/web/wa-sqlite/wa-sqlite.5e61fe84c4a4f49e0b1a33661b45c791.wasm","favicon.ico","icon-192.png","icon-512.png","icon-maskable-512.png","index.html","manifest.webmanifest","metadata.json"];
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
