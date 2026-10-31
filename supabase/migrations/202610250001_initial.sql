-- Run once in a new Supabase project. Add the owner's Auth user ID to
-- private.app_owner separately, following README. No public signup is required.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.app_owner (
  user_id uuid primary key references auth.users(id) on delete cascade,
  singleton boolean not null default true unique check (singleton)
);
alter table private.app_owner enable row level security;

create function public.is_app_owner() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from private.app_owner where user_id = (select auth.uid())); $$;
revoke all on function public.is_app_owner() from public, anon;
grant execute on function public.is_app_owner() to authenticated;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  unique(id, owner_id)
);
create unique index categories_owner_name on public.categories(owner_id, lower(btrim(name)));

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid,
  title text not null check (length(btrim(title)) between 1 and 300),
  planned_date date,
  due_date date,
  completed_at timestamptz,
  pinned boolean not null default false,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(category_id, owner_id) references public.categories(id, owner_id)
);
create index tasks_owner on public.tasks(owner_id);
create index tasks_category on public.tasks(category_id);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid,
  title text not null check (length(btrim(title)) between 1 and 300),
  body jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb
    check (jsonb_typeof(body) = 'object' and body->>'type' = 'doc'),
  archived_at timestamptz,
  pinned boolean not null default false,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(category_id, owner_id) references public.categories(id, owner_id)
);
create index notes_owner on public.notes(owner_id);
create index notes_category on public.notes(category_id);

create function private.advance_version() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.id <> old.id or new.owner_id <> old.owner_id then
    raise exception 'Identity and owner cannot be changed';
  end if;
  new.version := old.version + 1;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;
create trigger tasks_version before update on public.tasks for each row execute function private.advance_version();
create trigger notes_version before update on public.notes for each row execute function private.advance_version();

alter table public.categories enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
revoke all on public.categories, public.tasks, public.notes from public, anon, authenticated;
grant select, insert, update, delete on public.categories, public.tasks, public.notes to authenticated;

create policy categories_owner on public.categories to authenticated
  using ((select public.is_app_owner()) and owner_id = (select auth.uid()))
  with check ((select public.is_app_owner()) and owner_id = (select auth.uid()));
create policy tasks_owner on public.tasks to authenticated
  using ((select public.is_app_owner()) and owner_id = (select auth.uid()))
  with check ((select public.is_app_owner()) and owner_id = (select auth.uid()));
create policy notes_owner on public.notes to authenticated
  using ((select public.is_app_owner()) and owner_id = (select auth.uid()))
  with check ((select public.is_app_owner()) and owner_id = (select auth.uid()));

create function public.delete_category(target_id uuid) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not public.is_app_owner() then raise exception 'Access denied'; end if;
  perform 1 from public.categories where id = target_id and owner_id = (select auth.uid()) for update;
  if not found then raise exception 'Category not found'; end if;
  update public.tasks set category_id = null where category_id = target_id and owner_id = (select auth.uid());
  update public.notes set category_id = null where category_id = target_id and owner_id = (select auth.uid());
  delete from public.categories where id = target_id and owner_id = (select auth.uid());
end;
$$;
revoke all on function public.delete_category(uuid) from public, anon;
grant execute on function public.delete_category(uuid) to authenticated;

commit;
