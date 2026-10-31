import { createClient } from '@supabase/supabase-js'
import type { Category, Data, Note, Task } from './domain'
import type { JSONContent } from '@tiptap/react'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
export const supabase = url && key ? createClient(url, key) : null
export const configurationIncomplete = Boolean(url) !== Boolean(key)

type TaskRow = { id: string; title: string; category_id: string | null; planned_date: string | null; due_date: string | null; completed_at: string | null; pinned: boolean; version: number }
type NoteRow = { kind: 'note' | 'plan' | 'idea'; id: string; title: string; category_id: string | null; body: JSONContent; archived_at: string | null; pinned: boolean; version: number }

async function loadRows<T>(table: 'categories' | 'tasks' | 'notes'): Promise<T[]> {
  const rows: T[] = []
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase!.from(table).select('*').order('id').range(offset, offset + 499)
    if (error) throw new Error('Podaci nisu učitani. Provjeri vezu i postavke baze.')
    rows.push(...(data ?? []) as T[])
    if (!data || data.length < 500) return rows
  }
}

export async function loadData(): Promise<Data> {
  if (!supabase) throw new Error('Nedostaje povezivanje s bazom.')
  const access = await supabase.rpc('is_app_owner')
  if (access.error) throw new Error('Vezu s bazom nije moguće provjeriti. Provjeri internet i je li migracija primijenjena.')
  if (!access.data) throw new Error('Ovaj račun nema pristup Treniju. Prijavi se vlasničkim računom.')
  const [categories, tasks, notes] = await Promise.all([
    loadRows<{ id: string; name: string; parent_id?: string | null; icon?: string; color?: string; sort_order?: number; version?: number }>('categories'),
    loadRows<TaskRow>('tasks'),
    loadRows<NoteRow>('notes'),
  ])
  return {
    categories: categories.map(row => ({ id: row.id, name: row.name, parentId: row.parent_id ?? null, icon: row.icon ?? 'folder', color: row.color ?? '#B4D6D3', sortOrder: row.sort_order ?? 0, version: row.version ?? 1 })),
    tasks: tasks.map(row => ({ id: row.id, title: row.title, categoryId: row.category_id,
      plannedDate: row.planned_date, dueDate: row.due_date, completedAt: row.completed_at, pinned: row.pinned, version: row.version })),
    notes: notes.map(row => ({ kind: row.kind ?? 'note', id: row.id, title: row.title, categoryId: row.category_id,
      body: row.body, archivedAt: row.archived_at, pinned: row.pinned, version: row.version })),
  }
}

export async function saveRecord(kind: 'task' | 'note', item: Task | Note, ownerId: string, existing: boolean) {
  if (!supabase) return
  const common = { title: item.title.trim(), category_id: item.categoryId, pinned: item.pinned }
  const payload = kind === 'task'
    ? { ...common, planned_date: (item as Task).plannedDate, due_date: (item as Task).dueDate, completed_at: (item as Task).completedAt }
    : { ...common, kind: (item as Note).kind, body: (item as Note).body, archived_at: (item as Note).archivedAt }
  const table = kind === 'task' ? 'tasks' : 'notes'
  const result = existing
    ? await supabase.from(table).update(payload).eq('id', item.id).eq('version', item.version).select('id').maybeSingle()
    : await supabase.from(table).insert({ ...payload, id: item.id, owner_id: ownerId }).select('id').single()
  if (result.error) throw new Error('Spremanje nije uspjelo. Tvoj unos ostaje ovdje; provjeri vezu i pokušaj ponovno.')
  if (!result.data) throw new Error('Stavka je promijenjena na drugom uređaju ili izbrisana. Tvoj unos je sačuvan u obrascu. Zatvori ga za dohvat novije verzije ili kopiraj unos prije ponovnog uređivanja.')
}

export async function deleteRecord(kind: 'task' | 'note', item: Task | Note) {
  if (!supabase) return
  const { data, error } = await supabase.from(kind === 'task' ? 'tasks' : 'notes').delete()
    .eq('id', item.id).eq('version', item.version).select('id').maybeSingle()
  if (error) throw new Error('Brisanje nije uspjelo. Pokušaj ponovno.')
  if (!data) throw new Error('Stavka je u međuvremenu promijenjena. Osvježi podatke prije brisanja.')
}

export async function createLinkedTask(note: Note, path: number[], taskId: string) {
  if (!supabase) return
  const { error } = await supabase.rpc('create_linked_task', { note_id: note.id, expected_version: note.version, draft: note, item_path: path, task_id: taskId })
  if (error?.code === '40001') throw new Error('Stavka je promijenjena na drugom uređaju. Tvoj unos je sačuvan; zatvori obrazac za dohvat novije verzije.')
  if (error) throw new Error('Povezivanje nije uspjelo. Tvoj unos je sačuvan. Provjeri vezu i pokušaj ponovno; ako je zapis već spremljen, osvježi podatke.')
}

export async function saveCategory(category: Category, position: number) {
  if (!supabase) return
  const { error } = await supabase.rpc('save_category', { target_id: category.id, category_name: category.name.trim(), parent: category.parentId ?? null, category_icon: category.icon ?? 'folder', category_color: category.color ?? '#B4D6D3', expected_version: category.version ?? 0, target_position: position })
  if (error?.code === '40001') throw new Error('Kategorija je promijenjena na drugom uređaju. Zatvori obrazac i osvježi podatke prije ponovnog uređivanja.')
  if (error) throw new Error('Kategorija nije spremljena. Provjeri vezu, naziv i dopuštene dvije razine. Unos je sačuvan.')
}

export async function removeCategory(id: string) {
  if (!supabase) return
  const { error } = await supabase.rpc('delete_category', { target_id: id })
  if (error) throw new Error('Kategorija nije izbrisana. Sadržaj je sačuvan; pokušaj ponovno.')
}
