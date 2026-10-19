import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { migrate } from '../../src/db/migrations';
import { createSqlDb, type RawDriver, type SqlDb, type SqlParam } from '../../src/db/sql';
import { Store } from '../../src/db/store';

export function nodeDriver(file = ':memory:'): { driver: RawDriver; close: () => void } {
  const raw = new DatabaseSync(file);
  const driver: RawDriver = {
    exec: async (sql) => { raw.exec(sql); },
    run: async (sql, params: SqlParam[] = []) => {
      const r = raw.prepare(sql).run(...params);
      return { changes: Number(r.changes) };
    },
    all: async <T,>(sql: string, params: SqlParam[] = []) => raw.prepare(sql).all(...params) as T[],
    get: async <T,>(sql: string, params: SqlParam[] = []) => raw.prepare(sql).get(...params) as T | undefined,
  };
  return { driver, close: () => raw.close() };
}

export async function openTestDb(file = ':memory:'): Promise<{ db: SqlDb; close: () => void }> {
  const { driver, close } = nodeDriver(file);
  const db = createSqlDb(driver);
  await migrate(db);
  return { db, close };
}

export interface Fixture {
  db: SqlDb;
  owner: Store;
  mom: string;
  me: string;
  close: () => void;
}

/** Dos perfiles ficticios: «Perfil Mamá» (principal) y «Perfil Propio». */
export async function makeFixture(file = ':memory:'): Promise<Fixture> {
  const { db, close } = await openTestDb(file);
  const owner = await Store.createFirstOwner(db, 'Propietario Ficticio', { newId: randomUUID });
  const mom = await owner.createProfile({ displayName: 'Perfil Mamá (ficticio)', relationship: 'madre', isPrimary: true });
  const me = await owner.createProfile({ displayName: 'Perfil Propio (ficticio)', relationship: 'yo' });
  return { db, owner, mom: mom.id, me: me.id, close };
}

export const newId = randomUUID;
