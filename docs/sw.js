/* NeuroCalendario · service worker (generado por scripts/build-pwa.mjs; no editar a mano)
   Guarda la app en el dispositivo para abrir al instante y funcionar sin internet.
   Cada publicación cambia VERSION, así los dispositivos descargan la actualización y la app avisa. */
const VERSION = "nc-0.1.0+df43ceb";
const ASSETS = ["_expo/static/js/web/[id]-2b563fec6eb7014edabea700a4db5ca4.js","_expo/static/js/web/[id]-3ce46bf130443744e3944dc8f3ba54ff.js","_expo/static/js/web/[id]-94617b52c7788e65a7a4920f5b6af8f7.js","_expo/static/js/web/[id]-da6c733a8440600f618a441d76a556ee.js","_expo/static/js/web/[id]-e3979f98f1ca379749f63b595acd9731.js","_expo/static/js/web/[id]-ea8bca524ab2a12c3d27614c6cf92655.js","_expo/static/js/web/__common-b790580815d3ab9398e07753c32893c9.js","_expo/static/js/web/__expo-metro-runtime-8c088df87a31e4e6accd81c554ec290d.js","_expo/static/js/web/_layout-249cebaa7c69fe8e151d6b0ed696c3f8.js","_expo/static/js/web/_layout-306e14bc822520ca96dc9acd29e2f3ec.js","_expo/static/js/web/acceso-47165e9f83ee220cb8973f98daad2187.js","_expo/static/js/web/acerca-baaa2171d5444c773b0f1a3dc86afc10.js","_expo/static/js/web/ajustes-607d0dcbaeddd525e7b6b648ced300a8.js","_expo/static/js/web/calendario-fe61d93d3b0d4a211531b7bf00a760c2.js","_expo/static/js/web/citas-c112a040c32c47a0b641cf09c3c65388.js","_expo/static/js/web/documentos-b57c19e060ce36c4eebfd903ca811bec.js","_expo/static/js/web/entry-de1bca373de7c14d354b111705f46d65.js","_expo/static/js/web/episodios-f57a2b1486f89d6af9d8b33bdd7e836d.js","_expo/static/js/web/estadisticas-001700a15226be32781f21c7f88d2f90.js","_expo/static/js/web/examenes-0886585229756098372303dc84fa0493.js","_expo/static/js/web/index-6e5acce6e27cbe8d74e54860d3c19c77.js","_expo/static/js/web/informes-86b26a733fabb22380b036cc83603d6b.js","_expo/static/js/web/instalar-e2e35959c7d4fd6158a146651139849c.js","_expo/static/js/web/mas-7690ddb055a678d84aed370ae0f76df0.js","_expo/static/js/web/medicacion-09acb71dddb2e8957e96733a048c5112.js","_expo/static/js/web/notas-f52d0892ec3ac10861170c5ff248ded1.js","_expo/static/js/web/perfiles-3e4aec7b462e09149e3a769e0328610c.js","_expo/static/js/web/respaldo-85d7a2a4473e30326eff82d30d9ad6fb.js","_expo/static/js/web/worker-c857af8a4cc9e39d91d335347518a1a6.js","apple-touch-icon.png","assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.b4eb097d35f44ed943676fd56f6bdc51.ttf","assets/node_modules/@expo-google-fonts/atkinson-hyperlegible/400Regular/AtkinsonHyperlegible_400Regular.59f0f5543754fa6b68a563036eafaaab.ttf","assets/node_modules/@expo-google-fonts/atkinson-hyperlegible/400Regular_Italic/AtkinsonHyperlegible_400Regular_Italic.2badbc897377af4c75f1536a29e24231.ttf","assets/node_modules/@expo-google-fonts/atkinson-hyperlegible/700Bold/AtkinsonHyperlegible_700Bold.f2193e9c742b9554852a3000f0ccdc9c.ttf","assets/node_modules/@expo-google-fonts/atkinson-hyperlegible/700Bold_Italic/AtkinsonHyperlegible_700Bold_Italic.1d9aff33518db56f83412a331c653888.ttf","assets/node_modules/@expo-google-fonts/fraunces/100Thin/Fraunces_100Thin.2cbb9a3b3bbda5192ffe28bf04d6b29d.ttf","assets/node_modules/@expo-google-fonts/fraunces/100Thin_Italic/Fraunces_100Thin_Italic.6b4cab9b1863ed1cbb96c2cdd8276a26.ttf","assets/node_modules/@expo-google-fonts/fraunces/200ExtraLight/Fraunces_200ExtraLight.073905a75e6d90aaee9f7fe82157a0b6.ttf","assets/node_modules/@expo-google-fonts/fraunces/200ExtraLight_Italic/Fraunces_200ExtraLight_Italic.5b31322f6198efae6d40650ab8a3623b.ttf","assets/node_modules/@expo-google-fonts/fraunces/300Light/Fraunces_300Light.5e37aa8e672db18ba0f7c4d6789cf5ef.ttf","assets/node_modules/@expo-google-fonts/fraunces/300Light_Italic/Fraunces_300Light_Italic.f2bb3f7e850840f830024567570d5c3e.ttf","assets/node_modules/@expo-google-fonts/fraunces/400Regular/Fraunces_400Regular.d484e2f727663ddd31e7fcebc7cc25ea.ttf","assets/node_modules/@expo-google-fonts/fraunces/400Regular_Italic/Fraunces_400Regular_Italic.65805d7e2c7f9bad1bf1fa5ccbc7df26.ttf","assets/node_modules/@expo-google-fonts/fraunces/500Medium/Fraunces_500Medium.d1acf82088f232372c997dbadbc3f405.ttf","assets/node_modules/@expo-google-fonts/fraunces/500Medium_Italic/Fraunces_500Medium_Italic.0f15c5ff3dbf7b54423fe98d18069ab2.ttf","assets/node_modules/@expo-google-fonts/fraunces/600SemiBold/Fraunces_600SemiBold.e995588822b0867215ce518a9a79175b.ttf","assets/node_modules/@expo-google-fonts/fraunces/600SemiBold_Italic/Fraunces_600SemiBold_Italic.d3386675410283c88aedd87637eb5741.ttf","assets/node_modules/@expo-google-fonts/fraunces/700Bold/Fraunces_700Bold.0c859ce19af0584bccfc6941addedf34.ttf","assets/node_modules/@expo-google-fonts/fraunces/700Bold_Italic/Fraunces_700Bold_Italic.c051d8ea6e94f62ad79ed57304d75165.ttf","assets/node_modules/@expo-google-fonts/fraunces/800ExtraBold/Fraunces_800ExtraBold.1fca6eacc1fd7d8bb65c1b3c881d057a.ttf","assets/node_modules/@expo-google-fonts/fraunces/800ExtraBold_Italic/Fraunces_800ExtraBold_Italic.5d3601dd56349d0087980d9f2cc7d14c.ttf","assets/node_modules/@expo-google-fonts/fraunces/900Black/Fraunces_900Black.64dd2eb4f9509117d7047543a3b7c46a.ttf","assets/node_modules/@expo-google-fonts/fraunces/900Black_Italic/Fraunces_900Black_Italic.6677d45b62b851f1fd8c6061ff492d9d.ttf","assets/node_modules/expo-router/assets/arrow_down.017bc6ba3fc25503e5eb5e53826d48a8.png","assets/node_modules/expo-router/assets/error.d1ea1496f9057eb392d5bbf3732a61b7.png","assets/node_modules/expo-router/assets/file.19eeb73b9593a38f8e9f418337fc7d10.png","assets/node_modules/expo-router/assets/forward.d8b800c443b8972542883e0b9de2bdc6.png","assets/node_modules/expo-router/assets/pkg.ab19f4cbc543357183a20571f68380a3.png","assets/node_modules/expo-router/assets/react-navigation/elements/back-icon-mask.0a328cd9c1afd0afe8e3b1ec5165b1b4.png","assets/node_modules/expo-router/assets/react-navigation/elements/back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@2x.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@3x.png","assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@4x.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@2x.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@3x.png","assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@4x.png","assets/node_modules/expo-router/assets/react-navigation/elements/search-icon.286d67d3f74808a60a78d3ebf1a5fb57.png","assets/node_modules/expo-router/assets/sitemap.412dd9275b6b48ad28f5e3d81bb1f626.png","assets/node_modules/expo-router/assets/unmatched.20e71bdf79e3a97bf55fd9e164041578.png","assets/node_modules/expo-sqlite/web/wa-sqlite/wa-sqlite.5e61fe84c4a4f49e0b1a33661b45c791.wasm","favicon.ico","icon-192.png","icon-512.png","icon-maskable-512.png","index.html","manifest.webmanifest","metadata.json"];
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
