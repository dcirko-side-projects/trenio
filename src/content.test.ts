import { describe, expect, it } from 'vitest'
import { changeNode, checklistItems, contentText, matchesSearch, syncDemo, unlinkTask } from './content'
import { createDemo, planProgress } from './domain'

describe('povezani sadržaj', () => {
  it('dovršavanje u oba smjera čuva istu vezu, a odvajanje posljednje stanje', () => {
    const data = createDemo('2026-10-28')
    const task = data.tasks[0]
    data.notes[0].body = { type: 'doc', content: [{ type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false, taskId: task.id }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Prvi korak' }] }] }] }] }
    const completed = syncDemo(data, 'task', { ...task, completedAt: '2026-10-28T12:00:00Z' })
    expect(planProgress(completed.notes[0].body)?.percent).toBe(100)
    expect(completed.notes[0].version).toBe(data.notes[0].version + 1)
    const step = checklistItems(completed.notes[0].body)[0]
    expect(contentText(step.node)).toBe('Prvi korak')
    const body = changeNode(completed.notes[0].body, step.path, node => { node.attrs!.checked = false })
    const reopened = syncDemo(completed, 'note', { ...completed.notes[0], body })
    expect(reopened.tasks.find(row => row.id === task.id)?.completedAt).toBeNull()
    expect(reopened.tasks).toHaveLength(data.tasks.length)
    expect(checklistItems(unlinkTask(completed.notes[0].body, task.id))[0].node.attrs).toEqual({ checked: true, taskId: null })
    expect(checklistItems(data.notes[0].body)[0].node.attrs?.checked).toBe(false)
  })
  it('pretraga zanemaruje veličinu slova i dijakritiku te traži sve riječi', () => {
    expect(matchesSearch('UCENJE čaj', 'Učenje', 'Plan za čaj')).toBe(true)
    expect(matchesSearch('ucenje drugi', 'Učenje', 'Plan za čaj')).toBe(false)
    expect(matchesSearch('  ', 'Sve')).toBe(true)
    expect(matchesSearch('C++ [x]', 'C++ [x]')).toBe(true)
    expect(matchesSearch('DOGADAJ', 'Događaj')).toBe(true)
    expect(matchesSearch('ucenje', contentText({ type: 'paragraph', content: [{ type: 'text', text: 'Uče' }, { type: 'text', text: 'nje', marks: [{ type: 'bold' }] }] }))).toBe(true)
  })
})
