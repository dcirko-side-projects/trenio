import type { Data, Note } from './domain'
import { safeLink } from './domain.ts'
import { categoryColors, categoryIcons, validateCategory } from './categories.ts'
import { checklistItems } from './content.ts'

export type Backup = Data & { formatVersion: 5; exportedAt: string; demo: boolean }

function fail(): never { throw new Error('Datoteka nije valjana sigurnosna kopija Trenija.') }
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail()
  return value as Record<string, unknown>
}
function text(value: unknown, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) fail()
  return value
}
function flag(value: unknown): boolean { if (typeof value !== 'boolean') fail(); return value }
const nodeTypes = new Set(['doc', 'paragraph', 'heading', 'text', 'bulletList', 'orderedList', 'listItem', 'blockquote', 'codeBlock', 'hardBreak', 'horizontalRule', 'taskList', 'taskItem'])
const markTypes = new Set(['bold', 'italic', 'strike', 'underline', 'code', 'link'])
function editorNode(value: unknown, depth = 0): void {
  const node = record(value)
  if (depth > 64 || typeof node.type !== 'string' || !nodeTypes.has(node.type)) fail()
  if (node.type === 'text' && typeof node.text !== 'string') fail()
  if (node.content !== undefined) {
    if (!Array.isArray(node.content)) fail()
    node.content.forEach(child => editorNode(child, depth + 1))
  }
  if (node.marks !== undefined) {
    if (!Array.isArray(node.marks)) fail()
    for (const value of node.marks) {
      const mark = record(value)
      if (typeof mark.type !== 'string' || !markTypes.has(mark.type)) fail()
      if (mark.type === 'link') {
        const href = record(mark.attrs).href
        if (typeof href !== 'string' || !safeLink(href)) fail()
      }
    }
  }
}
function date(value: unknown, timestamp = false): string | null {
  if (value === null) return null
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) fail()
  if (!timestamp && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) !== value)) fail()
  return value
}

export function parseBackup(source: string, allowDemo = false): Backup {
  if (new TextEncoder().encode(source).length > 10 * 1024 * 1024) throw new Error('Sigurnosna kopija prelazi dopuštenih 10 MB.')
  let parsed: unknown
  try { parsed = JSON.parse(source) } catch { fail() }
  const root = record(parsed)
  if (![1, 2, 3, 4, 5].includes(Number(root.formatVersion)) || typeof root.formatVersion !== 'number' || typeof root.exportedAt !== 'string' || !Number.isFinite(Date.parse(root.exportedAt))) fail()
  const demo = flag(root.demo)
  if (demo && !allowDemo) throw new Error('Probni podaci nisu sigurnosna kopija stvarne aplikacije.')
  const id = (value: unknown) => {
    const result = text(value, 100)
    if (!demo && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result)) fail()
    return result
  }
  const collection = (value: unknown) => { if (!Array.isArray(value)) fail(); return value.map(record) }
  const categories = collection(root.categories).map((row, index) => {
    if (root.formatVersion !== 5 && (row.parentId || row.icon && row.icon !== 'folder' || row.color && row.color !== categoryColors[0])) fail()
    if (root.formatVersion === 5 && (!Number.isInteger(row.sortOrder) || Number(row.sortOrder) < 0 || !Number.isInteger(row.version) || Number(row.version) < 1 || !categoryIcons.includes(String(row.icon)) || !categoryColors.includes(String(row.color)))) fail()
    return { id: id(row.id), name: text(row.name, 80), parentId: root.formatVersion === 5 && row.parentId !== null ? id(row.parentId) : null, icon: root.formatVersion === 5 ? String(row.icon) : 'folder', color: root.formatVersion === 5 ? String(row.color) : categoryColors[0], sortOrder: root.formatVersion === 5 ? Number(row.sortOrder) : index, version: root.formatVersion === 5 ? Number(row.version) : 1 }
  })
  for (const category of categories) validateCategory(category, categories)
  const categoryIds = new Set(categories.map(category => category.id))
  const category = (value: unknown) => {
    if (value === null) return null
    const result = id(value)
    if (!categoryIds.has(result)) throw new Error('Kopija sadrži vezu na kategoriju koja nedostaje.')
    return result
  }
  const base = (row: Record<string, unknown>) => {
    if (!Number.isInteger(row.version) || Number(row.version) < 1) fail()
    return { id: id(row.id), title: text(row.title, 300), categoryId: category(row.categoryId), pinned: flag(row.pinned), version: Number(row.version) }
  }
  const tasks = collection(root.tasks).map(row => ({ ...base(row), plannedDate: date(row.plannedDate), dueDate: date(row.dueDate), completedAt: date(row.completedAt, true) }))
  const notes = collection(root.notes).map(row => {
    const kind: Note['kind'] = root.formatVersion === 1 && row.kind === undefined ? 'note' : row.kind === 'note' || row.kind === 'plan' || (Number(root.formatVersion) >= 3 && row.kind === 'idea') ? row.kind : fail()
    const body = record(row.body)
    if (body.type !== 'doc' || !Array.isArray(body.content)) fail()
    editorNode(body)
    return { ...base(row), kind, body, archivedAt: date(row.archivedAt, true) }
  })
  for (const rows of [categories, tasks, notes]) {
    if (new Set(rows.map(row => row.id)).size !== rows.length) throw new Error('Kopija sadrži ponovljene identifikatore.')
  }
  const linkedTasks = new Set<string>()
  for (const note of notes) for (const { node } of checklistItems(note.body)) {
    const target = node.attrs?.taskId
    if (target === undefined || target === null) continue
    if (Number(root.formatVersion) < 4 || typeof target !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(target) || linkedTasks.has(target)) fail()
    const task = tasks.find(task => task.id === target)
    if (!task || typeof node.attrs?.checked !== 'boolean' || node.attrs.checked !== Boolean(task.completedAt)) throw new Error('Kopija sadrži nevaljanu ili neusklađenu vezu zadatka. Osvježi podatke i ponovi izvoz.')
    linkedTasks.add(target)
  }
  return { formatVersion: 5, exportedAt: root.exportedAt, demo, categories, tasks, notes }
}

export function createBackup(data: Data, demo: boolean, now = new Date()): Backup {
  return parseBackup(JSON.stringify({ formatVersion: 5, exportedAt: now.toISOString(), demo, ...data, categories: data.categories.map((row, index) => ({ parentId: null, icon: 'folder', color: categoryColors[0], sortOrder: index, version: 1, ...row })) }), true)
}

export function recoverySql(backup: Backup, rehearse = true): string {
  const validated = parseBackup(JSON.stringify(backup))
  const target = rehearse ? 'pg_temp' : 'public'
  const payload = JSON.stringify(validated).replaceAll("'", "''")
  const temporaryTables = rehearse ? `
create temporary table categories (like public.categories including all) on commit drop;
create temporary table tasks (like public.tasks including all) on commit drop;
create temporary table notes (like public.notes including all) on commit drop;
alter table pg_temp.categories add foreign key (parent_id, owner_id) references pg_temp.categories(id, owner_id);
alter table pg_temp.tasks add foreign key (category_id, owner_id) references pg_temp.categories(id, owner_id);
alter table pg_temp.notes add foreign key (category_id, owner_id) references pg_temp.categories(id, owner_id);
` : ''
  return `-- PRIVATE: contains exported application data. Do not commit or share this file.
-- ${rehearse ? 'REHEARSAL: temporary tables only; transaction is rolled back.' : 'RECOVERY: only into an empty account; existing data is never replaced.'}
begin;
set local standard_conforming_strings = on;
${temporaryTables}
lock table ${target}.categories, ${target}.tasks, ${target}.notes in share row exclusive mode;
do $$ begin
  if (select count(*) from private.app_owner) <> 1 then raise exception 'Configure exactly one owner first'; end if;
  if exists(select 1 from ${target}.categories) or exists(select 1 from ${target}.tasks) or exists(select 1 from ${target}.notes) then
    raise exception 'Recovery target must be empty; no existing data was changed';
  end if;
end $$;
create temporary table trenio_recovery_source (payload jsonb not null) on commit drop;
insert into pg_temp.trenio_recovery_source values ('${payload}'::jsonb);
insert into ${target}.categories(id, owner_id, name, parent_id, icon, color, sort_order, version)
select (row->>'id')::uuid, owner.user_id, row->>'name', (row->>'parentId')::uuid, row->>'icon', row->>'color', (row->>'sortOrder')::integer, (row->>'version')::integer
from pg_temp.trenio_recovery_source source cross join private.app_owner owner,
jsonb_array_elements(source.payload->'categories') row
order by row->>'parentId' nulls first, (row->>'sortOrder')::integer, row->>'id';
insert into ${target}.tasks(id, owner_id, category_id, title, planned_date, due_date, completed_at, pinned, version)
select (row->>'id')::uuid, owner.user_id, (row->>'categoryId')::uuid, row->>'title',
(row->>'plannedDate')::date, (row->>'dueDate')::date, (row->>'completedAt')::timestamptz, (row->>'pinned')::boolean, (row->>'version')::integer
from pg_temp.trenio_recovery_source source cross join private.app_owner owner,
jsonb_array_elements(source.payload->'tasks') row;
insert into ${target}.notes(id, owner_id, category_id, kind, title, body, archived_at, pinned, version)
select (row->>'id')::uuid, owner.user_id, (row->>'categoryId')::uuid, row->>'kind', row->>'title', row->'body',
(row->>'archivedAt')::timestamptz, (row->>'pinned')::boolean, (row->>'version')::integer
from pg_temp.trenio_recovery_source source cross join private.app_owner owner,
jsonb_array_elements(source.payload->'notes') row;
do $$ begin
  if (select count(*) from ${target}.categories) <> ${validated.categories.length}
    or (select count(*) from ${target}.tasks) <> ${validated.tasks.length}
    or (select count(*) from ${target}.notes) <> ${validated.notes.length} then raise exception 'Recovery row count mismatch'; end if;
  if exists (
    select 1 from pg_temp.trenio_recovery_source source, jsonb_array_elements(source.payload->'categories') row
    join ${target}.categories restored on restored.id = (row->>'id')::uuid
    where restored.name is distinct from row->>'name'
      or restored.parent_id is distinct from (row->>'parentId')::uuid
      or restored.icon is distinct from row->>'icon'
      or restored.color is distinct from row->>'color'
      or restored.sort_order is distinct from (row->>'sortOrder')::integer
      or restored.version is distinct from (row->>'version')::integer
  ) then raise exception 'Category content mismatch'; end if;
  if exists (
    select 1 from pg_temp.trenio_recovery_source source, jsonb_array_elements(source.payload->'notes') row
    join ${target}.notes restored on restored.id = (row->>'id')::uuid
    where restored.body <> row->'body'
      or restored.kind is distinct from row->>'kind'
      or restored.category_id is distinct from (row->>'categoryId')::uuid
      or restored.title is distinct from row->>'title'
      or restored.archived_at is distinct from (row->>'archivedAt')::timestamptz
      or restored.pinned is distinct from (row->>'pinned')::boolean
      or restored.version is distinct from (row->>'version')::integer
  ) then raise exception 'Note content mismatch'; end if;
  if exists (
    select 1 from pg_temp.trenio_recovery_source source, jsonb_array_elements(source.payload->'tasks') row
    join ${target}.tasks restored on restored.id = (row->>'id')::uuid
    where restored.title is distinct from row->>'title'
      or restored.category_id is distinct from (row->>'categoryId')::uuid
      or restored.planned_date is distinct from (row->>'plannedDate')::date
      or restored.due_date is distinct from (row->>'dueDate')::date
      or restored.completed_at is distinct from (row->>'completedAt')::timestamptz
      or restored.pinned is distinct from (row->>'pinned')::boolean
      or restored.version is distinct from (row->>'version')::integer
  ) then raise exception 'Task content mismatch'; end if;
end $$;
${rehearse ? 'rollback' : 'commit'};
select '${rehearse ? 'PASS: recovery rehearsal completed; original data unchanged' : 'Recovery completed'}' as result;
`
}
