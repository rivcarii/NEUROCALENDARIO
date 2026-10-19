import * as SQLite from 'expo-sqlite';
import { migrate } from '../db/migrations';
import { createSqlDb, type RawDriver, type SqlDb, type SqlParam } from '../db/sql';

const DB_NAME = 'neurocalendario.db';

let dbPromise: Promise<SqlDb> | null = null;

function expoDriver(raw: SQLite.SQLiteDatabase): RawDriver {
  return {
    exec: (sql) => raw.execAsync(sql),
    run: async (sql, params: SqlParam[] = []) => {
      const r = await raw.runAsync(sql, params);
      return { changes: r.changes };
    },
    all: <T,>(sql: string, params: SqlParam[] = []) => raw.getAllAsync<T>(sql, params),
    get: async <T,>(sql: string, params: SqlParam[] = []) => (await raw.getFirstAsync<T>(sql, params)) ?? undefined,
  };
}

/** Abre (una sola vez) la base local y aplica migraciones pendientes. */
export function getDb(): Promise<SqlDb> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const raw = await SQLite.openDatabaseAsync(DB_NAME);
      await raw.execAsync('PRAGMA journal_mode = WAL');
      const db = createSqlDb(expoDriver(raw));
      await migrate(db);
      return db;
    })();
    dbPromise.catch(() => { dbPromise = null; });
  }
  return dbPromise;
}
