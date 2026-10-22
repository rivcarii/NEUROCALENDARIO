// Genera los iconos de la app con el isotipo de src/brand/geometry.ts (única fuente de la marca) y Chromium sin interfaz.
// Uso: node --experimental-strip-types scripts/make-icons.mjs   (CHROME=/ruta/a/chrome si no está en /opt/pw-browsers)
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { BRAND, ISOTIPO } from '../src/brand/geometry.ts';

const chrome = process.env.CHROME ?? execSync('ls /opt/pw-browsers/chromium-*/chrome-linux/chrome | head -1').toString().trim();
const out = (f) => new URL(`../assets/${f}`, import.meta.url).pathname;

/** Marca (sin fondo) en un color. */
const mark = (ink, accent = ink) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">` +
  `<path d="${ISOTIPO.frame}" fill="none" stroke="${ink}" stroke-width="${ISOTIPO.stroke}" stroke-linejoin="round"/>` +
  `<path d="${ISOTIPO.tabs}" fill="none" stroke="${ink}" stroke-width="${ISOTIPO.stroke}" stroke-linecap="round"/>` +
  `<path d="${ISOTIPO.pathway}" fill="none" stroke="${accent}" stroke-width="${ISOTIPO.stroke - 1}" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${ISOTIPO.dendrites}" fill="none" stroke="${accent}" stroke-width="${ISOTIPO.thin}" stroke-linecap="round"/>` +
  `<path d="${ISOTIPO.somas}${ISOTIPO.terminals}" fill="${accent}"/></svg>`;
const GRAD = `linear-gradient(135deg,${BRAND.violet} 0%,${BRAND.indigo} 55%,${BRAND.indigoDeep} 100%)`;
// iOS recorta las esquinas: el icono va a sangre (cuadrado completo, sin transparencia).
const full = (pct) => `<div style="width:100%;height:100%;background:${GRAD};display:flex;align-items:center;justify-content:center"><div style="width:${pct}%;height:${pct}%">${mark('#FFFFFF')}</div></div>`;
const bare = (pct, ink, accent) => `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><div style="width:${pct}%;height:${pct}%">${mark(ink, accent)}</div></div>`;
const tile = (pct) => `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><div style="width:${pct}%;height:${pct}%;border-radius:23%;background:${GRAD};display:flex;align-items:center;justify-content:center"><div style="width:100%;height:100%">${mark('#FFFFFF')}</div></div></div>`;

const shots = [
  ['icon.png', 1024, full(70), false],
  ['android-icon-foreground.png', 1024, bare(52, '#FFFFFF'), true],
  ['android-icon-background.png', 1024, `<div style="width:100%;height:100%;background:${GRAD}"></div>`, false],
  ['android-icon-monochrome.png', 1024, bare(52, '#000000'), true],
  ['splash-icon.png', 1024, tile(70), true],
  ['../public/icon-192.png', 192, full(70), false],
  ['../public/icon-512.png', 512, full(70), false],
  ['../public/icon-maskable-512.png', 512, full(54), false],
  ['../public/apple-touch-icon.png', 180, full(70), false],
  ['favicon.png', 256, tile(100), true],
];
const b = await chromium.launch({ executablePath: chrome, args: ['--no-sandbox'] });
for (const [file, size, body, transparent] of shots) {
  const p = await b.newPage({ viewport: { width: size, height: size } });
  await p.setContent(`<style>html,body{margin:0;width:${size}px;height:${size}px;background:transparent}</style>${body}`);
  await p.screenshot({ path: out(file), omitBackground: transparent });
  await p.close();
  console.log('ok', file);
}
await b.close();
// Isotipo y versión monocroma como SVG para usos externos (documentos, presentaciones).
mkdirSync(out('brand'), { recursive: true });
writeFileSync(out('brand/isotipo.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${BRAND.violet}"/><stop offset=".55" stop-color="${BRAND.indigo}"/><stop offset="1" stop-color="${BRAND.indigoDeep}"/></linearGradient></defs><path d="${ISOTIPO.tile}" fill="url(#g)"/>${mark('#FFFFFF').replace(/<svg[^>]*>|<\/svg>/g, '')}</svg>\n`);
writeFileSync(out('brand/isotipo-color.svg'), mark(BRAND.indigo, BRAND.teal).replace('style="width:100%;height:100%;display:block"', '') + '\n');
console.log('ok brand/*.svg');
