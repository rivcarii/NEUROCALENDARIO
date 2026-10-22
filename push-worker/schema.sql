-- Base D1 «neurocalendario-push» (ya creada). Solo guarda suscripciones push y HORAS de aviso; nunca datos de salud.
CREATE TABLE IF NOT EXISTS subs (id TEXT PRIMARY KEY, endpoint TEXT NOT NULL, p256dh TEXT NOT NULL, auth TEXT NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS due (sub_id TEXT NOT NULL, at INTEGER NOT NULL, ref TEXT NOT NULL, PRIMARY KEY (sub_id, at, ref));
CREATE INDEX IF NOT EXISTS due_at ON due(at);
CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL);
