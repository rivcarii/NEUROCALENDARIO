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
let n = 0;
const shot = (name) => page.screenshot({ path: `${SHOTS}/s${String(++n).padStart(2, '0')}-${name}.png` });
const ok = (c, msg) => { console.log((c ? 'OK   ' : 'FALLA') + ' ' + msg); if (!c) process.exitCode = 1; };
const body = () => page.locator('body').innerText();

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByLabel('Su nombre (propietario de la aplicación)').waitFor({ timeout: 20000 });
await page.getByLabel('Su nombre (propietario de la aplicación)').fill('Propietario Ficticio');
await page.getByLabel('Nombre de la persona principal de seguimiento').fill('Mamá Ficticia');
await page.getByRole('button', { name: 'Comenzar' }).click();
await page.getByText('Registro rápido').first().waitFor();
ok((await body()).includes('Mamá Ficticia'), 'onboarding crea el perfil y se ve en la cabecera');
await shot('hoy');

// registro rápido
await page.getByRole('button', { name: 'Cefalea', exact: true }).click();
await page.getByText(/Cefalea/).nth(1).waitFor();
ok((await body()).includes('Episodios de hoy'), 'registro rápido guardado y listado en Hoy');

// episodio completo
await page.getByRole('button', { name: 'Registrar episodio completo' }).click();
await page.getByText(/Se guardará en: Mamá Ficticia/).waitFor();
await page.getByRole('button', { name: 'Guardar' }).click();
ok((await body()).includes('Indique el tipo de episodio'), 'validación: tipo obligatorio');
await page.getByLabel('Otro tipo / descripción breve').fill('Mareo con aura (ficticio)');
await page.getByRole('radio', { name: '6 de 10', exact: true }).first().click();
await shot('episodio-form');
await page.getByRole('button', { name: 'Guardar' }).click();
await page.getByText('Mareo con aura (ficticio)').first().waitFor({ timeout: 10000 });
ok(true, 'episodio completo guardado y visible en Hoy');

// historial + persistencia tras recargar
await page.locator('text=\"Episodios\" >> visible=true').first().click();
await page.locator('text=Mareo con aura (ficticio) >> visible=true').first().waitFor();
await shot('historial');
await page.reload({ waitUntil: 'networkidle' });
await page.getByText('Registro rápido').first().waitFor({ timeout: 20000 });
await page.locator('text=\"Episodios\" >> visible=true').first().click();
await page.locator('text=Mareo con aura (ficticio) >> visible=true').first().waitFor({ timeout: 10000 });
ok(true, 'los episodios persisten tras recargar la aplicación (SQLite)');

// medicación
await page.locator('text=\"Medicación\" >> visible=true').first().click();
await page.getByRole('button', { name: 'Agregar medicamento' }).click();
await page.getByLabel('Nombre').fill('Medicamento ficticio');
await page.getByLabel('Dosis indicada').fill('1 comprimido');
await page.getByRole('button', { name: 'Guardar' }).click();
await page.getByText('Horarios prescritos').waitFor();
await page.getByLabel(/Horas \(HH:MM/).fill('08:00, 20:00');
await page.getByRole('button', { name: 'Agregar horario' }).click();
await page.getByText('08:00 · 20:00').waitFor();
await shot('medicacion');
ok(true, 'medicamento y horarios creados');

// volver a Hoy y marcar toma
await page.goBack();
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByText('Medicación de hoy').waitFor({ timeout: 20000 });
const tomadas = page.getByRole('button', { name: 'Tomada' });
ok((await tomadas.count()) === 2, 'dos tomas programadas hoy');
await tomadas.first().click();
await page.getByText(/✔ Tomada/).waitFor();
await shot('toma');
ok(true, 'toma registrada');

// perfiles
await page.locator('text=\"Más\" >> visible=true').first().click();
await page.getByText('Perfiles', { exact: true }).click();
await page.getByRole('button', { name: 'Crear perfil nuevo' }).click();
await page.getByLabel('Nombre', { exact: true }).fill('Perfil Propio Ficticio');
await page.getByLabel('Relación (ej.: Mamá, Yo)').fill('Yo');
await page.getByRole('button', { name: 'Guardar' }).click();
await page.locator('text=Perfil Propio Ficticio >> visible=true').first().waitFor();
await shot('perfil-propio');
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByText('Registro rápido').first().waitFor({ timeout: 20000 });
ok(!(await body()).includes('Mareo con aura'), 'el perfil nuevo no muestra datos del otro perfil');
await page.locator('text=\"Episodios\" >> visible=true').first().click();
await page.getByText(/No hay episodios en este período/).waitFor();
ok(true, 'historial del perfil nuevo vacío');

// cambiar de perfil y comprobar datos de mamá
await page.getByRole('button', { name: 'Cambiar de perfil' }).click();
await page.getByRole('button', { name: 'Usar este perfil' }).first().click();
await page.locator('text=Mamá Ficticia >> visible=true').first().waitFor();
await page.locator('text=\"Episodios\" >> visible=true').first().click();
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
await page.getByText('Registro rápido').first().waitFor({ timeout: 20000 });
await page.locator('text="Más" >> visible=true').first().click();
await page.getByText('Estadísticas', { exact: true }).click();
await page.getByText('Resumen', { exact: true }).waitFor();
await shot('estadisticas');
ok((await body()).includes('Episodios: 2'), 'estadísticas calculan sobre los datos persistidos');

// acceso familiar + privacidad
await page.goto(BASE + 'acceso', { waitUntil: 'networkidle' });
await page.getByLabel('Nueva cuenta familiar (nombre)').fill('Familiar ficticio');
await page.getByRole('button', { name: 'Crear cuenta familiar' }).click();
await page.locator('text=sin acceso >> visible=true').first().waitFor();
await page.getByRole('radio', { name: 'Solo lectura' }).click();
await page.locator('text=Acceso a «Mamá Ficticia»: Solo lectura >> visible=true').first().waitFor();
ok(true, 'cuenta familiar creada y permiso de lectura concedido');
await page.getByRole('button', { name: 'Revocar acceso' }).click();
await page.locator('text=Acceso a «Mamá Ficticia»: sin acceso >> visible=true').first().waitFor();
ok(true, 'permiso revocado');

// eliminación con confirmación
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByText('Registro rápido').first().waitFor({ timeout: 20000 });
await page.locator('text="Episodios" >> visible=true').first().click();
await page.getByText('Nuevo episodio').first().waitFor();
await page.locator('[role=button]', { hasText: /^Cefalea$/ }).last().click();
await page.getByRole('button', { name: 'Eliminar episodio' }).click();
await page.getByText('1 episodio(s) en Mamá Ficticia').waitFor();
ok(true, 'episodio eliminado tras confirmar');
// eliminar el perfil secundario y comprobar que el principal conserva sus datos
await page.locator('text="Más" >> visible=true').first().click();
await page.getByText('Perfiles', { exact: true }).click();
await page.getByRole('button', { name: 'Editar / eliminar' }).nth(1).click();
await page.getByLabel(/Para eliminar, escriba/).fill('Perfil Propio Ficticio');
await page.getByRole('button', { name: 'Eliminar perfil y sus datos' }).click();
await page.locator('text="Episodios" >> visible=true').first().click();
await page.locator('text=Mareo con aura (ficticio) >> visible=true').first().waitFor();
ok(true, 'eliminar un perfil no afecta los datos del otro');

console.log('ERRORES DE CONSOLA:', errors.length ? '\n' + errors.slice(0, 10).join('\n') : 'ninguno');
await browser.close();
