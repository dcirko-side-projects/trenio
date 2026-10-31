import { describe, expect, it } from 'vitest'
import { createDemo, isTodayTask, planProgress, safeLink, taskGroup, todayInZagreb } from './domain'

describe('kalendarski dan i Danas', () => {
  const today = '2026-10-25'
  const base = createDemo(today).tasks[0]
  it('računa zagrebački dan preko UTC ponoći i promjene sata', () => {
    expect(todayInZagreb(new Date('2026-10-24T22:30:00Z'))).toBe(today)
    expect(todayInZagreb(new Date('2026-10-25T23:30:00Z'))).toBe('2026-10-26')
  })
  it('prikazuje ranije planirane zadatke bez mijenjanja datuma', () => {
    const task = { ...base, plannedDate: '2026-10-24' }
    expect(isTodayTask(task, today)).toBe(true)
    expect(taskGroup(task, today)).toBe('Ranije planirano')
    expect(task.plannedDate).toBe('2026-10-24')
  })
  it('istekli rok ima prednost pred budućim planiranim danom', () => {
    const task = { ...base, plannedDate: '2026-10-28', dueDate: '2026-10-24' }
    expect(isTodayTask(task, today)).toBe(true)
    expect(taskGroup(task, today)).toBe('Rok je prošao')
  })
  it('dovršeni, budući i nedatirani zadaci nisu u Danas', () => {
    expect(isTodayTask({ ...base, completedAt: '2026-10-25T12:00:00Z' }, today)).toBe(false)
    expect(isTodayTask({ ...base, plannedDate: '2026-10-26' }, today)).toBe(false)
    expect(isTodayTask({ ...base, plannedDate: null }, today)).toBe(false)
  })
})

describe('linkovi bilješki', () => {
  it('dopušta web i email, a odbija izvršivi sadržaj i relativne adrese', () => {
    expect(safeLink('https://example.com')).toBe(true)
    expect(safeLink('mailto:hello@example.com')).toBe(true)
    expect(safeLink('javascript:alert(1)')).toBe(false)
    expect(safeLink('data:text/html,test')).toBe(false)
    expect(safeLink('/relative')).toBe(false)
  })
})

describe('napredak plana', () => {
  it('ne izmišlja postotak za tekst bez koraka', () => {
    expect(planProgress({ type: 'doc', content: [{ type: 'paragraph' }] })).toBeNull()
  })
  it('broji samo checkbox korake, uključujući sve liste u dokumentu', () => {
    expect(planProgress({ type: 'doc', content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Opis' }] },
      { type: 'taskList', content: [
        { type: 'taskItem', attrs: { checked: true } },
        { type: 'taskItem', attrs: { checked: false } },
        { type: 'taskItem', attrs: { checked: false } },
      ] },
    ] })).toEqual({ done: 1, total: 3, percent: 33 })
    expect(planProgress({ type: 'doc', content: [{ type: 'taskItem', attrs: { checked: true } }] })?.percent).toBe(100)
  })
})
