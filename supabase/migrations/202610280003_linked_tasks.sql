-- Apply once after ideas. No existing content is changed.
begin;

create function private.checklist_nodes(document jsonb) returns setof jsonb
language sql immutable set search_path = '' as $$
  with recursive nodes(node) as (
    select document union all
    select child from nodes cross join lateral jsonb_array_elements(coalesce(node->'content', '[]'::jsonb)) child
  ) select node from nodes where node->>'type' = 'taskItem';
$$;

create function private.node_text(document jsonb) returns text
language sql immutable set search_path = '' as $$
  with recursive nodes(node, path) as (
    select document, array[]::bigint[] union all
    select child, path || ordinal from nodes cross join lateral jsonb_array_elements(coalesce(node->'content', '[]'::jsonb)) with ordinality children(child, ordinal)
  ) select coalesce(string_agg(node->>'text', ' ' order by path), '') from nodes where node->>'type' = 'text';
$$;

create function private.patch_task_link(document jsonb, target uuid, checked boolean, detach boolean) returns jsonb
language plpgsql immutable set search_path = '' as $$
declare result jsonb := document; children jsonb;
begin
  if document->>'type' = 'taskItem' and document->'attrs'->>'taskId' = target::text then
    result := jsonb_set(result, '{attrs}', case when detach then (document->'attrs') - 'taskId'
      else (document->'attrs') || jsonb_build_object('checked', checked) end);
  end if;
  if document ? 'content' then
    select coalesce(jsonb_agg(private.patch_task_link(child, target, checked, detach) order by ordinal), '[]'::jsonb)
      into children from jsonb_array_elements(document->'content') with ordinality entries(child, ordinal);
    result := jsonb_set(result, '{content}', children);
  end if;
  return result;
end $$;

-- All graph writes take the same transaction lock before row locks. This also
-- serializes legacy direct writes with the new RPC, preventing duplicate links.
create function private.lock_task_graph() returns trigger
language plpgsql security definer set search_path = '' as $$
begin perform pg_advisory_xact_lock(742391028); return null; end $$;
create trigger notes_graph_lock before insert or update or delete on public.notes for each statement execute function private.lock_task_graph();
create trigger tasks_graph_lock before insert or update or delete on public.tasks for each statement execute function private.lock_task_graph();

create function private.validate_task_links() returns trigger
language plpgsql security definer set search_path = '' as $$
declare step jsonb; target uuid;
begin
  if exists(select 1 from private.checklist_nodes(new.body) node where node->'attrs'->>'taskId' is not null
    group by node->'attrs'->>'taskId' having count(*) > 1) then raise exception 'Duplicate task link'; end if;
  for step in select * from private.checklist_nodes(new.body) loop
    if step->'attrs'->>'taskId' is null then continue; end if;
    target := (step->'attrs'->>'taskId')::uuid;
    if jsonb_typeof(step->'attrs'->'checked') is distinct from 'boolean'
      or not exists(select 1 from public.tasks where id = target and owner_id = new.owner_id) then
      raise exception 'Invalid or foreign task link';
    end if;
    if exists(select 1 from public.notes n cross join lateral private.checklist_nodes(n.body) node
      where n.id <> new.id and node->'attrs'->>'taskId' = target::text) then raise exception 'Task already linked'; end if;
  end loop;
  return new;
end $$;
create trigger notes_validate_links before insert or update of body on public.notes for each row execute function private.validate_task_links();

create function private.note_to_tasks() returns trigger
language plpgsql security definer set search_path = '' as $$
declare step jsonb;
begin
  for step in select * from private.checklist_nodes(new.body) loop
    if step->'attrs'->>'taskId' is null then continue; end if;
    update public.tasks set completed_at = case when (step->'attrs'->>'checked')::boolean then now() else null end
      where id = (step->'attrs'->>'taskId')::uuid and owner_id = new.owner_id
      and (completed_at is not null) is distinct from (step->'attrs'->>'checked')::boolean;
  end loop;
  return null;
end $$;
create trigger notes_sync_tasks after insert or update of body on public.notes for each row execute function private.note_to_tasks();

create function private.task_to_notes() returns trigger
language plpgsql security definer set search_path = '' as $$
declare target uuid; owner uuid; checked boolean; detach boolean;
begin
  detach := tg_op = 'DELETE';
  if detach then target := old.id; owner := old.owner_id; checked := old.completed_at is not null;
  else
    if new.completed_at is not distinct from old.completed_at then return null; end if;
    target := new.id; owner := new.owner_id; checked := new.completed_at is not null;
  end if;
  update public.notes n set body = private.patch_task_link(n.body, target, checked, detach)
    where n.owner_id = owner and n.body is distinct from private.patch_task_link(n.body, target, checked, detach);
  if detach then return old; end if;
  return null;
end $$;
create trigger tasks_sync_notes after update of completed_at on public.tasks for each row execute function private.task_to_notes();
create trigger tasks_unlink_notes before delete on public.tasks for each row execute function private.task_to_notes();

create function public.create_linked_task(note_id uuid, expected_version integer, draft jsonb, item_path integer[], task_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare source public.notes; draft_body jsonb; step jsonb; path text[] := array[]::text[]; part integer; title text;
begin
  if not public.is_app_owner() then raise exception 'Access denied'; end if;
  perform pg_advisory_xact_lock(742391028);
  select * into source from public.notes where id = note_id and owner_id = auth.uid() for update;
  if not found or source.version <> expected_version then raise exception 'Stale source version' using errcode = '40001'; end if;
  if coalesce(array_length(item_path, 1), 0) not between 1 and 64 then raise exception 'Invalid source path'; end if;
  foreach part in array item_path loop
    if part < 0 then raise exception 'Invalid source path'; end if;
    path := path || array['content', part::text];
  end loop;
  draft_body := draft->'body'; step := draft_body #> path;
  if step is null or step->>'type' <> 'taskItem' or step->'attrs'->>'taskId' is not null then raise exception 'Source is not an unlinked checkbox'; end if;
  title := left(btrim(private.node_text(step)), 300);
  if title = '' then raise exception 'Checkbox title is required'; end if;
  insert into public.tasks(id, owner_id, category_id, title, completed_at)
    values(task_id, auth.uid(), (draft->>'categoryId')::uuid, title, case when coalesce((step->'attrs'->>'checked')::boolean, false) then now() else null end);
  step := jsonb_set(step, '{attrs}', coalesce(step->'attrs', '{}'::jsonb) || jsonb_build_object('taskId', task_id, 'checked', coalesce((step->'attrs'->>'checked')::boolean, false)));
  update public.notes set title = btrim(draft->>'title'), kind = draft->>'kind', category_id = (draft->>'categoryId')::uuid,
    pinned = (draft->>'pinned')::boolean, archived_at = (draft->>'archivedAt')::timestamptz, body = jsonb_set(draft_body, path, step)
    where id = source.id;
  return task_id;
end $$;
revoke all on function public.create_linked_task(uuid, integer, jsonb, integer[], uuid) from public, anon;
grant execute on function public.create_linked_task(uuid, integer, jsonb, integer[], uuid) to authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
commit;
