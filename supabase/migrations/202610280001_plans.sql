-- Apply once after 202610250001_initial.sql. Existing notes remain notes.
begin;
alter table public.notes add column kind text not null default 'note'
  constraint notes_kind_check check (kind in ('note', 'plan'));
commit;
