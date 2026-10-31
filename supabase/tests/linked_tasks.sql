-- Synthetic content only, all changes rolled back. Apply all migrations first.
begin;
do $$ begin
  if has_function_privilege('anon', 'public.create_linked_task(uuid, integer, jsonb, integer[], uuid)', 'EXECUTE')
    or has_schema_privilege('authenticated', 'private', 'USAGE') then raise exception 'Graph helpers or RPC exposed'; end if;
end $$;
select set_config('request.jwt.claim.sub', (select user_id::text from private.app_owner), true);
set local role authenticated;
do $$
declare
  source_id uuid := gen_random_uuid(); target_id uuid := gen_random_uuid(); second_id uuid := gen_random_uuid();
  category uuid := gen_random_uuid(); original_version integer; test_body jsonb; draft jsonb; affected integer;
begin
  insert into public.categories(id, owner_id, name) values(category, auth.uid(), 'links-test-' || category::text);
  test_body := '{"type":"doc","content":[{"type":"taskList","content":[{"type":"taskItem","attrs":{"checked":false},"content":[{"type":"paragraph","content":[{"type":"text","text":"Temporary linked step"}]}]}]}]}'::jsonb;
  insert into public.notes(id, owner_id, category_id, kind, title, body) values(source_id, auth.uid(), category, 'plan', 'Temporary source', test_body);
  draft := jsonb_build_object('title', 'Temporary source', 'kind', 'plan', 'categoryId', category, 'body', test_body, 'pinned', true, 'archivedAt', null);
  perform public.create_linked_task(source_id, 1, draft, array[0,0], target_id);
  if not exists(select 1 from public.tasks where id = target_id and title = 'Temporary linked step' and category_id = category)
    or not exists(select 1 from public.notes where id = source_id and version = 2 and body #>> '{content,0,content,0,attrs,taskId}' = target_id::text) then raise exception 'Atomic link failed'; end if;
  begin
    perform public.create_linked_task(source_id, 1, draft, array[0,0], second_id);
    raise exception 'Stale source accepted';
  exception when serialization_failure then null; end;
  if exists(select 1 from public.tasks where id = second_id) then raise exception 'Duplicate task inserted'; end if;
  update public.tasks set completed_at = now() where id = target_id and version = 1;
  if not exists(select 1 from public.notes where id = source_id and version = 3 and body #>> '{content,0,content,0,attrs,checked}' = 'true') then raise exception 'Task did not complete source'; end if;
  update public.notes set body = jsonb_set(body, '{content,0,content,0,attrs,checked}', 'false') where id = source_id and version = 3;
  if not exists(select 1 from public.tasks where id = target_id and completed_at is null and version = 3) then raise exception 'Source did not reopen task'; end if;
  update public.notes set title = 'Stale write' where id = source_id and version = 3;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Stale source write accepted'; end if;
  -- Duplicated references (including copied source rows) must be rejected.
  begin
    insert into public.notes(owner_id, title, body) select auth.uid(), 'Invalid duplicate', body from public.notes where id = source_id;
    raise exception 'Duplicate link accepted';
  exception when raise_exception then if sqlerrm = 'Duplicate link accepted' then raise; end if; end;
  -- Missing target must be rejected atomically.
  begin
    update public.notes set body = jsonb_set(body, '{content,0,content,0,attrs,taskId}', to_jsonb(second_id::text)) where id = source_id;
    raise exception 'Orphan accepted';
  exception when raise_exception then if sqlerrm = 'Orphan accepted' then raise; end if; end;
  if upper(target_id::text) <> target_id::text then
    begin
      update public.notes set body = jsonb_set(body, '{content,0,content,0,attrs,taskId}', to_jsonb(upper(target_id::text))) where id = source_id;
      raise exception 'Noncanonical link accepted';
    exception when raise_exception then if sqlerrm = 'Noncanonical link accepted' then raise; end if; end;
  end if;
  perform public.delete_category(category);
  if not exists(select 1 from public.notes where id = source_id and category_id is null)
    or not exists(select 1 from public.tasks where id = target_id and category_id is null) then raise exception 'Category preservation failed'; end if;
  update public.tasks set completed_at = now(), title = 'Independent task title' where id = target_id;
  if not exists(select 1 from public.notes where id = source_id and body #>> '{content,0,content,0,content,0,content,0,text}' = 'Temporary linked step') then raise exception 'Task title changed source text'; end if;
  delete from public.tasks where id = target_id;
  if not exists(select 1 from public.notes where id = source_id and body #>> '{content,0,content,0,attrs,taskId}' is null
    and body #>> '{content,0,content,0,attrs,checked}' = 'true') then raise exception 'Task deletion lost local state'; end if;
  select version, n.body into original_version, test_body from public.notes n where id = source_id;
  draft := draft || jsonb_build_object('categoryId', null, 'body', test_body);
  perform public.create_linked_task(source_id, original_version, draft, array[0,0], second_id);
  update public.notes set body = '{"type":"doc","content":[{"type":"paragraph"}]}' where id = source_id;
  if not exists(select 1 from public.tasks where id = second_id and completed_at is not null) then raise exception 'Removing source deleted task'; end if;
  -- Reattach, then delete the whole source: task stays independent.
  select version into original_version from public.notes where id = source_id;
  test_body := jsonb_set(test_body, '{content,0,content,0,attrs,taskId}', to_jsonb(second_id::text));
  update public.notes set body = test_body where id = source_id;
  delete from public.notes where id = source_id;
  if not exists(select 1 from public.tasks where id = second_id) then raise exception 'Source deletion deleted task'; end if;
end $$;
select set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
do $$ begin
  begin
    perform public.create_linked_task(gen_random_uuid(), 1, '{}'::jsonb, array[0,0], gen_random_uuid());
    raise exception 'Non-owner RPC accepted';
  exception when raise_exception then if sqlerrm <> 'Access denied' then raise; end if; end;
end $$;
rollback;
select 'PASS: atomic links, two-way completion, versions, duplicates, category and source/task deletion; rolled back' as result;
