-- Integration check for a newly configured database, before assigning its real owner.
-- Test identities have no passwords or tokens. Every change is rolled back.
begin;

do $$ begin
  if exists (select 1 from private.app_owner) then
    raise exception 'Run this bootstrap test before assigning the real owner';
  end if;
end $$;

insert into auth.users (id, email) values
  ('10000000-0000-4000-8000-000000000001', 'trenio-owner@example.invalid'),
  ('10000000-0000-4000-8000-000000000002', 'trenio-other@example.invalid');
insert into private.app_owner (user_id) values ('10000000-0000-4000-8000-000000000001');
insert into public.categories (id, owner_id, name) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Owner test'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Other test');

set local role authenticated;
set local "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000001';
do $$
declare changed integer;
begin
  if not public.is_app_owner() then raise exception 'Owner identity rejected'; end if;
  if (select count(*) from public.categories) <> 1 then raise exception 'Owner category isolation failed'; end if;
  begin
    perform 1 from private.app_owner;
    raise exception 'Private owner table must not be directly readable';
  exception when insufficient_privilege then null;
  end;
  insert into public.tasks (id, owner_id, category_id, title, planned_date, due_date) values
    ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Temporary task', '2026-10-26', '2026-10-27');
  insert into public.notes (id, owner_id, category_id, title) values
    ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Temporary note');

  begin
    update public.tasks set category_id = '20000000-0000-4000-8000-000000000002'
      where id = '30000000-0000-4000-8000-000000000001';
    raise exception 'Cross-owner category link accepted';
  exception when foreign_key_violation then null;
  end;

  update public.tasks set title = 'Updated task' where id = '30000000-0000-4000-8000-000000000001' and version = 1;
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'Owner update failed'; end if;
  if (select version from public.tasks where id = '30000000-0000-4000-8000-000000000001') <> 2 then raise exception 'Version not incremented'; end if;
  update public.tasks set title = 'Stale overwrite' where id = '30000000-0000-4000-8000-000000000001' and version = 1;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Stale task update accepted'; end if;
  update public.notes set title = 'Updated note' where id = '40000000-0000-4000-8000-000000000001' and version = 1;
  update public.notes set title = 'Stale overwrite' where id = '40000000-0000-4000-8000-000000000001' and version = 1;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Stale note update accepted'; end if;
end $$;

set local "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000002';
do $$
declare changed integer;
begin
  if public.is_app_owner() then raise exception 'Second user became owner'; end if;
  if exists (select 1 from public.tasks) or exists (select 1 from public.notes) or exists (select 1 from public.categories) then
    raise exception 'Second user can see application data';
  end if;
  update public.tasks set title = 'Unauthorized' where id = '30000000-0000-4000-8000-000000000001';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Second user updated owner task'; end if;
  begin
    insert into public.tasks (owner_id, title) values ('10000000-0000-4000-8000-000000000002', 'Unauthorized task');
    raise exception 'Second user can create application data';
  exception when insufficient_privilege then null;
  end;
end $$;

set local role anon;
set local "request.jwt.claim.sub" = '';
do $$ begin
  begin perform 1 from public.tasks; raise exception 'Anonymous tasks readable'; exception when insufficient_privilege then null; end;
  begin perform 1 from public.notes; raise exception 'Anonymous notes readable'; exception when insufficient_privilege then null; end;
  begin perform 1 from public.categories; raise exception 'Anonymous categories readable'; exception when insufficient_privilege then null; end;
end $$;

set local role authenticated;
set local "request.jwt.claim.sub" = '10000000-0000-4000-8000-000000000001';
do $$ begin
  perform public.delete_category('20000000-0000-4000-8000-000000000001');
  if not exists (select 1 from public.tasks where id = '30000000-0000-4000-8000-000000000001' and category_id is null and version = 3 and title = 'Updated task') then
    raise exception 'Deleting category lost or corrupted its task';
  end if;
  if not exists (select 1 from public.notes where id = '40000000-0000-4000-8000-000000000001' and category_id is null and version = 3 and title = 'Updated note') then
    raise exception 'Deleting category lost or corrupted its note';
  end if;
  if exists (select 1 from public.categories) then raise exception 'Category was not deleted'; end if;
end $$;

rollback;
select 'PASS: owner CRUD, private table isolation, other-user and anon denial, stale writes, cross-owner links, category deletion; all test data rolled back' as result;
