/* NeuroCalendario · service worker (generado por scripts/build-pwa.mjs; no editar a mano)
   Guarda la app en el dispositivo para abrir al instante y funcionar sin internet.
   Cada publicación cambia VERSION, así los dispositivos descargan la actualización y la app avisa. */
const VERSION = "nc-0.1.0+58a3c14";
const ASSETS = ["_expo/static/js/web/[id]-4f9493ab1ca6549aac3bfe914643d0b5.js","_expo/static/js/web/[id]-591b6129caaa182e80a7188e33c00a6f.js","_expo/static/js/web/[id]-7171989ed6327c0cce17363ff70ae9ba.js","_expo/static/js/web/[id]-9c0c17cc4f6fcda6f7e118530bd18e7f.js","_expo/static/js/web/[id]-a4c20389c51c1bc0ea6b2bcf73cf5600.js","_expo/static/js/web/[id]-f37f12c8b40d0cad98c8b2b72011e007.js","_expo/static/js/web/__common-938eb805f876eb78d0882c7d6ce814d7.js","_expo/static/js/web/__expo-metro-runtime-8c088df87a31e4e6accd81c554ec290d.js","_expo/static/js/web/_layout-80bb573210ce4321cd97ab9e16d76dcd.js","_expo/static/js/web/_layout-cb261bb504d81f631b2ee5b218a210a3.js","_expo/static/js/web/acceso-8fb4a8ef3850479fd874568074bf60e7.js","_expo/static/js/web/acerca-709bd791cbe71c17adc2d326d3b29034.js","_expo/static/js/web/ajustes-7f77337bd6536607d1bf1a3ed861446d.js","_expo/static/js/web/calendario-a42fa0deff247f9eeb2ef8cd1658d120.js","_expo/static/js/web/citas-4c62558f7f6596e54b2ce9c87c678ecb.js","_expo/static/js/web/documentos-9229df75edad2b263be4fd4f817c8cf4.js","_expo/static/js/web/entry-e92622cbcdcf007fc2c6edb0e32fb17c.js","_expo/static/js/web/episodios-25448ac6ee2d5926ef59077a57c007c2.js","_expo/static/js/web/estadisticas-adf733afcf2c07b5608f33f87131a056.js","_expo/static/js/web/examenes-54623e6d1ccc063fded4d618f15288d8.js","_expo/static/js/web/index-234795b712b983c6330e72e70ddba303.js","_expo/static/js/web/informes-6e4460abc6fb6ab95314f20a88d83a68.js","_expo/static/js/web/instalar-9c342f912344e5f92721a1a3deb23534.js","_expo/static/js/web/mas-04122f2d56f5cedee9ee6dbc0565e42d.js","_expo/static/js/web/medicacion-a746ff93c28f39563cf7bbb11b84e9e2.js","_expo/static/js/web/notas-6c48e7fded93cd06ad1192fa7a710df6.js","_expo/static/js/web/perfiles-7717b71fd0e2f16157439ce44b0f583d.js","_expo/static/js/web/respaldo-1eb54e6cc331b03d71495b533e1dc677.js","_expo/static/js/web/worker-c857af8a4cc9e39d91d335347518a1a6.js","apple-touch-icon.png","assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.b4eb097d35f44ed943676fd56f6bdc51.ttf","assets/node_modules/@expo-google-fonts/atkinson-hyperlegible/400Regular/AtkinsonHyperlegible_400Regular.59f0f5543754fa6b68a563036eafaaab.ttf","assets/node_modules/@expo-google-fonts/atkinson-hyperlegible/400Regular_Italic/AtkinsonHyperlegible_400Regular_Italic.2badbc897377af4c75f1536a29e24231.ttf","assets/node_modules/@expo-google-fonts/atkinson-hyperlegible/700Bold/AtkinsonHyperlegible_700Bold.f2193e9c742b9554852a3000f0ccdc9c.ttf","assets/node_modules/@expo-google-fonts/atkinson-hyperlegible/700Bold_Italic/AtkinsonHyperlegible_700Bold_Italic.1d9aff33518db56f83412a331c653888.ttf","assets/node_modules/@expo-google-fonts/fraunces/100Thin/Fraunces_100Thin.2cbb9a3b3bbda5192ffe28bf04d6b29d.ttf","assets/node_modules/@expo-google-fonts/fraunces/100Thin_Italic/Fraunces_100Thin_Italic.6b4cab9b1863ed1cbb96c2cdd8276a26.ttf","assets/node_modules/@expo-google-fonts/fraunces/200ExtraLight/Fraunces_200ExtraLight.073905a75e6d90aaee9f7fe82157a0b6.ttf","assets/node_modules/@expo-google-fonts/fraunces/200ExtraLight_Italic/Fraunces_200ExtraLight_Italic.5b31322f6198efae6d40650ab8a3623b.ttf","assets/node_modules/@expo-google-fonts/fraunces/300Light/Fraunces_300Light.5e37aa8e672db18ba0f7c4d6789cf5ef.ttf","assets/node_modules/@expo-google-fonts/fraunces/300Light_Italic/Fraunces_300Light_Italic.f2bb3f7e850840f830024567570d5c3e.ttf","assets/node_modules/@expo-google-fonts/fraunces/400Regular/Fraunces_400Regular.d484e2f727663ddd31e7fcebc7cc25ea.ttf","assets/node_modules/@expo-google-fonts/fraunces/400Regular_Italic/Fraunces_400Regular_Italic.65805d7e2c7f9bad1bf1fa5ccbc7df26.ttf","assets/node_modules/@expo-google-fonts/fraunces/500Medium/Fraunces_500Medium.d1acf82088f232372c997dbadbc3f405.ttf","assets/node_modules/@expo-google-fonts/fraunces/500Medium_Italic/Fraunces_500Medium_Italic.0f15c5ff3dbf7b54423fe98d18069ab2.ttf","assets/node_modules/@expo-google-fonts/fraunces/600SemiBold/Fraunces_600SemiBold.e995588822b0867215ce518a9a79175b.ttf","assets/node_modules/@expo-google-fonts/fraunces/600SemiBold_Italic/Fraunces_600SemiBold_Italic.d3386675410283c88aedd87637eb5741.ttf","assets/node_modules/@expo-google-fonts/fraunces/700Bold/Fraunces_700Bold.0c859ce19af0584bccfc6941addedf34.ttf","assets/node_modules/@expo-google-fonts/fraunces/700Bold_Italic/Fraunces_700Bold_Italic.c051d8ea6e94f62ad79ed57304d75165.ttf","assets/node_modules/@expo-google-fonts/fraunces/800ExtraBold/Fraunces_800ExtraBold.1fca6eacc1fd7d8bb65c1b3c881d057a.ttf","assets/node_modules/@expo-google-fonts/fraunces/800ExtraBold_Italic/Fraunces_800ExtraBold_Italic.5d3601dd56349d0087980d9f2cc7d14c.ttf","assets/node_modules/@expo-google-fonts/fraunces/900Black/Fraunces_900Black.64dd2eb4f9509117d7047543a3b7c46a.ttf","assets/node_modules/@expo-google-fonts/fraunces/900Black_Italic/Fraunces_900Black_Italic.6677d45b62b851f1fd8c6061ff492d9d.ttf","assets/node_modules/expo-router/assets/arrow_down.017bc6ba3fc25503e5eb5e53826d48a8.png","assets/node_modules/expo-router/assets/error.d1ea1496f9057eb392d5bbf3732a61b7.png","assets/node_modules/expo-router/assets/file.19eeb73b9593a38f8e9f418337fc7d10.png","assets/node_modules/expo-router/assets/forward.d8b800c443b8972542883e0b9de2bdc6.png","assets/node_modules/expo-router/assets/pkg.ab19f4cbc543357183a20571f68380a3.png","assets/node_modules/expo-router/assets/react-navigation/elements/back-icon-mask.0a328cd9c1afd0afe8e3b1ec5165b1b4.png","assets/node_modules/expo-router/assets/react-navigation/elements/back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@2x.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@3x.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@4x.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@2x.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@3x.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@4x.png","assets/node_modules/expo-router/assets/react-navigation/elements/search-icon.286d67d3f74808a60a78d3ebf1a5fb57.png","assets/node_modules/expo-router/assets/sitemap.412dd9275b6b48ad28f5e3d81bb1f626.png","assets/node_modules/expo-router/assets/unmatched.20e71bdf79e3a97bf55fd9e164041578.png","assets/node_modules/expo-sqlite/web/wa-sqlite/wa-sqlite.5e61fe84c4a4f49e0b1a33661b45c791.wasm","favicon.ico","icon-192.png","icon-512.png","icon-maskable-512.png","index.html","manifest.webmanifest","metadata.json"];
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
