begin;

-- Preserve the manual delivery records while allowing several reminders per task.
alter table private.task_push_deliveries drop constraint task_push_deliveries_pkey,
  add primary key (task_id, remind_at);
create index tasks_due_date_for_push on public.tasks (due_date) where completed_at is null;

create function private.claim_task_push(at_time timestamptz)
returns table (task_id uuid, task_title text, remind_at timestamptz, attempt integer, subscription jsonb, reminder_kind text)
language sql set search_path = '' as $$
  with local_day as (
    select (at_time at time zone 'Europe/Zagreb')::date as day
  ), due_slots as (
    select day + offset_days as due_date, (day + time '09:00') at time zone 'Europe/Zagreb' as scheduled_at, kind
    from local_day cross join (values (3, 'before_due'), (0, 'due_today'), (-1, 'overdue')) as offsets(offset_days, kind)
  ), candidates as (
    select t.id, t.remind_at as scheduled_at, 'manual'::text as kind, null::date as due_date
    from public.tasks t
    where t.completed_at is null and t.remind_at <= at_time and t.remind_at > at_time - interval '1 hour'
    union all
    select t.id, s.scheduled_at, s.kind, s.due_date
    from due_slots s join public.tasks t on t.due_date = s.due_date
    where t.completed_at is null and s.scheduled_at <= at_time
  ), distinct_candidates as (
    select distinct on (id, scheduled_at) id, scheduled_at, kind, due_date
    from candidates order by id, scheduled_at, (kind = 'manual')
  ), due as materialized (
    select t.id, t.title, c.scheduled_at, c.kind, p.subscription
    from distinct_candidates c
    join public.tasks t on t.id = c.id
    join private.push_devices p on p.owner_id = t.owner_id
    left join private.task_push_deliveries d on d.task_id = t.id and d.remind_at = c.scheduled_at
    where t.completed_at is null
      and ((c.kind = 'manual' and t.remind_at = c.scheduled_at) or t.due_date = c.due_date)
      and (d.task_id is null or (d.retry_at <= at_time and d.attempts < 4))
    order by c.scheduled_at, t.id
    limit 20 for update of t skip locked
  ), claimed as (
    insert into private.task_push_deliveries as d (task_id, remind_at, attempts, retry_at)
    select id, scheduled_at, 1, at_time + interval '2 minutes' from due
    on conflict on constraint task_push_deliveries_pkey do update set
      attempts = d.attempts + 1, retry_at = excluded.retry_at
    where d.retry_at <= at_time and d.attempts < 4
    returning d.task_id, d.remind_at, d.attempts
  )
  select due.id, due.title, due.scheduled_at, claimed.attempts, due.subscription, due.kind
  from due join claimed on claimed.task_id = due.id and claimed.remind_at = due.scheduled_at;
$$;
revoke all on function private.claim_task_push(timestamptz) from public, anon, authenticated;

drop function public.claim_task_push();
create function public.claim_task_push()
returns table (task_id uuid, task_title text, remind_at timestamptz, attempt integer, subscription jsonb, reminder_kind text)
language sql security definer set search_path = '' as $$
  select * from private.claim_task_push(now());
$$;
revoke all on function public.claim_task_push() from public, anon, authenticated;
grant execute on function public.claim_task_push() to service_role;
notify pgrst, 'reload schema';

commit;
