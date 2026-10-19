import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import { scrypt } from '@noble/hashes/scrypt.js';
import { ENTITIES, snake, type ColType, type EntityName } from '../db/entities';
import { ValidationError } from '../db/errors';
import type { SqlParam } from '../db/sql';
import type { Store } from '../db/store';

export const BACKUP_FORMAT = 'neurocalendario-backup';
export const BACKUP_VERSION = 1;

export interface FileAdapter {
  /** Lee un archivo adjunto como base64. */
  readBase64(path: string): Promise<string>;
  /** Escribe un archivo adjunto desde base64. */
  writeBase64(path: string, b64: string): Promise<void>;
}

export interface BackupPayload {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  profile: { displayName: string; relationship: string; birthYear: number | null; color: string };
  data: Record<EntityName, Record<string, unknown>[]>;
  files: Record<string, string>;
  missingFiles: string[];
}

const ORDER: EntityName[] = ['medication', 'schedule', 'episode', 'intake', 'appointment', 'exam', 'note', 'document'];

/** Reúne todos los datos de UN perfil (requiere permiso de lectura). */
export async function buildBackup(
  store: Store, profileId: string, files?: FileAdapter, includeFiles = true,
): Promise<BackupPayload> {
  const profile = await store.getProfile(profileId);
  if (!profile) throw new ValidationError(['Perfil no accesible']);
  const data = {} as BackupPayload['data'];
  for (const e of ORDER) data[e] = (await store.list(e, profileId, { order: 'asc' })) as unknown as Record<string, unknown>[];
  const out: BackupPayload = {
    format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: new Date().toISOString(),
    profile: { displayName: profile.displayName, relationship: profile.relationship, birthYear: profile.birthYear, color: profile.color },
    data, files: {}, missingFiles: [],
  };
  if (files && includeFiles) {
    for (const d of data.document) {
      const p = d.storagePath as string;
      try { out.files[p] = await files.readBase64(p); } catch { out.missingFiles.push(p); }
    }
  }
  return out;
}

/**
 * Restaura una copia como un perfil NUEVO (nunca sobrescribe uno existente) con
 * identificadores nuevos. La autoría pasa a la cuenta que restaura.
 */
export async function restoreBackup(
  store: Store, payload: unknown, newId: () => string, files?: FileAdapter,
): Promise<{ profileId: string; counts: Record<string, number> }> {
  const p = payload as BackupPayload;
  if (!p || p.format !== BACKUP_FORMAT) throw new ValidationError(['El archivo no es una copia de NeuroCalendario.']);
  if (typeof p.version !== 'number' || p.version > BACKUP_VERSION) {
    throw new ValidationError(['La copia es de una versión más reciente de la app.']);
  }
  const profile = await store.createProfile({
    displayName: `${p.profile.displayName} (restaurado)`,
    relationship: p.profile.relationship, birthYear: p.profile.birthYear, color: p.profile.color,
  });
  const idMap = new Map<string, string>();
  const counts: Record<string, number> = {};
  const now = new Date().toISOString();
  const me = store.accountId;

  const remap = (v: unknown) => (typeof v === 'string' ? idMap.get(v) ?? null : null);
  try {
    await store.db.transaction(async (tx) => {
      for (const entity of ORDER) {
        const spec = ENTITIES[entity];
        const cols = Object.keys(spec.columns);
        counts[entity] = 0;
        for (const row of p.data[entity] ?? []) {
          const oldId = String(row.id);
          const id = newId();
          idMap.set(oldId, id);
          const values: Record<string, unknown> = { ...row };
          if (entity === 'schedule' || entity === 'intake') values.medicationId = remap(row.medicationId);
          if (entity === 'intake') values.scheduleId = remap(row.scheduleId);
          if (entity === 'episode') {
            values.relatedMedicationIds = ((row.relatedMedicationIds as string[]) ?? []).map(remap).filter(Boolean);
          }
          if (entity === 'document') { values.linkedId = null; values.linkedEntity = null; }
          // valida con el mismo esquema que el uso normal
          const parsed = spec.schema.safeParse(values);
          if (!parsed.success) throw new ValidationError([`Registro no válido en ${entity}: ${parsed.error.issues[0]?.message ?? ''}`]);
          const data = parsed.data as Record<string, unknown>;
          const names = ['id', 'profile_id', 'created_at', 'updated_at', 'created_by', 'updated_by', ...cols.map(snake)];
          const params: SqlParam[] = [
            id, profile.id, String(row.createdAt ?? now), now, me, me,
            ...cols.map((c) => {
              const t = (spec.columns as Record<string, ColType>)[c]!;
              const v = data[c];
              if (v === undefined || v === null) return null;
              if (t === 'json') return JSON.stringify(v);
              if (t === 'bool') return v ? 1 : 0;
              return v as SqlParam;
            }),
          ];
          await tx.run(`INSERT INTO ${spec.table} (${names.join(',')}) VALUES (${names.map(() => '?').join(',')})`, params);
          counts[entity] = (counts[entity] ?? 0) + 1;
        }
      }
      // vínculos de documentos
      for (const row of p.data.document ?? []) {
        if (row.linkedEntity && row.linkedId && idMap.has(String(row.linkedId))) {
          await tx.run('UPDATE documents SET linked_entity = ?, linked_id = ? WHERE id = ?',
            [String(row.linkedEntity), idMap.get(String(row.linkedId))!, idMap.get(String(row.id))!]);
        }
      }
      await tx.run(
        'INSERT INTO audit_log (id, at, account_id, profile_id, action, entity, entity_id, detail) VALUES (?,?,?,?,?,?,?,?)',
        [newId(), now, me, profile.id, 'restore', 'profile', profile.id, 'copia restaurada'],
      );
    });
    if (files) {
      for (const [path, b64] of Object.entries(p.files ?? {})) await files.writeBase64(path, b64);
    }
  } catch (e) {
    await store.deleteProfile(profile.id); // no deja un perfil a medias
    throw e;
  }
  return { profileId: profile.id, counts };
}

// ───────────────────────── Cifrado de la copia ─────────────────────────

const MAGIC = 'NCB1';
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, dkLen: 32 } as const;

const b64enc = (u: Uint8Array) => {
  let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
};
const b64dec = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export interface EncryptedBackup {
  magic: typeof MAGIC;
  kdf: 'scrypt';
  params: { N: number; r: number; p: number };
  salt: string;
  nonce: string;
  ciphertext: string;
}

export const MIN_PASSPHRASE = 10;

/** scrypt + XChaCha20-Poly1305. La frase de paso nunca se almacena. */
export function encryptBackup(payload: BackupPayload, passphrase: string): EncryptedBackup {
  if (passphrase.length < MIN_PASSPHRASE) throw new ValidationError([`La contraseña debe tener al menos ${MIN_PASSPHRASE} caracteres.`]);
  const salt = randomBytes(16);
  const nonce = randomBytes(24);
  const key = scrypt(new TextEncoder().encode(passphrase.normalize('NFKC')), salt, SCRYPT);
  const ct = xchacha20poly1305(key, nonce).encrypt(new TextEncoder().encode(JSON.stringify(payload)));
  return {
    magic: MAGIC, kdf: 'scrypt', params: { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p },
    salt: b64enc(salt), nonce: b64enc(nonce), ciphertext: b64enc(ct),
  };
}

export function decryptBackup(enc: EncryptedBackup, passphrase: string): BackupPayload {
  if (!enc || enc.magic !== MAGIC) throw new ValidationError(['Archivo de copia no reconocido.']);
  // Límite de coste para que un archivo malicioso no agote la memoria.
  if (enc.params.N > 2 ** 17 || enc.params.r > 16 || enc.params.p > 4) throw new ValidationError(['Parámetros de copia no admitidos.']);
  try {
    const key = scrypt(new TextEncoder().encode(passphrase.normalize('NFKC')), b64dec(enc.salt), { ...enc.params, dkLen: 32 });
    const pt = xchacha20poly1305(key, b64dec(enc.nonce)).decrypt(b64dec(enc.ciphertext));
    return JSON.parse(new TextDecoder().decode(pt)) as BackupPayload;
  } catch {
    throw new ValidationError(['Contraseña incorrecta o copia dañada.']);
  }
}

export function isEncryptedBackup(x: unknown): x is EncryptedBackup {
  return typeof x === 'object' && x !== null && (x as { magic?: string }).magic === MAGIC;
}
