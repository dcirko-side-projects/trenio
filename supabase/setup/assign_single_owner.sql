-- Run only after confirming that the single active Auth user is the intended owner.
-- Refuse ambiguous accounts or replacement of an existing owner.
begin;
do $$
declare selected_user uuid;
begin
  if (select count(*) from auth.users where deleted_at is null) <> 1 then
    raise exception 'Expected exactly one active Auth user; select the intended owner explicitly instead';
  end if;
  select id into selected_user from auth.users where deleted_at is null;
  if exists (select 1 from private.app_owner where user_id <> selected_user) then
    raise exception 'An existing owner cannot be replaced by this setup script';
  end if;
  insert into private.app_owner (user_id) values (selected_user) on conflict (user_id) do nothing;
end $$;
commit;
select exists(select 1 from private.app_owner) as owner_configured;
