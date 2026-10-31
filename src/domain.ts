import type { JSONContent } from '@tiptap/react'

export type Category = { id: string; name: string; parentId?: string | null; icon?: string; color?: string; sortOrder?: number; version?: number }
export type Task = {
  id: string
  title: string
  categoryId: string | null
  plannedDate: string | null
  dueDate: string | null
  completedAt: string | null
  pinned: boolean
  version: number
}
export type Note = {
  kind: 'note' | 'plan' | 'idea'
  id: string
  title: string
  categoryId: string | null
  body: JSONContent
  archivedAt: string | null
  pinned: boolean
  version: number
}
export type Data = { categories: Category[]; tasks: Task[]; notes: Note[] }
export type View = 'overview' | 'categories' | 'archive' | 'search'

export function planProgress(body: JSONContent): { done: number; total: number; percent: number } | null {
  let done = 0
  let total = 0
  const visit = (node: JSONContent) => {
    if (node.type === 'taskItem') { total++; if (node.attrs?.checked === true) done++ }
    node.content?.forEach(visit)
  }
  visit(body)
  return total ? { done, total, percent: Math.round(done / total * 100) } : null
}

export function todayInZagreb(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Zagreb', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const get = (type: string) => parts.find(part => part.type === type)!.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function isTodayTask(task: Task, today: string): boolean {
  return !task.completedAt && Boolean(
    (task.plannedDate && task.plannedDate <= today) || (task.dueDate && task.dueDate <= today),
  )
}

export function taskGroup(task: Task, today: string): string {
  if (task.dueDate && task.dueDate < today) return 'Rok je prošao'
  if (task.dueDate === today) return 'Rok danas'
  if (task.plannedDate && task.plannedDate < today) return 'Ranije planirano'
  return 'Za danas'
}

export function formatDay(day: string): string {
  const [year, month, date] = day.split('-').map(Number)
  return new Intl.DateTimeFormat('hr', { day: 'numeric', month: 'short' }).format(new Date(year, month - 1, date))
}

export function safeLink(url: string): boolean {
  try { return ['https:', 'http:', 'mailto:'].includes(new URL(url).protocol) } catch { return false }
}

export function createDemo(today: string): Data {
  return {
    categories: [
      { id: 'work', name: 'Posao' }, { id: 'learn', name: 'Programiranje' },
      { id: 'private', name: 'Privatno' },
    ],
    tasks: [
      { id: 'demo-1', title: 'Pripremiti se za novi tjedan', categoryId: 'work', plannedDate: today, dueDate: null, completedAt: null, pinned: false, version: 1 },
      { id: 'demo-2', title: 'Proći bilješke s predavanja', categoryId: 'learn', plannedDate: today, dueDate: today, completedAt: null, pinned: true, version: 1 },
      { id: 'demo-3', title: 'Dogovoriti termin treninga', categoryId: 'private', plannedDate: null, dueDate: null, completedAt: null, pinned: true, version: 1 },
    ],
    notes: [{ kind: 'note', id: 'demo-note', title: 'Prostor za sljedeću ideju', categoryId: 'learn', pinned: true, archivedAt: null, version: 1,
      body: { type: 'doc', content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Sve što želim sačuvati, na jednom mjestu.' }] },
        { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Isprobati pretvaranje retka u checklistu' }] }] }] },
      ] },
    }],
  }
}
