-- Run after ideas migration; no test data survives this transaction.
begin;
select set_config('request.jwt.claim.sub', (select user_id::text from private.app_owner), true);
set local role authenticated;
do $$
declare
  category uuid := gen_random_uuid();
  idea uuid := gen_random_uuid();
  content jsonb := '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Temporary idea description"}]}]}';
  archived timestamptz := now();
  affected integer;
begin
  if not public.is_app_owner() then raise exception 'Expected owner'; end if;
  insert into public.categories(id, owner_id, name) values(category, auth.uid(), 'ideas-test-' || category::text);
  insert into public.notes(id, owner_id, category_id, kind, title, body, pinned, archived_at)
  values(idea, auth.uid(), category, 'idea', 'Temporary idea', content, true, archived);
  update public.notes set kind = 'plan' where id = idea and version = 1;
  get diagnostics affected = row_count;
  if affected <> 1 or not exists(select 1 from public.notes where id = idea and kind = 'plan' and category_id = category
    and body = content and archived_at = archived and pinned and version = 2) then
    raise exception 'Conversion lost identity or content';
  end if;
  update public.notes set kind = 'idea' where id = idea and version = 1;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Stale conversion was accepted'; end if;
  update public.notes set kind = 'idea' where id = idea and version = 2;
  perform public.delete_category(category);
  if not exists(select 1 from public.notes where id = idea and kind = 'idea' and category_id is null and body = content and version = 4) then
    raise exception 'Category deletion lost idea';
  end if;
end $$;
rollback;
select 'PASS: idea access, same-record conversion, preserved content, stale version and category removal; rolled back' as result;
