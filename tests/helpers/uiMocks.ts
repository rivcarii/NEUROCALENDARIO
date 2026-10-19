import { randomUUID } from 'node:crypto';
import type { SqlDb } from '../../src/db/sql';
import { openTestDb } from './nodeDriver';

/** Base de datos compartida por los módulos mockeados durante una prueba de UI. */
export const holder: { db: SqlDb | null; close: (() => void) | null } = { db: null, close: null };

export async function freshDb(): Promise<SqlDb> {
  holder.close?.();
  const { db, close } = await openTestDb();
  holder.db = db;
  holder.close = close;
  return db;
}

export const uuid = randomUUID;
