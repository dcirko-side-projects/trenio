-- Synthetic data; works after configuring the owner. All writes are rolled back.
begin;
select set_config('request.jwt.claim.sub', (select user_id::text from private.app_owner), true);
do $$ begin
  if has_function_privilege('anon','public.save_category(uuid,text,uuid,text,text,integer,integer)','EXECUTE') then raise exception 'Anonymous RPC access'; end if;
end $$;
set local role authenticated;
do $$
declare
  root uuid := gen_random_uuid(); child uuid := gen_random_uuid(); other uuid := gen_random_uuid(); third uuid := gen_random_uuid();
  second_child uuid := gen_random_uuid(); same_name uuid := gen_random_uuid(); task uuid := gen_random_uuid(); note uuid := gen_random_uuid(); v integer;
begin
  perform public.save_category(root, 'Hierarchy root ' || root, null, 'briefcase', '#A8C9F5', 0, 0);
  perform public.save_category(other, 'Hierarchy other ' || other, null, 'folder', '#B4D6D3', 0, 1);
  perform public.save_category(child, 'Hierarchy child ' || child, root, 'wallet', '#EDCF97', 0, 0);
  perform public.save_category(second_child, 'Second child ' || second_child, root, 'folder', '#B4D6D3', 0, 0);
  if (select sort_order from public.categories where id = child) <> 1 then raise exception 'Child reorder failed'; end if;
  perform public.save_category(same_name, 'Hierarchy child ' || child, other, 'folder', '#B4D6D3', 0, 0);
  begin
    perform public.save_category(gen_random_uuid(), 'Hierarchy child ' || child, root, 'folder', '#B4D6D3', 0, 0);
    raise exception 'Duplicate sibling name accepted';
  exception when unique_violation then null; end;
  insert into public.tasks(id, owner_id, category_id, title) values(task, auth.uid(), child, 'Child task');
  insert into public.notes(id, owner_id, category_id, kind, title) values(note, auth.uid(), child, 'plan', 'Child plan');
  if not exists(select 1 from public.categories where id = child and parent_id = root and icon = 'wallet' and color = '#EDCF97') then raise exception 'Child metadata lost'; end if;
  begin
    perform public.save_category(third, 'Third level', child, 'folder', '#B4D6D3', 0, 0);
    raise exception 'Third level accepted';
  exception when raise_exception then if sqlerrm = 'Third level accepted' then raise; end if; end;
  begin
    update public.categories set parent_id = child where id = root;
    raise exception 'Cycle accepted';
  exception when raise_exception then if sqlerrm = 'Cycle accepted' then raise; end if; end;
  begin
    perform public.save_category(child, 'Stale change', root, 'folder', '#B4D6D3', 999, 0);
    raise exception 'Stale category accepted';
  exception when serialization_failure then null; end;
  select version into v from public.categories where id = child;
  perform public.save_category(child, 'Moved child ' || child, other, 'target', '#8FFFE0', v, 0);
  if not exists(select 1 from public.tasks where id = task and category_id = child) then raise exception 'Move lost content'; end if;
  select version into v from public.categories where id = other;
  perform public.save_category(other, 'Renamed ' || other, null, 'book-open', '#D5BBE9', v, 0);
  if (select sort_order from public.categories where id = other) <> 0 or (select sort_order from public.categories where id = root) <> 1 then raise exception 'Reordering failed'; end if;
  -- A same-name root must not prevent deleting the parent or lose its children.
  perform public.save_category(third, 'Moved child ' || child, null, 'folder', '#B4D6D3', 0, 99);
  perform public.delete_category(other);
  if not exists(select 1 from public.categories where id = child and parent_id is null and name like 'Moved child % · %')
    or not exists(select 1 from public.tasks where id = task and category_id = child)
    or not exists(select 1 from public.notes where id = note and category_id = child and kind = 'plan') then raise exception 'Parent deletion lost data'; end if;
  perform public.delete_category(child);
  if not exists(select 1 from public.tasks where id = task and category_id is null)
    or not exists(select 1 from public.notes where id = note and category_id is null) then raise exception 'Child deletion lost content'; end if;
  begin
    update public.categories set owner_id = gen_random_uuid() where id = root;
    raise exception 'Category owner mutation accepted';
  exception when raise_exception then if sqlerrm = 'Category owner mutation accepted' then raise; end if; end;
end $$;
-- A different authenticated account sees no data and cannot use the new RPC.
set local "request.jwt.claim.sub" = '10000000-0000-4000-8000-999999999999';
do $$ begin
  if exists(select 1 from public.categories) then raise exception 'Other account can read categories'; end if;
  begin
    perform public.save_category(gen_random_uuid(), 'Forbidden', null, 'folder', '#B4D6D3', 0, 0);
    raise exception 'Other account RPC accepted';
  exception when raise_exception then if sqlerrm = 'Other account RPC accepted' then raise; end if; end;
end $$;
rollback;
select 'PASS: hierarchy, metadata, versions, reorder, move, deletion preservation and access' as result;
