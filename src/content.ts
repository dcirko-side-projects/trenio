import type { JSONContent } from '@tiptap/react'
import type { Data, Note, Task } from './domain'

export function contentText(node: JSONContent): string {
  if (node.type === 'text') return node.text ?? ''
  if (node.type === 'hardBreak') return '\n'
  return (node.content ?? []).map(contentText).join(['paragraph', 'heading', 'codeBlock'].includes(node.type ?? '') ? '' : ' ')
}

export function checklistItems(body: JSONContent): { node: JSONContent; path: number[] }[] {
  const items: { node: JSONContent; path: number[] }[] = []
  const visit = (node: JSONContent, path: number[]) => {
    if (node.type === 'taskItem') items.push({ node, path })
    node.content?.forEach((child, index) => visit(child, [...path, index]))
  }
  visit(body, [])
  return items
}

export function changeNode(body: JSONContent, path: number[], change: (node: JSONContent) => void): JSONContent {
  const next = structuredClone(body)
  let node = next
  for (const index of path) node = node.content![index]
  change(node)
  return next
}

export function syncDemo(data: Data, kind: 'task' | 'note', item: Task | Note): Data {
  let next = structuredClone(data)
  if (kind === 'task') {
    const task = item as Task
    next.tasks = next.tasks.filter(row => row.id !== task.id).concat({ ...task, version: task.version + 1 })
    next.notes = next.notes.map(note => {
      let changed = false
      let body = note.body
      for (const step of checklistItems(body)) if (step.node.attrs?.taskId === task.id && Boolean(step.node.attrs.checked) !== Boolean(task.completedAt)) {
        body = changeNode(body, step.path, node => { node.attrs = { ...node.attrs, checked: Boolean(task.completedAt) } })
        changed = true
      }
      return changed ? { ...note, body, version: note.version + 1 } : note
    })
  } else {
    const note = item as Note
    next.notes = next.notes.filter(row => row.id !== note.id).concat({ ...note, version: note.version + 1 })
    for (const { node } of checklistItems(note.body)) {
      next = { ...next, tasks: next.tasks.map(task => task.id === node.attrs?.taskId && Boolean(task.completedAt) !== Boolean(node.attrs?.checked)
        ? { ...task, completedAt: node.attrs?.checked ? new Date().toISOString() : null, version: task.version + 1 } : task) }
    }
  }
  return next
}

export function unlinkTask(body: JSONContent, id: string): JSONContent {
  let next = body
  for (const step of checklistItems(body)) if (step.node.attrs?.taskId === id) next = changeNode(next, step.path, node => { node.attrs = { ...node.attrs, taskId: null } })
  return next
}

const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('hr').replaceAll('đ', 'd')
export function matchesSearch(query: string, ...values: string[]): boolean {
  const haystack = normalize(values.join(' '))
  return normalize(query).trim().split(/\s+/).filter(Boolean).every(word => haystack.includes(word))
}
