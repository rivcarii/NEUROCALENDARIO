/**
 * Abstracción mínima sobre SQLite. La app usa expo-sqlite; las pruebas usan
 * node:sqlite. Toda la lógica de datos depende solo de esta interfaz.
 */
export type SqlParam = string | number | null;

export interface SqlRunResult {
  changes: number;
}

export interface SqlExecutor {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: SqlParam[]): Promise<SqlRunResult>;
  all<T>(sql: string, params?: SqlParam[]): Promise<T[]>;
  get<T>(sql: string, params?: SqlParam[]): Promise<T | undefined>;
}

export interface SqlDb extends SqlExecutor {
  /** Ejecuta `fn` en una transacción serializada. Si lanza, se revierte. */
  transaction<T>(fn: (tx: SqlExecutor) => Promise<T>): Promise<T>;
}

/** Controlador crudo: sin cola ni transacciones. */
export type RawDriver = SqlExecutor;

/** Envuelve un controlador crudo con serialización de operaciones y transacciones. */
export function createSqlDb(driver: RawDriver): SqlDb {
  let tail: Promise<unknown> = Promise.resolve();

  function enqueue<T>(job: () => Promise<T>): Promise<T> {
    const result = tail.then(job, job);
    tail = result.catch(() => undefined);
    return result;
  }

  return {
    exec: (sql) => enqueue(() => driver.exec(sql)),
    run: (sql, params) => enqueue(() => driver.run(sql, params)),
    all: (sql, params) => enqueue(() => driver.all(sql, params)),
    get: (sql, params) => enqueue(() => driver.get(sql, params)),
    transaction: <T>(fn: (tx: SqlExecutor) => Promise<T>) =>
      enqueue(async () => {
        await driver.exec('BEGIN IMMEDIATE');
        try {
          const out = await fn(driver);
          await driver.exec('COMMIT');
          return out;
        } catch (e) {
          try {
            await driver.exec('ROLLBACK');
          } catch {
            /* la transacción ya pudo cerrarse */
          }
          throw e;
        }
      }),
  };
}
