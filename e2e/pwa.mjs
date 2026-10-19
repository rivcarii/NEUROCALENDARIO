// Prueba de la versión instalable (PWA): service worker, funcionamiento sin internet y aviso de actualización.
import { chromium } from 'playwright-core';
const BASE = process.env.E2E_BASE;
const SWITCH = process.env.E2E_SWITCH; // comando que publica la versión 2 (cambia el enlace simbólico)
import { execSync } from 'node:child_process';
const V1 = process.env.V1, V2 = process.env.V2;
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALLA') + ' ' + m); if (!c) process.exitCode = 1; };

const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));

await p.goto(BASE + '?sw', { waitUntil: 'networkidle' });
await p.getByLabel('Su nombre (quien administra la app)').waitFor({ timeout: 30000 });
await p.getByLabel('Su nombre (quien administra la app)').fill('Prop');
await p.getByLabel('¿A quién va a acompañar principalmente?').fill('Mamá');
await p.getByRole('button', { name: 'Comenzar' }).click();
await p.getByText('Anotar ahora').first().waitFor();
await p.getByRole('button', { name: 'Dolor de cabeza', exact: true }).click();
await p.waitForTimeout(800);

// 1) el service worker toma el control y guarda la app
await p.evaluate(() => navigator.serviceWorker.ready);
await p.reload({ waitUntil: 'networkidle' });
const controlled = await p.evaluate(() => !!navigator.serviceWorker.controller);
ok(controlled, 'el service worker controla la página');
const cached = await p.evaluate(async () => (await caches.keys()).filter((k) => k.startsWith('nc-')));
ok(cached.length === 1 && cached[0].includes(V1), `caché de la versión 1 creada (${cached[0]})`);
const man = await (await p.request.get(BASE + 'manifest.webmanifest')).json();
ok(man.display === 'standalone' && man.icons.length === 3, 'manifiesto instalable (standalone, 3 iconos)');

// 2) sin internet
await ctx.setOffline(true);
await p.reload({ waitUntil: 'load' });
await p.getByText('Anotar ahora').first().waitFor({ timeout: 20000 });
ok(true, 'la app abre sin internet desde la caché y conserva los datos');
await ctx.setOffline(false);

// 3) publicar la versión 2 → aviso
ok(!(await p.getByText('Hay una versión nueva de NeuroCalendario').count()), 'sin aviso mientras no hay versión nueva');
execSync(SWITCH);
await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
await p.getByText('Hay una versión nueva de NeuroCalendario').waitFor({ timeout: 20000 });
ok(true, 'al publicar una versión nueva aparece «Hay una versión nueva de NeuroCalendario»');
await p.screenshot({ path: (process.env.E2E_SHOTS ?? '.') + '/pwa-aviso.png' });

// 4) «Más tarde»
await p.getByRole('button', { name: 'Más tarde' }).click();
await p.waitForTimeout(500);
ok(!(await p.getByText('Hay una versión nueva de NeuroCalendario').count()), '«Más tarde» cierra el aviso');

// 5) buscar manualmente y actualizar
await p.locator('text="Más" >> visible=true').first().click();
await p.getByText('Privacidad y ajustes').click();
await p.getByRole('button', { name: 'Buscar actualizaciones' }).click();
await p.getByText('Hay una versión nueva de NeuroCalendario').waitFor({ timeout: 20000 });
await Promise.all([p.waitForEvent('load', { timeout: 30000 }), p.getByRole('button', { name: 'Actualizar ahora' }).click()]);
await p.getByText('Privacidad y ajustes').first().waitFor({ timeout: 30000 }); // la app recarga en la misma pantalla
const keys = await p.evaluate(async () => (await caches.keys()).filter((k) => k.startsWith('nc-')));
ok(keys.length === 1 && keys[0].includes(V2), `tras actualizar, solo queda la caché de la versión 2 (${keys[0]})`);
ok((await p.locator('body').innerText()).includes(V2.replace('+', ' · ')), 'Ajustes muestra la versión nueva');
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.getByText('Anotar ahora').first().waitFor({ timeout: 30000 });
await p.locator('text="Síntomas" >> visible=true').first().click();
await p.locator('text=Dolor de cabeza >> visible=true').first().waitFor({ timeout: 15000 });
ok(true, 'los datos siguen ahí después de actualizar');

console.log('ERRORES DE PÁGINA:', errors.length ? errors.slice(0, 3) : 'ninguno');
await b.close();
