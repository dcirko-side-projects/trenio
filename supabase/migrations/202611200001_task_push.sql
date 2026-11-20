begin;

alter table public.tasks add column remind_at timestamptz;
create index tasks_remind_at on public.tasks (remind_at) where remind_at is not null and completed_at is null;

create table private.push_devices (
  owner_id uuid primary key references private.app_owner(user_id) on delete cascade,
  subscription jsonb not null
);
create table private.task_push_deliveries (
  task_id uuid primary key references public.tasks(id) on delete cascade,
  remind_at timestamptz not null,
  attempts integer not null,
  retry_at timestamptz not null
);

create function private.validate_task_reminder() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.completed_at is not null then
    new.remind_at := null;
  elsif new.remind_at is not null and new.remind_at <= now() then
    if tg_op = 'INSERT' or new.remind_at is distinct from old.remind_at then
      raise exception 'Reminder must be in the future' using errcode = '22023';
    end if;
  end if;
  return new;
end;
$$;
create trigger tasks_validate_reminder before insert or update on public.tasks
  for each row execute function private.validate_task_reminder();

create function public.task_push_device(endpoint text, device jsonb default null, disable boolean default false)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  owner uuid := auth.uid();
begin
  if not public.is_app_owner() then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  if disable then
    delete from private.push_devices where owner_id = owner and subscription->>'endpoint' = endpoint;
    return false;
  end if;
  if device is not null then
    if endpoint is null or length(endpoint) > 4096 or device->>'endpoint' is distinct from endpoint
      or endpoint !~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com)/[^[:space:]]+$'
      or coalesce(device #>> '{keys,p256dh}', '') !~ '^[A-Za-z0-9_-]{87}$'
      or coalesce(device #>> '{keys,auth}', '') !~ '^[A-Za-z0-9_-]{22}$' then
      raise exception 'Invalid push subscription' using errcode = '22023';
    end if;
    insert into private.push_devices (owner_id, subscription)
      values (owner, jsonb_build_object('endpoint', endpoint, 'keys', device->'keys'))
      on conflict (owner_id) do update set subscription = excluded.subscription;
    return true;
  end if;
  return exists (select 1 from private.push_devices where owner_id = owner and subscription->>'endpoint' = endpoint);
end;
$$;
revoke all on function public.task_push_device(text, jsonb, boolean) from public, anon;
grant execute on function public.task_push_device(text, jsonb, boolean) to authenticated;

create function public.claim_task_push()
returns table (task_id uuid, task_title text, remind_at timestamptz, attempt integer, subscription jsonb)
language sql security definer set search_path = '' as $$
  with due as materialized (
    select t.id, t.title, t.remind_at, p.subscription
    from public.tasks t
    join private.push_devices p on p.owner_id = t.owner_id
    left join private.task_push_deliveries d on d.task_id = t.id and d.remind_at = t.remind_at
    where t.completed_at is null and t.remind_at <= now() and t.remind_at > now() - interval '1 hour'
      and (d.task_id is null or (d.retry_at <= now() and d.attempts < 4))
    order by t.remind_at, t.id
    limit 20 for update of t skip locked
  ), claimed as (
    insert into private.task_push_deliveries as d (task_id, remind_at, attempts, retry_at)
    select id, remind_at, 1, now() + interval '2 minutes' from due
    on conflict on constraint task_push_deliveries_pkey do update set
      remind_at = excluded.remind_at,
      attempts = case when d.remind_at = excluded.remind_at then d.attempts + 1 else 1 end,
      retry_at = excluded.retry_at
    where d.remind_at <> excluded.remind_at or (d.retry_at <= now() and d.attempts < 4)
    returning d.task_id, d.attempts
  )
  select due.id, due.title, due.remind_at, claimed.attempts, due.subscription from due join claimed on claimed.task_id = due.id;
$$;

create function public.finish_task_push(target_id uuid, scheduled_at timestamptz, attempt integer, outcome text, endpoint text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if outcome = 'expired' then
    delete from private.push_devices p using public.tasks t
      where t.id = target_id and p.owner_id = t.owner_id and p.subscription->>'endpoint' = endpoint;
  end if;
  if outcome in ('sent', 'rejected') then
    update private.task_push_deliveries set retry_at = 'infinity'
      where task_id = target_id and remind_at = scheduled_at and attempts = attempt;
  end if;
end;
$$;
revoke all on function public.claim_task_push(), public.finish_task_push(uuid, timestamptz, integer, text, text) from public, anon, authenticated;
grant execute on function public.claim_task_push(), public.finish_task_push(uuid, timestamptz, integer, text, text) to service_role;

commit;
