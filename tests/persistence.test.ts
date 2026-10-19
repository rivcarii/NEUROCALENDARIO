import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { currentVersion, LATEST_VERSION, migrate, MIGRATIONS } from '../src/db/migrations';
import { Store } from '../src/db/store';
import { makeFixture, newId, openTestDb } from './helpers/nodeDriver';

describe('migraciones', () => {
  it('crea el esquema y fija la versión', async () => {
    const { db, close } = await openTestDb();
    expect(await currentVersion(db)).toBe(LATEST_VERSION);
    const tables = await db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table'");
    for (const t of ['profiles', 'episodes', 'medications', 'med_schedules', 'med_intakes', 'appointments',
      'exams', 'documents', 'notes', 'reminders', 'reports', 'audit_log', 'sync_queue', 'permissions']) {
      expect(tables.map((x) => x.name)).toContain(t);
    }
    close();
  });

  it('es idempotente y rechaza bases más nuevas que la app', async () => {
    const { db, close } = await openTestDb();
    expect(await migrate(db)).toBe(LATEST_VERSION);
    await db.exec(`PRAGMA user_version = ${LATEST_VERSION + 5}`);
    await expect(migrate(db)).rejects.toThrow(/más reciente/);
    close();
  });

  it('migra de v1 a una v2 simulada conservando los datos', async () => {
    const { db, close } = await openTestDb();
    const owner = await Store.createFirstOwner(db, 'Prop', { newId });
    const p = await owner.createProfile({ displayName: 'P1' });
    await owner.create('note', p.id, { body: 'dato previo', noteDate: '2026-01-01' });
    const v2 = { version: LATEST_VERSION + 1, name: 'prueba', sql: 'ALTER TABLE notes ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;' };
    expect(await migrate(db, [...MIGRATIONS, v2])).toBe(LATEST_VERSION + 1);
    const notes = await owner.list('note', p.id);
    expect(notes).toHaveLength(1);
    expect(notes[0]!.body).toBe('dato previo');
    close();
  });

  it('una migración fallida se revierte por completo', async () => {
    const { db, close } = await openTestDb();
    const bad = { version: LATEST_VERSION + 1, name: 'mala', sql: 'CREATE TABLE x(a); SELECT * FROM no_existe;' };
    await expect(migrate(db, [...MIGRATIONS, bad])).rejects.toThrow();
    expect(await currentVersion(db)).toBe(LATEST_VERSION);
    const t = await db.get("SELECT name FROM sqlite_master WHERE name='x'");
    expect(t).toBeUndefined();
    close();
  });
});

describe('persistencia tras cerrar y reabrir (archivo real)', () => {
  it('los registros de ambos perfiles sobreviven al reinicio', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'neuro-'));
    const file = join(dir, 'test.db');
    try {
      const a = await makeFixture(file);
      const ep = await a.owner.create('episode', a.mom, {
        startedAt: '2026-03-01T10:00:00.000Z', endedAt: '2026-03-01T10:20:00.000Z',
        kind: 'Cefalea (ficticia)', intensity: 6, associatedSymptoms: ['náusea'],
      });
      await a.owner.create('episode', a.me, { startedAt: '2026-03-02T08:00:00.000Z', kind: 'Mareo (ficticio)' });
      await a.owner.update('episode', a.mom, ep.id, { intensity: 8, notes: 'editado' });
      a.close();

      const { db, close } = await openTestDb(file);
      const owner = await Store.createFirstOwner(db, 'x', { newId }).catch(() => null);
      expect(owner).toBeNull(); // ya existe propietario
      const acc = await db.get<{ id: string }>('SELECT id FROM accounts');
      const s = new Store(db, acc!.id, { newId });
      const profiles = await s.listProfiles();
      expect(profiles).toHaveLength(2);
      const mom = profiles.find((p) => p.isPrimary)!;
      const eps = await s.list('episode', mom.id);
      expect(eps).toHaveLength(1);
      expect(eps[0]).toMatchObject({ intensity: 8, notes: 'editado', associatedSymptoms: ['náusea'] });
      const mine = profiles.find((p) => !p.isPrimary)!;
      expect(await s.list('episode', mine.id)).toHaveLength(1);
      close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
