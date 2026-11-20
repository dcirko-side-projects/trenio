-- Run with synthetic data in an isolated database; no changes are retained.
begin;
set local timezone = 'Pacific/Auckland';

insert into auth.users(id) values ('56000000-0000-4000-8000-000000000001');
insert into private.app_owner(user_id) values ('56000000-0000-4000-8000-000000000001');
insert into private.push_devices(owner_id, subscription) values ('56000000-0000-4000-8000-000000000001', '{"endpoint":"synthetic"}');
insert into public.tasks(id, owner_id, title, due_date, completed_at) values
  ('57000000-0000-4000-8000-000000000001', '56000000-0000-4000-8000-000000000001', 'Three stages', '2099-01-12', null),
  ('57000000-0000-4000-8000-000000000002', '56000000-0000-4000-8000-000000000001', 'No deadline', null, null),
  ('57000000-0000-4000-8000-000000000003', '56000000-0000-4000-8000-000000000001', 'Completed', '2099-01-09', now()),
  ('57000000-0000-4000-8000-000000000004', '56000000-0000-4000-8000-000000000001', 'Old overdue', '2099-01-07', null);
update public.tasks set remind_at = '2099-01-09 08:00Z' where title = 'Three stages';

do $$
declare delivery record;
begin
  if exists (select 1 from private.claim_task_push('2099-01-09 07:59Z')) then raise exception 'Sent before 09:00 in Zagreb'; end if;
  select * into strict delivery from private.claim_task_push('2099-01-09 08:00Z');
  if delivery.task_title <> 'Three stages' or delivery.reminder_kind <> 'before_due' then raise exception 'Incorrect advance reminder'; end if;
  perform public.finish_task_push(delivery.task_id, delivery.remind_at, delivery.attempt, 'sent', 'synthetic');
  if exists (select 1 from private.claim_task_push('2099-01-09 08:03Z')) then raise exception 'Advance reminder duplicated'; end if;

  select * into strict delivery from private.claim_task_push('2099-01-12 19:30Z');
  if delivery.task_title <> 'Three stages' or delivery.reminder_kind <> 'due_today' then raise exception 'Incorrect same-day reminder'; end if;
  perform public.finish_task_push(delivery.task_id, delivery.remind_at, delivery.attempt, 'sent', 'synthetic');

  select * into strict delivery from private.claim_task_push('2099-01-13 08:00Z');
  if delivery.task_title <> 'Three stages' or delivery.reminder_kind <> 'overdue' then raise exception 'Incorrect overdue reminder'; end if;
  perform public.finish_task_push(delivery.task_id, delivery.remind_at, delivery.attempt, 'sent', 'synthetic');
  if exists (select 1 from private.claim_task_push('2099-01-14 08:00Z')) then raise exception 'Overdue reminder repeated next day'; end if;

  update public.tasks set due_date = '2099-07-03' where title = 'Three stages';
  if exists (select 1 from private.claim_task_push('2099-06-30 06:59Z')) then raise exception 'Summer reminder sent early'; end if;
  select * into strict delivery from private.claim_task_push('2099-06-30 07:00Z');
  if delivery.reminder_kind <> 'before_due' or delivery.attempt <> 1 then raise exception 'Moved summer deadline not rescheduled'; end if;
  update public.tasks set due_date = null where title = 'Three stages';
  if exists (select 1 from private.claim_task_push('2099-06-30 07:05Z')) then raise exception 'Cleared deadline was claimed'; end if;
  update public.tasks set due_date = '2099-07-03' where title = 'Three stages';
  update public.tasks set completed_at = now() where title = 'Three stages';
  if exists (select 1 from private.claim_task_push('2099-07-03 07:00Z')) then raise exception 'Completed task was claimed'; end if;
end $$;

rollback;
