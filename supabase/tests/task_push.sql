-- Run in an isolated database. All changes are rolled back.
begin;

insert into auth.users (id) values ('52000000-0000-4000-8000-000000000001'), ('52000000-0000-4000-8000-000000000002');
insert into private.app_owner (user_id) values ('52000000-0000-4000-8000-000000000001');

set local role anon;
do $$ begin
  perform public.task_push_device(null);
  raise exception 'Anonymous device access';
exception when insufficient_privilege then null;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '52000000-0000-4000-8000-000000000002', true);
do $$ begin
  perform public.task_push_device(null);
  raise exception 'Non-owner device access';
exception when insufficient_privilege then null;
end $$;
select set_config('request.jwt.claim.sub', '52000000-0000-4000-8000-000000000001', true);
do $$
declare
  endpoint text := 'https://fcm.googleapis.com/fcm/send/synthetic-device';
begin
  if not public.task_push_device(endpoint, jsonb_build_object('endpoint', endpoint, 'keys', jsonb_build_object('auth', repeat('A', 22), 'p256dh', repeat('B', 87)))) then
    raise exception 'Push device not enabled';
  end if;
  if not public.task_push_device(endpoint) then raise exception 'Device missing'; end if;
  begin
    perform public.claim_task_push();
    raise exception 'Owner can call delivery RPC';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.task_push_device('https://example.com/push', '{}'::jsonb);
    raise exception 'Unsupported push endpoint accepted';
  exception when invalid_parameter_value then null;
  end;
end $$;

insert into public.tasks (id, owner_id, title, remind_at) values
 ('53000000-0000-4000-8000-000000000001', '52000000-0000-4000-8000-000000000001', 'Push success', now() + interval '1 hour'),
 ('53000000-0000-4000-8000-000000000002', '52000000-0000-4000-8000-000000000001', 'Completed', now() + interval '1 hour');
update public.tasks set completed_at = now() where id = '53000000-0000-4000-8000-000000000002';
do $$ begin
  if exists (select 1 from public.tasks where title = 'Completed' and remind_at is not null) then raise exception 'Completion did not cancel'; end if;
  begin
    update public.tasks set remind_at = now() - interval '1 minute' where title = 'Push success';
    raise exception 'Past scheduling accepted';
  exception when invalid_parameter_value then null;
  end;
end $$;
reset role;

alter table public.tasks disable trigger tasks_validate_reminder;
update public.tasks set remind_at = now() - interval '1 minute' where title = 'Push success';
alter table public.tasks enable trigger tasks_validate_reminder;

set local role service_role;
do $$
declare
  delivery record;
begin
  select * into strict delivery from public.claim_task_push();
  if delivery.task_title <> 'Push success' or delivery.attempt <> 1 then raise exception 'Wrong task claimed'; end if;
  if exists (select 1 from public.claim_task_push()) then raise exception 'Claimed twice during lease'; end if;
  perform public.finish_task_push(delivery.task_id, delivery.remind_at, delivery.attempt, 'sent', delivery.subscription->>'endpoint');
  if exists (select 1 from public.claim_task_push()) then raise exception 'Sent reminder claimed again'; end if;
end $$;
reset role;

rollback;
