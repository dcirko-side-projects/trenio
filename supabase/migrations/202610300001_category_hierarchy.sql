-- Additive migration. Existing IDs, names and content references are preserved.
begin;
alter table public.categories
  add column parent_id uuid,
  add column icon text not null default 'folder',
  add column color text not null default '#B4D6D3',
  add column sort_order integer not null default 0 check (sort_order >= 0),
  add column version integer not null default 1 check (version > 0),
  add column updated_at timestamptz not null default now(),
  add constraint categories_parent foreign key (parent_id, owner_id) references public.categories(id, owner_id),
  add constraint categories_not_self check (parent_id is distinct from id),
  add constraint categories_icon check (icon in ('folder','briefcase','graduation-cap','house','wallet','lightbulb','code','heart','book-open','target','plane','music','calendar','shopping-bag','dumbbell','coffee')),
  add constraint categories_color check (color in ('#B4D6D3','#8FFFE0','#A8C9F5','#EDCF97','#D5BBE9','#F0B8B1'));

-- Establish a deterministic initial order without changing existing content.
with ordered as (select id, (row_number() over (partition by owner_id order by created_at, id) - 1)::integer as position from public.categories)
update public.categories c set sort_order = ordered.position from ordered where ordered.id = c.id;
drop index public.categories_owner_name;
create unique index categories_root_name on public.categories(owner_id, lower(btrim(name))) where parent_id is null;
create unique index categories_child_name on public.categories(owner_id, parent_id, lower(btrim(name))) where parent_id is not null;
create index categories_parent_order on public.categories(owner_id, parent_id, sort_order);

-- Share the existing graph lock so deletion and all category/content writes
-- acquire locks in the same order, including writes from older clients.
create trigger categories_graph_lock before insert or update or delete on public.categories for each statement execute function private.lock_task_graph();
create trigger categories_version before update on public.categories for each row execute function private.advance_version();
create function private.check_category_depth() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.parent_id is not null and (
    exists(select 1 from public.categories where id = new.parent_id and parent_id is not null)
    or exists(select 1 from public.categories where parent_id = new.id)
  ) then raise exception 'Only two category levels are allowed'; end if;
  return new;
end $$;
create trigger categories_depth before insert or update on public.categories for each row execute function private.check_category_depth();

create function public.save_category(target_id uuid, category_name text, parent uuid, category_icon text, category_color text, expected_version integer, target_position integer) returns void
language plpgsql security invoker set search_path = '' as $$
declare current_version integer; item uuid; position integer := 0; placed boolean := false;
begin
  if not public.is_app_owner() then raise exception 'Access denied'; end if;
  perform pg_advisory_xact_lock(742391028);
  select version into current_version from public.categories where id = target_id and owner_id = (select auth.uid()) for update;
  if (current_version is null and expected_version <> 0) or (current_version is not null and current_version <> expected_version) then
    raise exception 'Category changed' using errcode = '40001';
  end if;
  if target_position < 0 then raise exception 'Invalid position'; end if;
  if current_version is null then
    insert into public.categories(id, owner_id, name, parent_id, icon, color) values (target_id, (select auth.uid()), btrim(category_name), parent, category_icon, category_color);
  else
    update public.categories set name = btrim(category_name), parent_id = parent, icon = category_icon, color = category_color where id = target_id and owner_id = (select auth.uid());
  end if;
  for item in select id from public.categories where owner_id = (select auth.uid()) and parent_id is not distinct from parent and id <> target_id order by sort_order, name, id loop
    if position = target_position then
      update public.categories set sort_order = position where id = target_id and sort_order <> position;
      placed := true; position := position + 1;
    end if;
    update public.categories set sort_order = position where id = item and sort_order <> position;
    position := position + 1;
  end loop;
  if not placed then update public.categories set sort_order = position where id = target_id and sort_order <> position; end if;
end $$;
revoke all on function public.save_category(uuid,text,uuid,text,text,integer,integer) from public, anon;
grant execute on function public.save_category(uuid,text,uuid,text,text,integer,integer) to authenticated;

create or replace function public.delete_category(target_id uuid) returns void
language plpgsql security invoker set search_path = '' as $$
declare child record; promoted_name text; suffix integer;
begin
  if not public.is_app_owner() then raise exception 'Access denied'; end if;
  perform pg_advisory_xact_lock(742391028);
  perform 1 from public.categories where id = target_id and owner_id = (select auth.uid()) for update;
  if not found then raise exception 'Category not found'; end if;
  -- Promote children, preserving their content. Resolve a root name collision
  -- with a short stable ID suffix rather than deleting or merging anything.
  for child in select id, name from public.categories where parent_id = target_id and owner_id = (select auth.uid()) order by sort_order, id loop
    promoted_name := child.name; suffix := 0;
    while exists(select 1 from public.categories c where c.owner_id = (select auth.uid()) and c.parent_id is null and lower(btrim(c.name)) = lower(btrim(promoted_name))) loop
      suffix := suffix + 1;
      promoted_name := left(child.name, 60) || ' · ' || left(child.id::text, 8) || case when suffix > 1 then '-' || suffix::text else '' end;
    end loop;
    update public.categories set parent_id = null, name = promoted_name,
      sort_order = (select coalesce(max(sort_order), -1) + 1 from public.categories c where c.owner_id = (select auth.uid()) and c.parent_id is null)
    where id = child.id;
  end loop;
  update public.tasks set category_id = null where category_id = target_id and owner_id = (select auth.uid());
  update public.notes set category_id = null where category_id = target_id and owner_id = (select auth.uid());
  delete from public.categories where id = target_id and owner_id = (select auth.uid());
end $$;
commit;
