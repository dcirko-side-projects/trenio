-- JSON links must use the canonical UUID spelling used by task rows and patches.
begin;
create function private.canonical_task_links() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists(select 1 from private.checklist_nodes(new.body) node
    where node->'attrs'->>'taskId' is not null and node->'attrs'->>'taskId' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') then
    raise exception 'Task link must use a canonical UUID';
  end if;
  return new;
end $$;
create trigger notes_canonical_links before insert or update of body on public.notes for each row execute function private.canonical_task_links();
revoke all on function private.canonical_task_links() from public, anon, authenticated;
commit;
