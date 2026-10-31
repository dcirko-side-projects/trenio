-- Preserve word boundaries across inline formatting when naming a linked task.
begin;
create or replace function private.node_text(document jsonb) returns text
language sql immutable set search_path = '' as $$
  select case when document->>'type' = 'text' then coalesce(document->>'text', '')
    when document->>'type' = 'hardBreak' then E'\n'
    else (select coalesce(string_agg(private.node_text(child),
      case when document->>'type' in ('paragraph', 'heading', 'codeBlock') then '' else ' ' end order by ordinal), '')
      from jsonb_array_elements(coalesce(document->'content', '[]'::jsonb)) with ordinality entries(child, ordinal)) end;
$$;
do $$ begin
  if private.node_text('{"type":"paragraph","content":[{"type":"text","text":"Uče"},{"type":"text","text":"nje","marks":[{"type":"bold"}]}]}'::jsonb) <> 'Učenje' then
    raise exception 'Inline word boundaries were lost';
  end if;
end $$;
commit;
