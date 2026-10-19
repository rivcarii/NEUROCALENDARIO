import { z } from 'zod';
import { profileInput, type ProfileInput } from '../domain/schemas';
import { ENTITIES, snake, type ColType, type EntityName } from './entities';
import { AccessDeniedError, NotFoundError, ValidationError } from './errors';
import type { SqlDb, SqlExecutor, SqlParam } from './sql';
import type {
  Account, AccessLevel, AuditEntry, EntityMap, PermissionRow, Profile,
} from './types';

export interface StoreOptions {
  now?: () => Date;
  newId: () => string;
}

export interface ListOptions {
  /** Límite inferior inclusivo sobre la columna temporal de la entidad (ISO o AAAA-MM-DD). */
  from?: string;
  /** Límite superior exclusivo. */
  to?: string;
  search?: string;
  /** Filtros de igualdad en camelCase. */
  where?: Record<string, string | number | boolean | null>;
  order?: 'asc' | 'desc';
  limit?: number;
}

const LEVEL_RANK: Record<AccessLevel, number> = { read: 1, write: 2, admin: 3 };

function encode(type: ColType, v: unknown): SqlParam {
  if (v === undefined || v === null) return null;
  switch (type) {
    case 'json': return JSON.stringify(v);
    case 'bool': return v ? 1 : 0;
    default: return v as SqlParam;
  }
}

function decode(type: ColType, v: unknown): unknown {
  if (v === null || v === undefined) return null;
  switch (type) {
    case 'json': return JSON.parse(v as string);
    case 'bool': return v === 1 || v === true;
    default: return v;
  }
}

function formatZod(e: z.ZodError): string[] {
  return e.issues.map((i) => i.message);
}

/**
 * Capa de acceso a datos con control de autorización por perfil, validación,
 * auditoría (sin contenido clínico) y cola de sincronización.
 * TODA lectura/escritura de datos de salud pasa por aquí.
 */
export class Store {
  private readonly now: () => Date;
  private readonly newId: () => string;

  constructor(
    readonly db: SqlDb,
    readonly accountId: string,
    opts: StoreOptions,
  ) {
    this.now = opts.now ?? (() => new Date());
    this.newId = opts.newId;
  }

  private ts(): string {
    return this.now().toISOString();
  }

  /** Mismo almacén, otra cuenta. */
  as(accountId: string): Store {
    return new Store(this.db, accountId, { now: this.now, newId: this.newId });
  }

  // ───────────────────────── Cuentas ─────────────────────────

  /** Crea la cuenta propietaria inicial. Solo válido si aún no existe ninguna. */
  static async createFirstOwner(db: SqlDb, displayName: string, opts: StoreOptions): Promise<Store> {
    const now = (opts.now ?? (() => new Date()))().toISOString();
    const existing = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM accounts');
    if ((existing?.n ?? 0) > 0) throw new AccessDeniedError('Ya existe una cuenta propietaria.');
    const name = displayName.trim();
    if (!name) throw new ValidationError(['Indique su nombre']);
    const id = opts.newId();
    await db.run(
      'INSERT INTO accounts (id, display_name, role, created_at, updated_at) VALUES (?,?,?,?,?)',
      [id, name, 'owner', now, now],
    );
    await db.run(
      'INSERT INTO audit_log (id, at, account_id, profile_id, action, entity, entity_id, detail) VALUES (?,?,?,?,?,?,?,?)',
      [opts.newId(), now, id, null, 'create', 'account', id, 'owner'],
    );
    return new Store(db, id, opts);
  }

  async getAccount(id = this.accountId): Promise<Account | undefined> {
    const r = await this.db.get<{ id: string; display_name: string; role: Account['role'] }>(
      'SELECT id, display_name, role FROM accounts WHERE id = ?', [id],
    );
    return r && { id: r.id, displayName: r.display_name, role: r.role };
  }

  async listAccounts(): Promise<Account[]> {
    await this.requireOwner();
    const rows = await this.db.all<{ id: string; display_name: string; role: Account['role'] }>(
      'SELECT id, display_name, role FROM accounts ORDER BY created_at',
    );
    return rows.map((r) => ({ id: r.id, displayName: r.display_name, role: r.role }));
  }

  private async requireOwner(): Promise<Account> {
    const a = await this.getAccount();
    if (!a || a.role !== 'owner') throw new AccessDeniedError('Solo el propietario puede hacer esto.');
    return a;
  }

  async createFamilyAccount(displayName: string): Promise<Account> {
    await this.requireOwner();
    const name = displayName.trim();
    if (!name) throw new ValidationError(['Indique un nombre']);
    const id = this.newId();
    const now = this.ts();
    await this.db.transaction(async (tx) => {
      await tx.run(
        'INSERT INTO accounts (id, display_name, role, created_at, updated_at) VALUES (?,?,?,?,?)',
        [id, name, 'family', now, now],
      );
      await this.audit(tx, null, 'create', 'account', id, 'family');
    });
    return { id, displayName: name, role: 'family' };
  }

  // ───────────────────────── Permisos ─────────────────────────

  async levelFor(profileId: string, accountId = this.accountId): Promise<AccessLevel | null> {
    const r = await this.db.get<{ level: AccessLevel }>(
      'SELECT level FROM permissions WHERE profile_id = ? AND account_id = ? AND revoked_at IS NULL',
      [profileId, accountId],
    );
    return r?.level ?? null;
  }

  private async assertLevel(profileId: string, needed: AccessLevel, ex: SqlExecutor = this.db): Promise<void> {
    const r = await ex.get<{ level: AccessLevel }>(
      'SELECT level FROM permissions WHERE profile_id = ? AND account_id = ? AND revoked_at IS NULL',
      [profileId, this.accountId],
    );
    if (!r || LEVEL_RANK[r.level] < LEVEL_RANK[needed]) throw new AccessDeniedError();
  }

  async grant(profileId: string, accountId: string, level: AccessLevel): Promise<void> {
    await this.assertLevel(profileId, 'admin');
    const target = await this.getAccount(accountId);
    if (!target) throw new NotFoundError('La cuenta indicada no existe.');
    const now = this.ts();
    await this.db.transaction(async (tx) => {
      await tx.run(
        `INSERT INTO permissions (id, profile_id, account_id, level, revoked_at, created_at, updated_at, granted_by)
         VALUES (?,?,?,?,NULL,?,?,?)
         ON CONFLICT (profile_id, account_id)
         DO UPDATE SET level = excluded.level, revoked_at = NULL, updated_at = excluded.updated_at, granted_by = excluded.granted_by`,
        [this.newId(), profileId, accountId, level, now, now, this.accountId],
      );
      await this.audit(tx, profileId, 'grant', 'permission', accountId, level);
    });
  }

  async revoke(profileId: string, accountId: string): Promise<void> {
    await this.assertLevel(profileId, 'admin');
    const profile = await this.db.get<{ owner_account_id: string }>(
      'SELECT owner_account_id FROM profiles WHERE id = ?', [profileId],
    );
    if (profile?.owner_account_id === accountId) {
      throw new AccessDeniedError('No se puede revocar el acceso de la cuenta propietaria del perfil.');
    }
    const now = this.ts();
    await this.db.transaction(async (tx) => {
      const res = await tx.run(
        'UPDATE permissions SET revoked_at = ?, updated_at = ? WHERE profile_id = ? AND account_id = ? AND revoked_at IS NULL',
        [now, now, profileId, accountId],
      );
      if (res.changes === 0) throw new NotFoundError('Esa cuenta no tiene acceso a este perfil.');
      await this.audit(tx, profileId, 'revoke', 'permission', accountId, '');
    });
  }

  async listPermissions(profileId: string): Promise<PermissionRow[]> {
    await this.assertLevel(profileId, 'admin');
    const rows = await this.db.all<{
      id: string; profile_id: string; account_id: string; level: AccessLevel; revoked_at: string | null;
    }>('SELECT id, profile_id, account_id, level, revoked_at FROM permissions WHERE profile_id = ?', [profileId]);
    return rows.map((r) => ({
      id: r.id, profileId: r.profile_id, accountId: r.account_id, level: r.level, revokedAt: r.revoked_at,
    }));
  }

  // ───────────────────────── Perfiles ─────────────────────────

  private toProfile(r: Record<string, unknown>): Profile {
    return {
      id: r.id as string,
      ownerAccountId: r.owner_account_id as string,
      displayName: r.display_name as string,
      relationship: r.relationship as string,
      birthYear: (r.birth_year as number | null) ?? null,
      isPrimary: r.is_primary === 1,
      color: r.color as string,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  async createProfile(input: ProfileInput): Promise<Profile> {
    await this.requireOwner();
    const parsed = profileInput.safeParse(input);
    if (!parsed.success) throw new ValidationError(formatZod(parsed.error));
    const p = parsed.data;
    const id = this.newId();
    const now = this.ts();
    await this.db.transaction(async (tx) => {
      if (p.isPrimary) await tx.run('UPDATE profiles SET is_primary = 0 WHERE owner_account_id = ?', [this.accountId]);
      await tx.run(
        `INSERT INTO profiles (id, owner_account_id, display_name, relationship, birth_year, is_primary, color,
          created_at, updated_at, created_by, updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [id, this.accountId, p.displayName, p.relationship, p.birthYear, p.isPrimary ? 1 : 0, p.color, now, now, this.accountId, this.accountId],
      );
      await tx.run(
        `INSERT INTO permissions (id, profile_id, account_id, level, revoked_at, created_at, updated_at, granted_by)
         VALUES (?,?,?,?,NULL,?,?,?)`,
        [this.newId(), id, this.accountId, 'admin', now, now, this.accountId],
      );
      await this.audit(tx, id, 'create', 'profile', id, '');
    });
    return (await this.getProfile(id))!;
  }

  async getProfile(id: string): Promise<Profile | undefined> {
    const r = await this.db.get<Record<string, unknown>>(
      `SELECT p.* FROM profiles p JOIN permissions x ON x.profile_id = p.id
       WHERE p.id = ? AND x.account_id = ? AND x.revoked_at IS NULL`,
      [id, this.accountId],
    );
    return r && this.toProfile(r);
  }

  async listProfiles(): Promise<Profile[]> {
    const rows = await this.db.all<Record<string, unknown>>(
      `SELECT p.* FROM profiles p JOIN permissions x ON x.profile_id = p.id
       WHERE x.account_id = ? AND x.revoked_at IS NULL
       ORDER BY p.is_primary DESC, p.created_at`,
      [this.accountId],
    );
    return rows.map((r) => this.toProfile(r));
  }

  async updateProfile(id: string, patch: Partial<ProfileInput>): Promise<Profile> {
    await this.assertLevel(id, 'admin');
    const current = await this.getProfile(id);
    if (!current) throw new NotFoundError();
    const parsed = profileInput.safeParse({ ...current, ...patch });
    if (!parsed.success) throw new ValidationError(formatZod(parsed.error));
    const p = parsed.data;
    await this.db.transaction(async (tx) => {
      if (p.isPrimary) await tx.run('UPDATE profiles SET is_primary = 0 WHERE owner_account_id = ?', [current.ownerAccountId]);
      await tx.run(
        `UPDATE profiles SET display_name=?, relationship=?, birth_year=?, is_primary=?, color=?, updated_at=?, updated_by=? WHERE id=?`,
        [p.displayName, p.relationship, p.birthYear, p.isPrimary ? 1 : 0, p.color, this.ts(), this.accountId, id],
      );
      await this.audit(tx, id, 'update', 'profile', id, Object.keys(patch).join(','));
    });
    return (await this.getProfile(id))!;
  }

  /** Elimina el perfil y TODOS sus datos (cascada). Requiere administrador del perfil. */
  async deleteProfile(id: string): Promise<void> {
    await this.assertLevel(id, 'admin');
    await this.db.transaction(async (tx) => {
      await tx.run('DELETE FROM audit_log WHERE profile_id = ?', [id]);
      await tx.run('DELETE FROM sync_queue WHERE profile_id = ?', [id]);
      const res = await tx.run('DELETE FROM profiles WHERE id = ?', [id]);
      if (res.changes === 0) throw new NotFoundError();
      await this.audit(tx, null, 'delete', 'profile', id, 'perfil y datos eliminados');
    });
  }

  // ───────────────────────── Entidades ─────────────────────────

  private fromRow<E extends EntityName>(entity: E, r: Record<string, unknown>): EntityMap[E] {
    const spec = ENTITIES[entity];
    const out: Record<string, unknown> = {
      id: r.id, profileId: r.profile_id, createdAt: r.created_at, updatedAt: r.updated_at,
      createdBy: r.created_by, updatedBy: r.updated_by,
    };
    for (const [name, type] of Object.entries(spec.columns) as [string, ColType][]) {
      out[name] = decode(type, r[snake(name)]);
    }
    return out as unknown as EntityMap[E];
  }

  /** Verifica que los identificadores referenciados pertenezcan al MISMO perfil. */
  private async checkRefs(entity: EntityName, profileId: string, data: Record<string, unknown>, ex: SqlExecutor): Promise<void> {
    const refs: [string, string, unknown][] = [];
    if (entity === 'schedule' || entity === 'intake') refs.push(['medications', 'medicationId', data.medicationId]);
    if (entity === 'intake' && data.scheduleId) refs.push(['med_schedules', 'scheduleId', data.scheduleId]);
    if (entity === 'episode') {
      for (const m of (data.relatedMedicationIds as string[] | undefined) ?? []) refs.push(['medications', 'relatedMedicationIds', m]);
    }
    if (entity === 'document' && data.linkedId && data.linkedEntity) {
      const t = (ENTITIES as Record<string, { table: string }>)[data.linkedEntity as string];
      if (!t) throw new ValidationError(['Entidad vinculada no válida']);
      refs.push([t.table, 'linkedId', data.linkedId]);
    }
    if (entity === 'document') {
      // El archivo debe estar en la carpeta privada DEL MISMO perfil (evita apuntar a archivos ajenos).
      const path = String(data.storagePath ?? '');
      if (!path.startsWith(`attachments/${profileId}/`) || path.includes('..')) {
        throw new ValidationError(['La ruta del archivo no pertenece a este perfil.']);
      }
    }
    for (const [table, field, id] of refs) {
      const row = await ex.get<{ n: number }>(
        `SELECT COUNT(*) AS n FROM ${table} WHERE id = ? AND profile_id = ?`, [id as string, profileId],
      );
      if (!row || row.n === 0) {
        throw new ValidationError([`La referencia «${field}» no pertenece a este perfil.`]);
      }
    }
  }

  async create<E extends EntityName>(
    entity: E,
    profileId: string,
    input: z.input<(typeof ENTITIES)[E]['schema']>,
  ): Promise<EntityMap[E]> {
    const spec = ENTITIES[entity];
    const parsed = spec.schema.safeParse(input);
    if (!parsed.success) throw new ValidationError(formatZod(parsed.error));
    const data = parsed.data as Record<string, unknown>;
    const id = this.newId();
    const now = this.ts();
    const cols = Object.keys(spec.columns);
    await this.db.transaction(async (tx) => {
      await this.assertLevel(profileId, 'write', tx);
      await this.checkRefs(entity, profileId, data, tx);
      const names = ['id', 'profile_id', 'created_at', 'updated_at', 'created_by', 'updated_by', ...cols.map(snake)];
      const values: SqlParam[] = [
        id, profileId, now, now, this.accountId, this.accountId,
        ...cols.map((c) => encode((spec.columns as Record<string, ColType>)[c]!, data[c])),
      ];
      await tx.run(
        `INSERT INTO ${spec.table} (${names.join(',')}) VALUES (${names.map(() => '?').join(',')})`,
        values,
      );
      await this.audit(tx, profileId, 'create', entity, id, '');
      await this.enqueue(tx, profileId, entity, id, 'upsert');
    });
    return (await this.get(entity, profileId, id))!;
  }

  async get<E extends EntityName>(entity: E, profileId: string, id: string): Promise<EntityMap[E] | undefined> {
    await this.assertLevel(profileId, 'read');
    const spec = ENTITIES[entity];
    const r = await this.db.get<Record<string, unknown>>(
      `SELECT * FROM ${spec.table} WHERE id = ? AND profile_id = ?`, [id, profileId],
    );
    return r && this.fromRow(entity, r);
  }

  async list<E extends EntityName>(entity: E, profileId: string, opts: ListOptions = {}): Promise<EntityMap[E][]> {
    await this.assertLevel(profileId, 'read');
    const spec = ENTITIES[entity];
    const where: string[] = ['profile_id = ?'];
    const params: SqlParam[] = [profileId];
    if (opts.from) { where.push(`${spec.timeColumn} >= ?`); params.push(opts.from); }
    if (opts.to) { where.push(`${spec.timeColumn} < ?`); params.push(opts.to); }
    if (opts.search?.trim()) {
      const like = `%${opts.search.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      where.push(`(${spec.searchable.map((c) => `${c} LIKE ? ESCAPE '\\'`).join(' OR ')})`);
      for (let i = 0; i < spec.searchable.length; i++) params.push(like);
    }
    for (const [k, v] of Object.entries(opts.where ?? {})) {
      const type = (spec.columns as Record<string, ColType>)[k];
      if (!type) throw new ValidationError([`Filtro desconocido: ${k}`]);
      if (v === null) where.push(`${snake(k)} IS NULL`);
      else { where.push(`${snake(k)} = ?`); params.push(encode(type, v)); }
    }
    const order = opts.order === 'asc' ? 'ASC' : 'DESC';
    let sql = `SELECT * FROM ${spec.table} WHERE ${where.join(' AND ')} ORDER BY ${spec.timeColumn} ${order}, id`;
    if (opts.limit) { sql += ' LIMIT ?'; params.push(Math.max(1, Math.floor(opts.limit))); }
    const rows = await this.db.all<Record<string, unknown>>(sql, params);
    return rows.map((r) => this.fromRow(entity, r));
  }

  async update<E extends EntityName>(
    entity: E,
    profileId: string,
    id: string,
    patch: Partial<z.input<(typeof ENTITIES)[E]['schema']>>,
  ): Promise<EntityMap[E]> {
    const spec = ENTITIES[entity];
    await this.assertLevel(profileId, 'write');
    const current = await this.get(entity, profileId, id);
    if (!current) throw new NotFoundError();
    const { id: _i, profileId: _p, createdAt: _c, updatedAt: _u, createdBy: _cb, updatedBy: _ub, ...rest } =
      current as unknown as Record<string, unknown>;
    const parsed = spec.schema.safeParse({ ...rest, ...patch });
    if (!parsed.success) throw new ValidationError(formatZod(parsed.error));
    const data = parsed.data as Record<string, unknown>;
    const cols = Object.keys(spec.columns);
    const changed = cols.filter((c) => JSON.stringify(data[c] ?? null) !== JSON.stringify(rest[c] ?? null));
    await this.db.transaction(async (tx) => {
      await this.assertLevel(profileId, 'write', tx);
      await this.checkRefs(entity, profileId, data, tx);
      const sets = cols.map((c) => `${snake(c)} = ?`).join(', ');
      const values: SqlParam[] = [
        ...cols.map((c) => encode((spec.columns as Record<string, ColType>)[c]!, data[c])),
        this.ts(), this.accountId, id, profileId,
      ];
      const res = await tx.run(
        `UPDATE ${spec.table} SET ${sets}, updated_at = ?, updated_by = ? WHERE id = ? AND profile_id = ?`,
        values,
      );
      if (res.changes === 0) throw new NotFoundError();
      await this.audit(tx, profileId, 'update', entity, id, changed.join(','));
      await this.enqueue(tx, profileId, entity, id, 'upsert');
    });
    return (await this.get(entity, profileId, id))!;
  }

  /**
   * Elimina un registro. Los dependientes se eliminan por cascada (p. ej. pautas e
   * ingestas de un medicamento) y los recordatorios huérfanos se limpian aquí.
   */
  async remove(entity: EntityName, profileId: string, id: string): Promise<void> {
    const spec = ENTITIES[entity];
    await this.db.transaction(async (tx) => {
      await this.assertLevel(profileId, 'write', tx);
      if (entity === 'medication') {
        await tx.run(
          `DELETE FROM reminders WHERE profile_id = ? AND ref_id IN (SELECT id FROM med_schedules WHERE medication_id = ?)`,
          [profileId, id],
        );
      }
      if (entity === 'schedule' || entity === 'appointment') {
        await tx.run('DELETE FROM reminders WHERE profile_id = ? AND ref_id = ?', [profileId, id]);
      }
      if (entity === 'medication') {
        // Quita la referencia en episodios para no dejar identificadores colgantes.
        const eps = await tx.all<{ id: string; related_medication_ids: string }>(
          `SELECT id, related_medication_ids FROM episodes WHERE profile_id = ? AND related_medication_ids LIKE ?`,
          [profileId, `%${id}%`],
        );
        for (const e of eps) {
          const ids = (JSON.parse(e.related_medication_ids) as string[]).filter((m) => m !== id);
          await tx.run('UPDATE episodes SET related_medication_ids = ? WHERE id = ?', [JSON.stringify(ids), e.id]);
        }
      }
      if (entity === 'document') {
        // El archivo físico lo elimina la capa de servicios (necesita el sistema de archivos).
      }
      // Vínculos de documentos a la entidad eliminada.
      await tx.run(
        'UPDATE documents SET linked_entity = NULL, linked_id = NULL WHERE profile_id = ? AND linked_id = ?',
        [profileId, id],
      );
      const res = await tx.run(`DELETE FROM ${spec.table} WHERE id = ? AND profile_id = ?`, [id, profileId]);
      if (res.changes === 0) throw new NotFoundError();
      await this.audit(tx, profileId, 'delete', entity, id, '');
      await this.enqueue(tx, profileId, entity, id, 'delete');
    });
  }

  /**
   * Registra o actualiza una toma de forma idempotente por (pauta, instante programado),
   * evitando duplicados si el usuario toca dos veces.
   */
  async recordIntake(
    profileId: string,
    input: z.input<(typeof ENTITIES)['intake']['schema']>,
  ): Promise<EntityMap['intake']> {
    const parsed = ENTITIES.intake.schema.safeParse(input);
    if (!parsed.success) throw new ValidationError(formatZod(parsed.error));
    const d = parsed.data as { scheduleId: string | null; scheduledAt: string | null };
    if (d.scheduleId && d.scheduledAt) {
      await this.assertLevel(profileId, 'write');
      const existing = await this.db.get<{ id: string }>(
        'SELECT id FROM med_intakes WHERE profile_id = ? AND schedule_id = ? AND scheduled_at = ?',
        [profileId, d.scheduleId, d.scheduledAt],
      );
      if (existing) return this.update('intake', profileId, existing.id, input);
    }
    return this.create('intake', profileId, input);
  }

  // ───────────────────────── Auditoría y sincronización ─────────────────────────

  private async audit(
    ex: SqlExecutor, profileId: string | null, action: string, entity: string, entityId: string | null, detail: string,
  ): Promise<void> {
    await ex.run(
      'INSERT INTO audit_log (id, at, account_id, profile_id, action, entity, entity_id, detail) VALUES (?,?,?,?,?,?,?,?)',
      [this.newId(), this.ts(), this.accountId, profileId, action, entity, entityId, detail],
    );
  }

  private async enqueue(
    ex: SqlExecutor, profileId: string, entity: string, entityId: string, op: 'upsert' | 'delete',
  ): Promise<void> {
    const on = await ex.get<{ value: string }>("SELECT value FROM settings WHERE key = 'sync_enabled'");
    if (on?.value !== '1') return;
    await ex.run(
      'INSERT INTO sync_queue (id, profile_id, entity, entity_id, op, queued_at, attempts) VALUES (?,?,?,?,?,?,0)',
      [this.newId(), profileId, entity, entityId, op, this.ts()],
    );
  }

  /** Deja constancia (sin contenido clínico) de una exportación o informe generado. */
  async auditExport(profileId: string, entity: 'report' | 'backup', detail: string): Promise<void> {
    await this.assertLevel(profileId, 'read');
    await this.audit(this.db, profileId, 'export', entity, null, detail);
  }

  async logReport(profileId: string, periodStart: string, periodEnd: string, sections: string[]): Promise<void> {
    await this.assertLevel(profileId, 'read');
    await this.db.transaction(async (tx) => {
      await tx.run(
        'INSERT INTO reports (id, profile_id, period_start, period_end, sections, file_path, generated_at, generated_by) VALUES (?,?,?,?,?,NULL,?,?)',
        [this.newId(), profileId, periodStart, periodEnd, JSON.stringify(sections), this.ts(), this.accountId],
      );
      await this.audit(tx, profileId, 'export', 'report', null, `${periodStart}..${periodEnd}`);
    });
  }

  async listAudit(profileId: string, limit = 200): Promise<AuditEntry[]> {
    await this.assertLevel(profileId, 'admin');
    const rows = await this.db.all<Record<string, unknown>>(
      'SELECT * FROM audit_log WHERE profile_id = ? ORDER BY at DESC, id LIMIT ?', [profileId, limit],
    );
    return rows.map((r) => ({
      id: r.id as string, at: r.at as string, accountId: r.account_id as string,
      profileId: (r.profile_id as string | null) ?? null, action: r.action as string,
      entity: r.entity as string, entityId: (r.entity_id as string | null) ?? null, detail: r.detail as string,
    }));
  }

  // ───────────────────────── Ajustes ─────────────────────────

  async getSetting(key: string): Promise<string | undefined> {
    return (await this.db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]))?.value;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.db.run(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value],
    );
  }

}
