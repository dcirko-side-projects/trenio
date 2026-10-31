-- Run after the plans migration. All test content is rolled back.
begin;
select set_config('request.jwt.claim.sub', (select user_id::text from private.app_owner), true);
set local role authenticated;
do $$
declare
  category uuid := gen_random_uuid();
  plan uuid := gen_random_uuid();
  affected integer;
begin
  if not public.is_app_owner() then raise exception 'Expected configured owner'; end if;
  insert into public.categories(id, owner_id, name) values (category, auth.uid(), 'plans-test-' || category::text);
  insert into public.notes(id, owner_id, category_id, kind, title, body)
  values (plan, auth.uid(), category, 'plan', 'Temporary plan test', '{"type":"doc","content":[{"type":"taskList","content":[{"type":"taskItem","attrs":{"checked":true},"content":[{"type":"paragraph"}]}]}]}'::jsonb);
  update public.notes set pinned = true where id = plan and version = 1;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Owner could not update plan'; end if;
  update public.notes set title = 'Stale write' where id = plan and version = 1;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Stale plan write was not rejected'; end if;
  perform public.delete_category(category);
  if not exists(select 1 from public.notes where id = plan and category_id is null and kind = 'plan' and version = 3 and pinned) then
    raise exception 'Category removal did not preserve plan';
  end if;
  begin
    insert into public.notes(owner_id, kind, title) values (auth.uid(), 'unsupported', 'Invalid kind');
    raise exception 'Unknown content kind was accepted';
  exception when check_violation then null;
  end;
end $$;
rollback;
select 'PASS: plans owner access, versions, category preservation and kind constraint; test data rolled back' as result;
