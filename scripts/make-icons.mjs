// Genera los iconos de la app a partir de assets/mascot/nuri.svg con Chromium sin interfaz.
// Uso: node scripts/make-icons.mjs   (CHROME=/ruta/a/chrome si no está en /opt/pw-browsers)
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const svg = readFileSync(new URL('../assets/mascot/nuri.svg', import.meta.url), 'utf8');
const chrome = process.env.CHROME ?? execSync('ls /opt/pw-browsers/chromium-*/chrome-linux/chrome | head -1').toString().trim();
const out = (f) => new URL(`../assets/${f}`, import.meta.url).pathname;

const page = async (b, size, body, transparent) => {
  const p = await b.newPage({ viewport: { width: size, height: size } });
  await p.setContent(`<style>html,body{margin:0;width:${size}px;height:${size}px;${transparent ? '' : ''}}</style>${body}`);
  return p;
};
const mascot = (pct, extra = '') => `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><div style="width:${pct}%;${extra}">${svg.replace('<svg ', '<svg style="width:100%;height:auto;display:block" ')}</div></div>`;

const b = await chromium.launch({ executablePath: chrome, args: ['--no-sandbox'] });
const shots = [
  // icono iOS / general: fondo azul suave, sin transparencia
  ['icon.png', 1024, `<div style="width:100%;height:100%;background:linear-gradient(160deg,#E6F4FE,#B9D8F4)">${mascot(74)}</div>`, false],
  // Android adaptativo: primer plano transparente dentro de la zona segura (66 %)
  ['android-icon-foreground.png', 1024, mascot(60), true],
  ['android-icon-background.png', 1024, `<div style="width:100%;height:100%;background:linear-gradient(160deg,#E6F4FE,#B9D8F4)"></div>`, false],
  // icono temático monocromo (silueta)
  ['android-icon-monochrome.png', 1024, mascot(60, 'filter:brightness(0)'), true],
  ['splash-icon.png', 1024, mascot(80), true],
  ['favicon.png', 256, `<div style="width:100%;height:100%;background:#E6F4FE">${mascot(88)}</div>`, false],
];
for (const [file, size, body, transparent] of shots) {
  const p = await page(b, size, body, transparent);
  await p.screenshot({ path: out(file), omitBackground: transparent });
  await p.close();
  console.log('ok', file);
}
await b.close();
