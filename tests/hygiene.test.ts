import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..');

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (['node_modules', '.git', '.expo', 'dist', 'docs', 'coverage'].includes(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const textFiles = walk(ROOT).filter((f) => /\.(ts|tsx|js|json|md|sql|sh|yml|yaml|example)$/.test(f) && !f.endsWith('package-lock.json'));
const srcFiles = walk(join(ROOT, 'src')).filter((f) => /\.(ts|tsx)$/.test(f));

describe('higiene del repositorio', () => {
  it('no contiene secretos', () => {
    const patterns: [RegExp, string][] = [
      [/eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/, 'JWT'],
      [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'clave privada'],
      [/\bsk_(live|test)_[A-Za-z0-9]{10,}/, 'clave tipo Stripe'],
      [/\bAKIA[0-9A-Z]{16}\b/, 'clave AWS'],
      [/\bsbp_[a-f0-9]{30,}/, 'token Supabase'],
      [/(password|passwd|secret|token)\s*[:=]\s*['"][^'"\s]{12,}['"]/i, 'credencial literal'],
    ];
    const hits: string[] = [];
    for (const f of textFiles) {
      if (f.includes('hygiene.test.ts')) continue;
      const txt = readFileSync(f, 'utf8');
      for (const [re, name] of patterns) if (re.test(txt)) hits.push(`${f}: ${name}`);
    }
    expect(hits).toEqual([]);
  });

  it('.env.example no define valores y .env está ignorado por git', () => {
    const env = readFileSync(join(ROOT, '.env.example'), 'utf8');
    for (const line of env.split('\n').filter((l) => l && !l.startsWith('#'))) expect(line).toMatch(/^[A-Z_]+=$/);
    const ignored = execFileSync('git', ['check-ignore', '.env', '.env.local'], { cwd: ROOT, encoding: 'utf8' });
    expect(ignored).toContain('.env');
  });

  it('el código móvil no usa la service_role ni cliente de red', () => {
    for (const f of srcFiles) {
      const txt = readFileSync(f, 'utf8');
      expect(`${f}:${/service_role/i.test(txt)}`).toBe(`${f}:false`);
      // Única excepción: updates.ts consulta version.json del propio sitio (GET sin datos) para avisar de versiones nuevas.
      const net = txt.replace(/fetch\(`\$\{BASE\}\/version\.json\?t=\$\{Date\.now\(\)\}`, \{ cache: 'no-store' \}\)/g, '');
      // Segunda excepción: push.ts habla SOLO con el servicio de avisos propio (PUSH_URL) — ver prueba siguiente.
      if (f.endsWith(join('services', 'push.ts'))) continue;
      expect(`${f}:${/\b(fetch|XMLHttpRequest|axios)\s*\(/.test(net)}`).toBe(`${f}:false`);
      expect(`${f}:${/https?:\/\//.test(txt)}`).toBe(`${f}:false`);
    }
  });

  it('los avisos web solo envían horas e identificadores opacos al servicio propio', () => {
    const txt = readFileSync(join(ROOT, 'src', 'services', 'push.ts'), 'utf8');
    const calls = txt.match(/fetch\(([^,)]+)/g) ?? [];
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) expect(c).toMatch(/fetch\(`\$\{PUSH_URL\}/);
    expect(txt).not.toMatch(/https?:\/\//);
    // lo único que viaja por aviso es { at, ref }; el texto se guarda en el dispositivo
    expect(txt).toMatch(/return \{ at: Date\.parse\(p\.r\.fireAt\), ref \};/);
    expect(txt).toMatch(/post\('\/sync', \{ subscription: \{ endpoint: json\.endpoint, keys: json\.keys \}, due \}\)/);
  });

  it('el código no escribe en logs (evita datos médicos en registros)', () => {
    for (const f of srcFiles) {
      const txt = readFileSync(f, 'utf8');
      expect(`${f}:${/console\.(log|info|debug|warn|error|trace)/.test(txt)}`).toBe(`${f}:false`);
    }
  });

  it('el audit_log y la cola de sincronización no almacenan contenido clínico', () => {
    const mig = readFileSync(join(ROOT, 'src/db/migrations.ts'), 'utf8');
    const audit = /CREATE TABLE audit_log \(([\s\S]*?)\);/.exec(mig)![1]!;
    expect(audit).not.toMatch(/payload|data|content|notes|body/i);
    const q = /CREATE TABLE sync_queue \(([\s\S]*?)\);/.exec(mig)![1]!;
    expect(q).not.toMatch(/payload|data|content|notes|body/i);
  });
});
