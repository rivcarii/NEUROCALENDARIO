// Después de `expo export --platform web`: genera el service worker y version.json de la carpeta dist.
// La versión de compilación (EXPO_PUBLIC_APP_BUILD) debe ser la MISMA que se usó al exportar,
// porque la app compara su versión con la de version.json para avisar de actualizaciones.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const build = process.env.EXPO_PUBLIC_APP_BUILD;
if (!build) throw new Error('Falta EXPO_PUBLIC_APP_BUILD (use scripts/build-web.sh).');

const SKIP = new Set(['sw.js', 'version.json']);
const files = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else {
      const rel = relative(dist, p).split('\\').join('/');
      if (!SKIP.has(rel) && !rel.endsWith('.map')) files.push(rel);
    }
  }
})(dist);

// index.html de la SPA: manifiesto, iconos y metadatos de instalación (con «output: single» Expo no usa +html).
const base = process.env.EXPO_BASE_URL ?? '';
const indexPath = join(dist, 'index.html');
let html = readFileSync(indexPath, 'utf8');
// Ajustes de plataforma móvil (iOS Safari / Android Chrome) para que la web se sienta como una app instalada.
const mobileCss = `
  html{-webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:100%;text-size-adjust:100%;overscroll-behavior:none;color-scheme:light dark;background:#F6F8FB}
  @media (prefers-color-scheme:dark){html{background:#0E141A}}
  html,body{height:100%}
  body{position:fixed;inset:0;overscroll-behavior:none;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
  #root{position:fixed;inset:0;display:flex}
  /* los controles no seleccionan su texto al mantener pulsado; el contenido sí */
  button,[role=button],[role=radio],[role=checkbox],[role=tab],a{touch-action:manipulation;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
  /* iOS hace zoom al enfocar campos de menos de 16 px */
  input,textarea,select{font-size:16px}
  input:focus,textarea:focus{outline:2px solid #2F5D8A;outline-offset:0}
  @media (prefers-color-scheme:dark){input:focus,textarea:focus{outline-color:#7FB0E0}}
  /* menos transparencia: el cristal pasa a ser una superficie sólida */
  @media (prefers-reduced-transparency:reduce){div[style*="backdrop-filter"]{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background-color:#fff!important}}
  @media (prefers-reduced-transparency:reduce) and (prefers-color-scheme:dark){div[style*="backdrop-filter"]{background-color:#17202A!important}}
  @media (prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
`.replace(/\s+/g, ' ').trim();

const head = [
  `<style id="nc-mobile">${mobileCss}</style>`,
  `<link rel="manifest" href="${base}/manifest.webmanifest">`,
  `<link rel="apple-touch-icon" href="${base}/apple-touch-icon.png">`,
  `<link rel="icon" href="${base}/icon-192.png">`,
  '<meta name="theme-color" media="(prefers-color-scheme: light)" content="#2F5D8A">',
  '<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0E141A">',
  '<meta name="description" content="Diario y calendario de síntomas, medicinas y citas.">',
  '<meta name="robots" content="noindex, nofollow">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="NeuroCalendario">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
].join('\n    ');
html = html
  .replace('<html lang="en">', '<html lang="es">')
  .replace(/<meta name="viewport"[^>]*>/, '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">')
  .replace(/<meta name="theme-color" content="[^"]*">\s*/g, '')
  .replace(/<link rel="icon"[^>]*>/g, '')
  .replace('</head>', `    ${head}\n  </head>`);
writeFileSync(indexPath, html);

const sw = `/* NeuroCalendario · service worker (generado por scripts/build-pwa.mjs; no editar a mano)
   Guarda la app en el dispositivo para abrir al instante y funcionar sin internet.
   Cada publicación cambia VERSION, así los dispositivos descargan la actualización y la app avisa. */
const VERSION = ${JSON.stringify('nc-' + build)};
const ASSETS = ${JSON.stringify(files)};
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
`;
writeFileSync(join(dist, 'sw.js'), sw);
writeFileSync(join(dist, 'version.json'), JSON.stringify({ version: build }) + '\n');
writeFileSync(join(dist, '.nojekyll'), '');
// GitHub Pages devuelve 404.html en rutas que no son archivos (p. ej. al recargar /ajustes): se usa la misma app.
writeFileSync(join(dist, '404.html'), readFileSync(indexPath));
console.log(`PWA lista: ${files.length} archivos, versión ${build}`);
