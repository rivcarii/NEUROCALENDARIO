#!/usr/bin/env bash
# Ejecuta las pruebas RLS contra un PostgreSQL temporal. No toca ningún clúster existente.
# Requiere binarios de PostgreSQL 14+ (initdb, pg_ctl, psql). Si es root, usa el usuario `postgres`.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
WORK="$(mktemp -d)"
PORT="${RLS_PORT:-54329}"
RUN=""
if [ "$(id -u)" = "0" ]; then chown postgres "$WORK"; chmod 755 "$HERE" "$HERE/.." "$HERE/../migrations" 2>/dev/null || true; RUN="su postgres -s /bin/bash -c"; fi
exec_as() { if [ -n "$RUN" ]; then $RUN "$1"; else bash -c "$1"; fi; }
cleanup() { exec_as "$PGBIN/pg_ctl -D $WORK/data stop -m immediate >/dev/null 2>&1" || true; rm -rf "$WORK"; }
trap cleanup EXIT
exec_as "$PGBIN/initdb -D $WORK/data -A trust -U postgres >/dev/null"
exec_as "$PGBIN/pg_ctl -D $WORK/data -o '-p $PORT -k $WORK -c listen_addresses=' -l $WORK/log -w start >/dev/null"
P="$PGBIN/psql -X -q -h $WORK -p $PORT -U postgres -v ON_ERROR_STOP=1"
exec_as "$P -d postgres -c 'create database rls'"
exec_as "$P -d rls -f $HERE/stubs.sql"
exec_as "$P -d rls -f $HERE/../migrations/0001_neurocalendario.sql"
exec_as "$P -d rls -f $HERE/rls.test.sql"
