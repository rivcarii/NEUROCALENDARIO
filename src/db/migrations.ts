import type { SqlDb } from './sql';

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

const BASE = `
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES accounts(id),
  updated_by TEXT NOT NULL REFERENCES accounts(id)`;

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'esquema inicial',
    sql: `
CREATE TABLE accounts (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','family')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE profiles (
  id TEXT PRIMARY KEY NOT NULL,
  owner_account_id TEXT NOT NULL REFERENCES accounts(id),
  display_name TEXT NOT NULL,
  relationship TEXT NOT NULL DEFAULT '',
  birth_year INTEGER,
  is_primary INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#2F5D8A',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES accounts(id),
  updated_by TEXT NOT NULL REFERENCES accounts(id)
);

CREATE TABLE permissions (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('read','write','admin')),
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  granted_by TEXT NOT NULL REFERENCES accounts(id),
  UNIQUE (profile_id, account_id)
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE symptom_catalog (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  builtin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE episodes (${BASE},
  started_at TEXT NOT NULL,
  ended_at TEXT,
  kind TEXT NOT NULL,
  intensity INTEGER CHECK (intensity BETWEEN 0 AND 10),
  associated_symptoms TEXT NOT NULL DEFAULT '[]',
  context TEXT NOT NULL DEFAULT '',
  sleep_hours REAL CHECK (sleep_hours BETWEEN 0 AND 24),
  stress_level INTEGER CHECK (stress_level BETWEEN 0 AND 10),
  declared_triggers TEXT NOT NULL DEFAULT '[]',
  related_medication_ids TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  recovery TEXT NOT NULL DEFAULT 'desconocida'
    CHECK (recovery IN ('completa','parcial','sin_recuperar','desconocida')),
  is_quick INTEGER NOT NULL DEFAULT 0,
  CHECK (ended_at IS NULL OR ended_at >= started_at)
);
CREATE INDEX idx_episodes_profile_started ON episodes(profile_id, started_at);

CREATE TABLE medications (${BASE},
  name TEXT NOT NULL,
  dose_text TEXT NOT NULL DEFAULT '',
  form TEXT NOT NULL DEFAULT '',
  prescriber TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  start_date TEXT,
  end_date TEXT,
  notes TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_medications_profile ON medications(profile_id);

CREATE TABLE med_schedules (${BASE},
  medication_id TEXT NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  times TEXT NOT NULL,
  days_of_week TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  prescribed_by TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  reminders_enabled INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_schedules_med ON med_schedules(medication_id);

CREATE TABLE med_intakes (${BASE},
  medication_id TEXT NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  schedule_id TEXT REFERENCES med_schedules(id) ON DELETE SET NULL,
  scheduled_at TEXT,
  taken_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('tomada','omitida','pospuesta')),
  notes TEXT NOT NULL DEFAULT '',
  UNIQUE (schedule_id, scheduled_at)
);
CREATE INDEX idx_intakes_profile_time ON med_intakes(profile_id, scheduled_at);

CREATE TABLE appointments (${BASE},
  title TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  location TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'programada'
    CHECK (status IN ('programada','realizada','cancelada')),
  remind_minutes_before INTEGER,
  CHECK (ends_at IS NULL OR ends_at >= starts_at)
);
CREATE INDEX idx_appointments_profile_start ON appointments(profile_id, starts_at);

CREATE TABLE exams (${BASE},
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT '',
  exam_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','con_resultado')),
  result_text TEXT NOT NULL DEFAULT '',
  result_source TEXT NOT NULL DEFAULT 'declarado_por_usuario'
    CHECK (result_source IN ('informe_medico','declarado_por_usuario')),
  requested_by TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_exams_profile_date ON exams(profile_id, exam_date);

CREATE TABLE documents (${BASE},
  title TEXT NOT NULL,
  doc_date TEXT,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('application/pdf','image/jpeg','image/png')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  sha256 TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  linked_entity TEXT,
  linked_id TEXT,
  notes TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_documents_profile ON documents(profile_id);

CREATE TABLE notes (${BASE},
  body TEXT NOT NULL,
  author_role TEXT NOT NULL DEFAULT 'persona' CHECK (author_role IN ('persona','cuidador')),
  note_date TEXT NOT NULL
);
CREATE INDEX idx_notes_profile_date ON notes(profile_id, note_date);

CREATE TABLE reminders (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('cita','medicamento','actividad')),
  ref_id TEXT NOT NULL,
  fire_at TEXT NOT NULL,
  notification_id TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_reminders_ref ON reminders(ref_id);

CREATE TABLE reports (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  sections TEXT NOT NULL,
  file_path TEXT,
  generated_at TEXT NOT NULL,
  generated_by TEXT NOT NULL REFERENCES accounts(id)
);

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  at TEXT NOT NULL,
  account_id TEXT NOT NULL,
  profile_id TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  detail TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_audit_profile ON audit_log(profile_id, at);

CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  op TEXT NOT NULL CHECK (op IN ('upsert','delete')),
  queued_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);
`,
  },
];

export const LATEST_VERSION = MIGRATIONS[MIGRATIONS.length - 1]!.version;

export async function currentVersion(db: SqlDb): Promise<number> {
  const row = await db.get<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

/** Aplica las migraciones pendientes, cada una en su propia transacción. */
export async function migrate(db: SqlDb, migrations: Migration[] = MIGRATIONS): Promise<number> {
  await db.exec('PRAGMA foreign_keys = ON');
  let version = await currentVersion(db);
  const known = migrations[migrations.length - 1]?.version ?? 0;
  if (version > known) {
    throw new Error(
      `La base de datos (v${version}) es más reciente que esta versión de la app (v${known}).`,
    );
  }
  for (const m of migrations) {
    if (m.version <= version) continue;
    await db.transaction(async (tx) => {
      await tx.exec(m.sql);
      await tx.exec(`PRAGMA user_version = ${m.version}`);
    });
    version = m.version;
  }
  return version;
}
