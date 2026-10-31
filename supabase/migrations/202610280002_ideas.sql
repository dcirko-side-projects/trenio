-- Apply after plans. Widen allowed kinds; existing rows and RLS are preserved.
begin;
alter table public.notes drop constraint notes_kind_check;
alter table public.notes add constraint notes_kind_check check (kind in ('note', 'plan', 'idea'));
commit;
