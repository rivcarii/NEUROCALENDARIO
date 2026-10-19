/* NeuroCalendario · service worker (generado por scripts/build-pwa.mjs; no editar a mano)
   Guarda la app en el dispositivo para abrir al instante y funcionar sin internet.
   Cada publicación cambia VERSION, así los dispositivos descargan la actualización y la app avisa. */
const VERSION = "nc-0.1.0+4877a00";
const ASSETS = ["_expo/static/js/web/[id]-7d5915d3c2758937e6f130f2c190e79a.js","_expo/static/js/web/[id]-874e056c24bb92ce8a1f0dc488682a23.js","_expo/static/js/web/[id]-8a9d2cf2245db25725fe3e9f29b552f2.js","_expo/static/js/web/[id]-ab1e9efb1bb0a468a75d81fc4e2b87a6.js","_expo/static/js/web/[id]-acb3276419b3dd4282da2d08eb8957a0.js","_expo/static/js/web/[id]-e175daeedc734673010e615a92b5173c.js","_expo/static/js/web/__common-28019514ea5190577c0700b9ee146da9.js","_expo/static/js/web/__expo-metro-runtime-8c088df87a31e4e6accd81c554ec290d.js","_expo/static/js/web/_layout-65b34b9215fd847c4edbc8ea0f2b60a1.js","_expo/static/js/web/_layout-87ea5129a07c889f26b4878682b7f44c.js","_expo/static/js/web/acceso-7721b726fc0a4cc85eb0cbb5e0b39562.js","_expo/static/js/web/acerca-2c8d74f21d7f47622b57c8e59343c93d.js","_expo/static/js/web/ajustes-1314e2733a376adcde82488c6d288eb3.js","_expo/static/js/web/calendario-291e0eb6d8b22fae5f6910d856009415.js","_expo/static/js/web/citas-de4a979e1863e1071cff2612c835bc88.js","_expo/static/js/web/documentos-ff3b545d3b2e9c33369fe7d062e4aedf.js","_expo/static/js/web/entry-5ffb49f80f0343e3a173e9cd2f0f525d.js","_expo/static/js/web/episodios-ac1926c0acad040e695746d5d94859aa.js","_expo/static/js/web/estadisticas-a472b40affc335d44ee24bbc685e777b.js","_expo/static/js/web/examenes-81b62b786f9764cef7d3376c8f703a70.js","_expo/static/js/web/index-3da1d84e369ee796af1bc3634e0bf0ae.js","_expo/static/js/web/informes-e0cb1a60abeb57b25f5c134ea58e525a.js","_expo/static/js/web/instalar-15f671301dc8562ef0735b9aab8488b4.js","_expo/static/js/web/mas-8d8e53d1fbf96a015a19463b6d607213.js","_expo/static/js/web/medicacion-33b91142da3bd26b410397c796328afa.js","_expo/static/js/web/notas-f4dee7d814627e675bded25790207910.js","_expo/static/js/web/perfiles-7da59adb5a2755f642d84af32191c035.js","_expo/static/js/web/respaldo-fc1c37df325aad16724160997c626782.js","_expo/static/js/web/worker-05848f176b52885c1f817acc2938ad98.js","apple-touch-icon.png","assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.b4eb097d35f44ed943676fd56f6bdc51.ttf","assets/node_modules/@expo-google-fonts/atkinson-hyperlegible/400Regular/AtkinsonHyperlegible_400Regular.59f0f5543754fa6b68a563036eafaaab.ttf","assets/node_modules/@expo-google-fonts/atkinson-hyperlegible/400Regular_Italic/AtkinsonHyperlegible_400Regular_Italic.2badbc897377af4c75f1536a29e24231.ttf","assets/node_modules/@expo-google-fonts/atkinson-hyperlegible/700Bold/AtkinsonHyperlegible_700Bold.f2193e9c742b9554852a3000f0ccdc9c.ttf","assets/node_modules/@expo-google-fonts/atkinson-hyperlegible/700Bold_Italic/AtkinsonHyperlegible_700Bold_Italic.1d9aff33518db56f83412a331c653888.ttf","assets/node_modules/@expo-google-fonts/fraunces/100Thin/Fraunces_100Thin.2cbb9a3b3bbda5192ffe28bf04d6b29d.ttf","assets/node_modules/@expo-google-fonts/fraunces/100Thin_Italic/Fraunces_100Thin_Italic.6b4cab9b1863ed1cbb96c2cdd8276a26.ttf","assets/node_modules/@expo-google-fonts/fraunces/200ExtraLight/Fraunces_200ExtraLight.073905a75e6d90aaee9f7fe82157a0b6.ttf","assets/node_modules/@expo-google-fonts/fraunces/200ExtraLight_Italic/Fraunces_200ExtraLight_Italic.5b31322f6198efae6d40650ab8a3623b.ttf","assets/node_modules/@expo-google-fonts/fraunces/300Light/Fraunces_300Light.5e37aa8e672db18ba0f7c4d6789cf5ef.ttf","assets/node_modules/@expo-google-fonts/fraunces/300Light_Italic/Fraunces_300Light_Italic.f2bb3f7e850840f830024567570d5c3e.ttf","assets/node_modules/@expo-google-fonts/fraunces/400Regular/Fraunces_400Regular.d484e2f727663ddd31e7fcebc7cc25ea.ttf","assets/node_modules/@expo-google-fonts/fraunces/400Regular_Italic/Fraunces_400Regular_Italic.65805d7e2c7f9bad1bf1fa5ccbc7df26.ttf","assets/node_modules/@expo-google-fonts/fraunces/500Medium/Fraunces_500Medium.d1acf82088f232372c997dbadbc3f405.ttf","assets/node_modules/@expo-google-fonts/fraunces/500Medium_Italic/Fraunces_500Medium_Italic.0f15c5ff3dbf7b54423fe98d18069ab2.ttf","assets/node_modules/@expo-google-fonts/fraunces/600SemiBold/Fraunces_600SemiBold.e995588822b0867215ce518a9a79175b.ttf","assets/node_modules/@expo-google-fonts/fraunces/600SemiBold_Italic/Fraunces_600SemiBold_Italic.d3386675410283c88aedd87637eb5741.ttf","assets/node_modules/@expo-google-fonts/fraunces/700Bold/Fraunces_700Bold.0c859ce19af0584bccfc6941addedf34.ttf","assets/node_modules/@expo-google-fonts/fraunces/700Bold_Italic/Fraunces_700Bold_Italic.c051d8ea6e94f62ad79ed57304d75165.ttf","assets/node_modules/@expo-google-fonts/fraunces/800ExtraBold/Fraunces_800ExtraBold.1fca6eacc1fd7d8bb65c1b3c881d057a.ttf","assets/node_modules/@expo-google-fonts/fraunces/800ExtraBold_Italic/Fraunces_800ExtraBold_Italic.5d3601dd56349d0087980d9f2cc7d14c.ttf","assets/node_modules/@expo-google-fonts/fraunces/900Black/Fraunces_900Black.64dd2eb4f9509117d7047543a3b7c46a.ttf","assets/node_modules/@expo-google-fonts/fraunces/900Black_Italic/Fraunces_900Black_Italic.6677d45b62b851f1fd8c6061ff492d9d.ttf","assets/node_modules/expo-router/assets/arrow_down.017bc6ba3fc25503e5eb5e53826d48a8.png","assets/node_modules/expo-router/assets/error.d1ea1496f9057eb392d5bbf3732a61b7.png","assets/node_modules/expo-router/assets/file.19eeb73b9593a38f8e9f418337fc7d10.png","assets/node_modules/expo-router/assets/forward.d8b800c443b8972542883e0b9de2bdc6.png","assets/node_modules/expo-router/assets/pkg.ab19f4cbc543357183a20571f68380a3.png","assets/node_modules/expo-router/assets/react-navigation/elements/back-icon-mask.0a328cd9c1afd0afe8e3b1ec5165b1b4.png","assets/node_modules/expo-router/assets/react-navigation/elements/back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@2x.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@3x.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@4x.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@2x.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@3x.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@4x.png","assets/node_modules/expo-router/assets/react-navigation/elements/search-icon.286d67d3f74808a60a78d3ebf1a5fb57.png","assets/node_modules/expo-router/assets/sitemap.412dd9275b6b48ad28f5e3d81bb1f626.png","assets/node_modules/expo-router/assets/unmatched.20e71bdf79e3a97bf55fd9e164041578.png","assets/node_modules/expo-sqlite/web/wa-sqlite/wa-sqlite.5e61fe84c4a4f49e0b1a33661b45c791.wasm","favicon.ico","icon-192.png","icon-512.png","icon-maskable-512.png","index.html","manifest.webmanifest","metadata.json"];
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
  event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
