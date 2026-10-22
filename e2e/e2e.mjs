import { chromium } from 'playwright-core';
const BASE = process.env.E2E_BASE ?? 'http://localhost:8099/';
const SHOTS = process.env.E2E_SHOTS ?? '.';
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? undefined, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300)); });
page.on('dialog', (d) => d.accept());
page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url().slice(-80)));
page.on('response', (r) => { if (r.status() >= 400) errors.push('http' + r.status() + ': ' + r.url().slice(-80)); });
let n = 0;
const shot = (name) => page.screenshot({ path: `${SHOTS}/s${String(++n).padStart(2, '0')}-${name}.png` });
const ok = (c, msg) => { console.log((c ? 'OK   ' : 'FALLA') + ' ' + msg); if (!c) process.exitCode = 1; };
const body = () => page.locator('body').innerText();

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByLabel('Su nombre (quien administra la app)').waitFor({ timeout: 20000 });
await shot('bienvenida');
await page.getByLabel('Su nombre (quien administra la app)').fill('Propietario Ficticio');
await page.getByLabel('¿A quién va a acompañar principalmente?').fill('Mamá Ficticia');
await page.getByRole('button', { name: 'Comenzar' }).click();
await page.getByText('Anotar ahora').first().waitFor();
ok((await body()).includes('Mamá Ficticia'), 'onboarding crea el perfil y se ve en la cabecera');
await shot('hoy');

// registro rápido
await page.getByRole('button', { name: 'Dolor de cabeza', exact: true }).click();
await page.getByText(/Dolor de cabeza/).nth(1).waitFor();
ok((await body()).includes('Síntomas de hoy'), 'registro rápido guardado y listado en Hoy');

// episodio completo
await page.getByRole('button', { name: 'Anotar con más detalle' }).click();
await page.getByText(/Se guardará en: Mamá Ficticia/).waitFor();
await page.getByRole('button', { name: 'Guardar' }).click();
ok((await body()).includes('Cuéntenos qué sintió'), 'validación: tipo obligatorio');
await page.getByLabel('Otro, o descríbalo con sus palabras').fill('Mareo con aura (ficticio)');
await page.getByRole('radio', { name: '6 de 10', exact: true }).first().click();
await shot('episodio-form');
await page.getByRole('button', { name: 'Guardar' }).click();
await page.getByText('Mareo con aura (ficticio)').first().waitFor({ timeout: 10000 });
ok(true, 'episodio completo guardado y visible en Hoy');

// historial + persistencia tras recargar
await page.locator('text=\"Síntomas\" >> visible=true').first().click();
await page.locator('text=Mareo con aura (ficticio) >> visible=true').first().waitFor();
await shot('historial');
await page.reload({ waitUntil: 'networkidle' });
await page.getByText('Anotar ahora').first().waitFor({ timeout: 20000 });
await page.locator('text=\"Síntomas\" >> visible=true').first().click();
await page.locator('text=Mareo con aura (ficticio) >> visible=true').first().waitFor({ timeout: 10000 });
ok(true, 'los episodios persisten tras recargar la aplicación (SQLite)');

// medicación
await page.locator('text=\"Medicinas\" >> visible=true').first().click();
await page.getByRole('button', { name: 'Añadir una medicina' }).click();
await page.getByLabel('Nombre').fill('Medicamento ficticio');
await page.getByLabel('Dosis (cuánto tomar)').fill('1 comprimido');
await page.getByRole('button', { name: 'Guardar' }).click();
await page.getByText('Horarios de la medicina').waitFor();
await page.getByLabel(/Horas \(como/).fill('08:00, 20:00');
await page.getByRole('button', { name: 'Añadir horario' }).click();
await page.getByText('08:00 · 20:00').waitFor();
await shot('medicacion');
ok(true, 'medicamento y horarios creados');

// volver a Hoy y marcar toma
await page.goBack();
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByText('Medicinas de hoy').waitFor({ timeout: 20000 });
const tomadas = page.getByRole('button', { name: 'La tomé', exact: true });
ok((await tomadas.count()) === 2, 'dos tomas programadas hoy');
await tomadas.first().click();
await page.getByText(/✔ La tomé/).waitFor();
await shot('toma');
ok(true, 'toma registrada');

// perfiles
await page.locator('text=\"Más\" >> visible=true').first().click();
await page.getByText('Personas', { exact: true }).click();
await page.getByRole('button', { name: 'Añadir una persona' }).click();
await page.getByLabel('Nombre', { exact: true }).fill('Perfil Propio Ficticio');
await page.getByLabel('¿Qué es suya esa persona? (mamá, yo…)').fill('Yo');
await page.getByRole('button', { name: 'Guardar' }).click();
await page.locator('text=Perfil Propio Ficticio >> visible=true').first().waitFor();
await shot('perfil-propio');
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByText('Anotar ahora').first().waitFor({ timeout: 20000 });
ok(!(await body()).includes('Mareo con aura'), 'el perfil nuevo no muestra datos del otro perfil');
await page.locator('text=\"Síntomas\" >> visible=true').first().click();
await page.getByText(/No hay síntomas anotados/).waitFor();
ok(true, 'historial del perfil nuevo vacío');

// cambiar de perfil y comprobar datos de mamá
await page.getByRole('button', { name: 'Cambiar de persona' }).click();
await page.getByRole('button', { name: 'Ver a esta persona' }).first().click();
await page.locator('text=Mamá Ficticia >> visible=true').first().waitFor();
await page.locator('text=\"Síntomas\" >> visible=true').first().click();
await page.locator('text=Mareo con aura (ficticio) >> visible=true').first().waitFor();
ok(true, 'al volver al perfil de mamá se ven sus episodios');

// calendario y cita
await page.locator('text="Calendario" >> visible=true').first().click();
await page.getByRole('button', { name: 'Ir a hoy' }).waitFor();
await shot('calendario');
ok((await body()).includes('octubre 2026'), 'calendario mensual muestra el mes actual');
await page.getByRole('button', { name: 'Agregar cita' }).click();
await page.getByLabel('Título').fill('Control neurología (ficticia)');
await page.getByRole('button', { name: 'Guardar' }).click();
await page.locator('text=/Cita 09:00 · Control neurología/ >> visible=true').first().waitFor({ timeout: 10000 });
await shot('calendario-cita');
ok(true, 'cita creada y visible en el día del calendario');
await page.getByRole('radio', { name: 'Semana' }).click();
await page.getByRole('radio', { name: 'Día' }).click();
ok((await body()).includes('Control neurología (ficticia)'), 'vista diaria muestra la cita');

// nota y examen
await page.locator('text="Más" >> visible=true').first().click();
await page.getByText('Notas', { exact: true }).click();
await page.getByRole('button', { name: 'Nueva nota' }).click();
await page.getByRole('radio', { name: 'Cuidador' }).click();
await page.getByLabel('Nota', { exact: true }).fill('Se mostró cansada por la tarde (ficticio).');
await page.getByRole('button', { name: 'Guardar' }).click();
await page.locator('text=Nota del cuidador >> visible=true').first().waitFor();
ok(true, 'nota del cuidador guardada');

// estadísticas
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByText('Anotar ahora').first().waitFor({ timeout: 20000 });
await page.locator('text="Más" >> visible=true').first().click();
await page.getByText('Cómo he estado', { exact: true }).click();
await page.getByText('Resumen', { exact: true }).waitFor();
await shot('estadisticas');
ok((await body()).includes('Síntomas: 2'), 'estadísticas calculan sobre los datos persistidos');

// acceso familiar + privacidad
await page.goto(BASE + 'acceso', { waitUntil: 'networkidle' });
await page.getByLabel('Nueva cuenta familiar (nombre)').fill('Familiar ficticio');
await page.getByRole('button', { name: 'Crear cuenta familiar' }).click();
await page.locator('text=sin acceso >> visible=true').first().waitFor();
await page.getByRole('radio', { name: 'Solo puede ver' }).click();
await page.locator('text=Acceso a «Mamá Ficticia»: Solo puede ver >> visible=true').first().waitFor();
ok(true, 'cuenta familiar creada y permiso de lectura concedido');
await page.getByRole('button', { name: 'Revocar acceso' }).click();
await page.locator('text=Acceso a «Mamá Ficticia»: sin acceso >> visible=true').first().waitFor();
ok(true, 'permiso revocado');

// semáforo, análisis y PDF real en el navegador
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByText('Anotar ahora').first().waitFor({ timeout: 20000 });
ok((await body()).includes('Estado de hoy') && (await body()).includes('Su semana'), 'Hoy muestra estado de hoy y semáforo de la semana');
await page.locator('text="Calendario" >> visible=true').first().click();
await page.getByRole('button', { name: /Día difícil|Con molestias|Tranquilo/ }).first().waitFor({ timeout: 15000 });
await shot('calendario-semaforo');
ok(true, 'el calendario pinta cada día con su color de semáforo');
await page.locator('text="Más" >> visible=true').first().click();
await page.getByText('Análisis semanal y mensual', { exact: true }).waitFor();
await shot('mas');
await page.getByText('Análisis semanal y mensual', { exact: true }).click();
await page.getByText('Qué encontramos').waitFor();
await shot('analisis-semana');
await page.getByRole('radio', { name: 'Mes' }).click();
await page.getByText('Escala de dolor (0–10)').waitFor();
ok(true, 'análisis semanal y mensual con escala de dolor y hallazgos');
await page.getByRole('button', { name: 'Crear informe PDF de este período' }).click();
await page.getByRole('button', { name: 'Crear y compartir PDF' }).waitFor();
const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }).catch(async (e) => { await shot('pdf-fallo'); console.log('ERRORES:', errors.join(' | ')); console.log((await body()).slice(-300)); throw e; }), page.getByRole('button', { name: 'Crear y compartir PDF' }).click()]);
const pdfPath = `${SHOTS}/informe-e2e.pdf`;
await dl.saveAs(pdfPath);
const head = (await import('node:fs')).readFileSync(pdfPath).subarray(0, 5).toString();
ok(head === '%PDF-' && dl.suggestedFilename().endsWith('.pdf'), 'el PDF se genera y se descarga en el navegador (' + dl.suggestedFilename() + ')');
await page.getByText(/El PDF está listo/).waitFor();
await shot('pdf-listo');

// eliminación con confirmación
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByText('Anotar ahora').first().waitFor({ timeout: 20000 });
await page.locator('text="Síntomas" >> visible=true').first().click();
await page.getByText('Anotar un síntoma').first().waitFor();
await page.locator('[role=button]', { hasText: /^Dolor de cabeza$/ }).last().click();
await page.getByRole('button', { name: 'Borrar este síntoma' }).click();
await page.getByText('1 síntoma(s) en Mamá Ficticia').waitFor();
ok(true, 'episodio eliminado tras confirmar');
// eliminar el perfil secundario y comprobar que el principal conserva sus datos
await page.locator('text="Más" >> visible=true').first().click();
await page.getByText('Personas', { exact: true }).click();
await page.getByRole('button', { name: 'Editar / eliminar' }).nth(1).click();
await page.getByLabel(/Para eliminar, escriba/).fill('Perfil Propio Ficticio');
await page.getByRole('button', { name: 'Eliminar perfil y sus datos' }).click();
await page.locator('text="Síntomas" >> visible=true').first().click();
await page.locator('text=Mareo con aura (ficticio) >> visible=true').first().waitFor();
ok(true, 'eliminar un perfil no afecta los datos del otro');

console.log('ERRORES DE CONSOLA:', errors.length ? '\n' + errors.slice(0, 10).join('\n') : 'ninguno');
await browser.close();
