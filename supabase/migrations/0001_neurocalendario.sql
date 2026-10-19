-- NeuroCalendario — esquema de sincronización opcional (Supabase / PostgreSQL)
-- Todas las tablas con datos de salud tienen RLS activado y FORZADO.
-- El cliente móvil solo usa la clave anónima (anon) + sesión de usuario; NUNCA la service_role.
-- NOTA: los datos NO están cifrados de extremo a extremo; el proveedor de la base de datos puede leerlos.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- ───────────── Perfiles y miembros ─────────────
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id),
  display_name text not null check (char_length(display_name) between 1 and 80),
  relationship text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_members (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  level text not null check (level in ('read', 'write', 'admin')),
  revoked_at timestamptz,
  granted_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  primary key (profile_id, user_id)
);
create index on public.profile_members (user_id) where revoked_at is null;

-- Registros clínicos genéricos (un renglón por entidad de la app).
create table public.records (
  id uuid primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  entity text not null check (entity in
    ('episode','medication','schedule','intake','appointment','exam','document','note')),
  data jsonb not null,
  deleted boolean not null default false,
  version bigint not null default 0,
  created_by uuid not null default auth.uid(),
  updated_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.records (profile_id, version);

create sequence public.records_version_seq;

-- ───────────── Funciones de autorización ─────────────
create or replace function private.level_rank(l text) returns int
language sql immutable set search_path = '' as $$
  select case l when 'read' then 1 when 'write' then 2 when 'admin' then 3 else 0 end
$$;

create or replace function private.has_level(p_profile uuid, p_needed text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profile_members m
    where m.profile_id = p_profile
      and m.user_id = (select auth.uid())
      and m.revoked_at is null
      and private.level_rank(m.level) >= private.level_rank(p_needed)
  )
$$;
revoke all on function private.has_level(uuid, text) from public;
grant execute on function private.has_level(uuid, text) to authenticated;
grant execute on function private.level_rank(text) to authenticated;

-- ───────────── Disparadores de integridad ─────────────
create or replace function private.records_guard() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
  else
    -- no se puede mover un registro a otro perfil ni cambiar su entidad/autor original
    if new.profile_id <> old.profile_id or new.entity <> old.entity or new.created_by <> old.created_by then
      raise exception 'campos inmutables' using errcode = '42501';
    end if;
  end if;
  new.updated_by := (select auth.uid());
  new.updated_at := now();
  new.version := nextval('public.records_version_seq');
  return new;
end $$;
create trigger records_guard before insert or update on public.records
  for each row execute function private.records_guard();

create or replace function private.profile_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profile_members (profile_id, user_id, level, granted_by)
  values (new.id, new.owner_id, 'admin', new.owner_id);
  return new;
end $$;
create trigger profile_after_insert after insert on public.profiles
  for each row execute function private.profile_after_insert();

create or replace function private.members_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare owner uuid;
begin
  select owner_id into owner from public.profiles where id = coalesce(new.profile_id, old.profile_id);
  if tg_op = 'DELETE' then
    if old.user_id = owner then raise exception 'no se puede quitar al propietario' using errcode = '42501'; end if;
    return old;
  end if;
  if tg_op = 'UPDATE' and (new.profile_id <> old.profile_id or new.user_id <> old.user_id) then
    raise exception 'campos inmutables' using errcode = '42501';
  end if;
  if new.user_id = owner and (new.level <> 'admin' or new.revoked_at is not null) then
    raise exception 'el propietario conserva el acceso de administrador' using errcode = '42501';
  end if;
  new.granted_by := (select auth.uid());
  return new;
end $$;
create trigger members_guard before insert or update or delete on public.profile_members
  for each row execute function private.members_guard();

-- ───────────── RLS ─────────────
alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.profile_members enable row level security;
alter table public.profile_members force row level security;
alter table public.records enable row level security;
alter table public.records force row level security;

create policy profiles_select on public.profiles for select to authenticated
  using (private.has_level(id, 'read'));
create policy profiles_insert on public.profiles for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated
  using (private.has_level(id, 'admin')) with check (private.has_level(id, 'admin') and owner_id = (select auth.uid()));
create policy profiles_delete on public.profiles for delete to authenticated
  using (private.has_level(id, 'admin') and owner_id = (select auth.uid()));

create policy members_select on public.profile_members for select to authenticated
  using (user_id = (select auth.uid()) or private.has_level(profile_id, 'admin'));
create policy members_insert on public.profile_members for insert to authenticated
  with check (private.has_level(profile_id, 'admin'));
create policy members_update on public.profile_members for update to authenticated
  using (private.has_level(profile_id, 'admin')) with check (private.has_level(profile_id, 'admin'));
create policy members_delete on public.profile_members for delete to authenticated
  using (private.has_level(profile_id, 'admin'));

create policy records_select on public.records for select to authenticated
  using (private.has_level(profile_id, 'read'));
create policy records_insert on public.records for insert to authenticated
  with check (private.has_level(profile_id, 'write'));
create policy records_update on public.records for update to authenticated
  using (private.has_level(profile_id, 'write')) with check (private.has_level(profile_id, 'write'));
create policy records_delete on public.records for delete to authenticated
  using (private.has_level(profile_id, 'admin'));

revoke all on public.profiles, public.profile_members, public.records from anon, public;
grant select, insert, update, delete on public.profiles, public.profile_members, public.records to authenticated;
grant usage on sequence public.records_version_seq to authenticated;

-- ───────────── Almacenamiento privado de archivos ─────────────
-- Bucket privado «documents»; ruta: <profile_id>/<archivo>. Sin enlaces públicos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 15728640, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Ruta estricta <uuid-del-perfil>/<nombre>.<pdf|jpg|png>: sin subcarpetas, «..» ni caracteres raros.
create or replace function private.valid_doc_path(p_name text) returns boolean
language sql immutable set search_path = '' as $$
  select p_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9_-]{1,80}\.(pdf|jpg|png)$'
$$;
grant execute on function private.valid_doc_path(text) to authenticated;

create policy documents_select on storage.objects for select to authenticated
  using (bucket_id = 'documents' and private.has_level(((storage.foldername(name))[1])::uuid, 'read'));
create policy documents_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and private.valid_doc_path(name) and private.has_level(((storage.foldername(name))[1])::uuid, 'write'));
create policy documents_update on storage.objects for update to authenticated
  using (bucket_id = 'documents' and private.has_level(((storage.foldername(name))[1])::uuid, 'write'))
  with check (bucket_id = 'documents' and private.valid_doc_path(name) and private.has_level(((storage.foldername(name))[1])::uuid, 'write'));
create policy documents_delete on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and private.has_level(((storage.foldername(name))[1])::uuid, 'write'));
