\set ON_ERROR_STOP on
\set QUIET on
-- Pruebas de autorización (RLS) con usuarios ficticios. Cada DO falla si el comportamiento es inseguro.

create schema t;
grant usage on schema t to authenticated, anon;

create function t.as_user(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
create function t.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('role', 'anon', true);
end $$;
create function t.as_admin() returns void language plpgsql as $$
begin perform set_config('role', 'none', true); end $$;
create function t.expect_fail(q text, why text) returns void language plpgsql as $$
begin
  begin execute q;
  exception when others then return;
  end;
  raise exception 'FALLO DE SEGURIDAD (se esperaba rechazo): %', why;
end $$;
create function t.rows(q text) returns bigint language plpgsql as $$
declare n bigint;
begin execute q; get diagnostics n = row_count; return n; end $$;
create function t.count(q text) returns bigint language plpgsql as $$
declare n bigint;
begin execute 'select count(*) from (' || q || ') s' into n; return n; end $$;
create function t.expect(actual bigint, expected bigint, why text) returns void language plpgsql as $$
begin
  if actual is distinct from expected then
    raise exception 'FALLO: % (esperado %, obtenido %)', why, expected, actual;
  end if;
end $$;
grant execute on all functions in schema t to authenticated, anon;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'owner@example.test'),
  ('00000000-0000-0000-0000-00000000000f', 'family@example.test'),
  ('00000000-0000-0000-0000-00000000000e', 'family2@example.test'),
  ('00000000-0000-0000-0000-0000000000ff', 'x') on conflict do nothing;

-- ── Preparación: A crea dos perfiles ──
do $$ declare mom uuid := '10000000-0000-0000-0000-000000000001'; me uuid := '10000000-0000-0000-0000-000000000002';
begin
  perform t.as_user('00000000-0000-0000-0000-00000000000a');
  insert into public.profiles (id, owner_id, display_name) values (mom, auth.uid(), 'Mamá (ficticio)'), (me, auth.uid(), 'Yo (ficticio)');
  insert into public.records (id, profile_id, entity, data) values
    ('20000000-0000-0000-0000-000000000001', mom, 'episode', '{"kind":"Cefalea ficticia"}'),
    ('20000000-0000-0000-0000-000000000002', me, 'episode', '{"kind":"DEL-OTRO-PERFIL"}');
  perform t.expect(t.count('select 1 from public.profile_members'), 2, 'el propietario es administrador de sus 2 perfiles');
end $$;

-- ── Sin permiso: ningún acceso ──
do $$ declare mom uuid := '10000000-0000-0000-0000-000000000001'; begin
  perform t.as_user('00000000-0000-0000-0000-00000000000f');
  perform t.expect(t.count('select 1 from public.profiles'), 0, 'F no ve perfiles');
  perform t.expect(t.count('select 1 from public.records'), 0, 'F no ve registros');
  perform t.expect(t.count('select 1 from public.profile_members'), 0, 'F no ve miembros');
  perform t.expect_fail(format($q$insert into public.records (id, profile_id, entity, data) values (gen_random_uuid(), %L, 'note', '{}')$q$, mom), 'F inserta sin permiso');
  perform t.expect(t.rows(format($q$update public.records set data = '{"x":1}' where profile_id = %L$q$, mom)), 0, 'F actualiza sin permiso');
  perform t.expect(t.rows(format($q$delete from public.records where profile_id = %L$q$, mom)), 0, 'F borra sin permiso');
  perform t.expect_fail(format($q$insert into public.profile_members (profile_id, user_id, level) values (%L, auth.uid(), 'admin')$q$, mom), 'F se auto-concede admin');
end $$;

-- ── Lectura ──
do $$ declare mom uuid := '10000000-0000-0000-0000-000000000001'; begin
  perform t.as_user('00000000-0000-0000-0000-00000000000a');
  insert into public.profile_members (profile_id, user_id, level) values (mom, '00000000-0000-0000-0000-00000000000f', 'read');
  perform t.as_user('00000000-0000-0000-0000-00000000000f');
  perform t.expect(t.count('select 1 from public.records'), 1, 'F lee solo el perfil de Mamá');
  perform t.expect(t.count($q$select 1 from public.records where data->>'kind' = 'DEL-OTRO-PERFIL'$q$), 0, 'F no lee el otro perfil');
  perform t.expect_fail(format($q$insert into public.records (id, profile_id, entity, data) values (gen_random_uuid(), %L, 'note', '{}')$q$, mom), 'solo lectura no escribe');
  perform t.expect(t.rows(format($q$update public.records set data = '{"x":1}' where profile_id = %L$q$, mom)), 0, 'solo lectura no actualiza');
  perform t.expect(t.count('select 1 from public.profile_members'), 1, 'F solo ve su propia membresía');
  perform t.expect(t.rows(format($q$update public.profile_members set level = 'admin' where profile_id = %L and user_id = auth.uid()$q$, mom)), 0, 'F (lectura) no se sube a admin');
end $$;

-- ── Escritura ──
do $$ declare mom uuid := '10000000-0000-0000-0000-000000000001'; me uuid := '10000000-0000-0000-0000-000000000002'; begin
  perform t.as_user('00000000-0000-0000-0000-00000000000a');
  update public.profile_members set level = 'write' where profile_id = mom and user_id = '00000000-0000-0000-0000-00000000000f';
  perform t.as_user('00000000-0000-0000-0000-00000000000f');
  insert into public.records (id, profile_id, entity, data, created_by, updated_by)
    values ('20000000-0000-0000-0000-000000000003', mom, 'note', '{"body":"del familiar"}', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a');
  perform t.expect(t.count($q$select 1 from public.records where id = '20000000-0000-0000-0000-000000000003' and created_by = auth.uid() and updated_by = auth.uid()$q$), 1, 'la autoría no se puede falsificar');
  perform t.expect(t.rows(format($q$update public.records set data = '{"body":"editada"}' where id = '20000000-0000-0000-0000-000000000003'$q$)), 1, 'F con escritura actualiza');
  perform t.expect_fail(format($q$update public.records set profile_id = %L where id = '20000000-0000-0000-0000-000000000003'$q$, me), 'mover un registro a otro perfil');
  perform t.expect_fail(format($q$insert into public.records (id, profile_id, entity, data) values (gen_random_uuid(), %L, 'note', '{}')$q$, me), 'escribir en perfil sin permiso');
  perform t.expect_fail($q$insert into public.records (id, profile_id, entity, data) values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'note', '{}') on conflict (id) do update set data = excluded.data$q$, 'upsert sobre id de otro perfil');
  perform t.expect_fail(format($q$insert into public.records (id, profile_id, entity, data) values (gen_random_uuid(), %L, 'malware', '{}')$q$, mom), 'entidad no permitida');
  perform t.expect(t.rows(format($q$delete from public.records where profile_id = %L$q$, mom)), 0, 'escritura sin admin no borra definitivamente');
  perform t.expect_fail(format($q$insert into public.profile_members (profile_id, user_id, level) values (%L, '00000000-0000-0000-0000-0000000000ff', 'read')$q$, mom), 'F (write) no concede accesos');
end $$;

-- ── Versionado monotónico (sincronización incremental) ──
do $$ declare v1 bigint; v2 bigint; begin
  perform t.as_user('00000000-0000-0000-0000-00000000000a');
  select version into v1 from public.records where id = '20000000-0000-0000-0000-000000000001';
  update public.records set data = '{"kind":"Cefalea ficticia","n":2}' where id = '20000000-0000-0000-0000-000000000001';
  select version into v2 from public.records where id = '20000000-0000-0000-0000-000000000001';
  if v2 <= v1 then raise exception 'la versión no avanza'; end if;
end $$;

-- ── Revocación inmediata ──
do $$ declare mom uuid := '10000000-0000-0000-0000-000000000001'; begin
  perform t.as_user('00000000-0000-0000-0000-00000000000a');
  update public.profile_members set revoked_at = now() where profile_id = mom and user_id = '00000000-0000-0000-0000-00000000000f';
  perform t.as_user('00000000-0000-0000-0000-00000000000f');
  perform t.expect(t.count('select 1 from public.records'), 0, 'tras revocar, F no lee');
  perform t.expect(t.count('select 1 from public.profiles'), 0, 'tras revocar, F no ve el perfil');
  perform t.expect_fail(format($q$insert into public.records (id, profile_id, entity, data) values (gen_random_uuid(), %L, 'note', '{}')$q$, mom), 'tras revocar, F no escribe');
end $$;

-- ── El propietario no puede ser degradado ni expulsado ──
do $$ declare mom uuid := '10000000-0000-0000-0000-000000000001'; begin
  perform t.as_user('00000000-0000-0000-0000-00000000000a');
  insert into public.profile_members (profile_id, user_id, level) values (mom, '00000000-0000-0000-0000-00000000000e', 'admin');
  perform t.as_user('00000000-0000-0000-0000-00000000000e');
  perform t.expect_fail(format($q$update public.profile_members set revoked_at = now() where profile_id = %L and user_id = '00000000-0000-0000-0000-00000000000a'$q$, mom), 'admin revoca al propietario');
  perform t.expect_fail(format($q$update public.profile_members set level = 'read' where profile_id = %L and user_id = '00000000-0000-0000-0000-00000000000a'$q$, mom), 'admin degrada al propietario');
  perform t.expect_fail(format($q$delete from public.profile_members where profile_id = %L and user_id = '00000000-0000-0000-0000-00000000000a'$q$, mom), 'admin expulsa al propietario');
  perform t.expect(t.rows(format($q$delete from public.profiles where id = %L$q$, mom)), 0, 'un admin que no es el propietario no elimina el perfil');
end $$;

-- ── Usuario ajeno y anónimo ──
do $$ declare mom uuid := '10000000-0000-0000-0000-000000000001'; begin
  perform t.as_user('00000000-0000-0000-0000-0000000000ff');
  perform t.expect(t.count('select 1 from public.records'), 0, 'ajeno no lee');
  perform t.expect_fail(format($q$insert into public.records (id, profile_id, entity, data) values (gen_random_uuid(), %L, 'note', '{}')$q$, mom), 'ajeno escribe');
  perform t.expect_fail($q$insert into public.profiles (id, owner_id, display_name) values (gen_random_uuid(), '00000000-0000-0000-0000-00000000000a', 'suplantado')$q$, 'crear perfil a nombre de otro');
  perform t.as_anon();
  perform t.expect_fail('select 1 from public.records', 'anon lee registros');
  perform t.expect_fail('select 1 from public.profiles', 'anon lee perfiles');
  perform t.expect_fail('select 1 from public.profile_members', 'anon lee miembros');
end $$;

-- ── Archivos privados ──
do $$ declare mom uuid := '10000000-0000-0000-0000-000000000001'; me uuid := '10000000-0000-0000-0000-000000000002'; begin
  perform t.as_user('00000000-0000-0000-0000-00000000000a');
  insert into storage.objects (bucket_id, name) values ('documents', mom || '/informe.pdf'), ('documents', me || '/privado.pdf');
  if (select public from storage.buckets where id = 'documents') then raise exception 'el bucket no debe ser público'; end if;
  perform t.as_user('00000000-0000-0000-0000-00000000000e');   -- admin de Mamá
  perform t.expect(t.count('select 1 from storage.objects'), 1, 'admin de Mamá ve solo archivos de Mamá');
  perform t.expect_fail(format($q$insert into storage.objects (bucket_id, name) values ('documents', %L)$q$, me || '/x.pdf'), 'subir archivo al perfil ajeno');
  perform t.expect_fail($q$insert into storage.objects (bucket_id, name) values ('documents', 'sin-carpeta.pdf')$q$, 'ruta sin carpeta de perfil');
  perform t.expect_fail(format($q$insert into storage.objects (bucket_id, name) values ('documents', %L)$q$, mom || '/../' || me || '/x.pdf'), 'traversal');
  perform t.as_user('00000000-0000-0000-0000-0000000000ff');
  perform t.expect(t.count('select 1 from storage.objects'), 0, 'ajeno no ve archivos');
end $$;

\echo RLS: TODAS LAS PRUEBAS SUPERADAS
