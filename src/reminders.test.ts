import { describe, expect, it, vi } from 'vitest'
import workerCode from '../public/task-push-sw.js?raw'
import { reminderInput, reminderInstant } from './reminders'

describe('push podsjetnik', () => {
  it('pretvara lokalno vrijeme Zagreba u UTC i vraća ga u polje', () => {
    const input = '2026-11-25T09:30'
    expect(reminderInstant(input)).toBe('2026-11-25T08:30:00.000Z')
    expect(reminderInput(reminderInstant(input))).toBe(input)
    expect(reminderInstant('')).toBeNull()
  })

  it('odbija nepostojeće proljetno vrijeme i bira prvu pojavu jesenskog sata', () => {
    expect(() => reminderInstant('2026-03-29T02:15')).toThrow('To vrijeme ne postoji')
    expect(reminderInstant('2026-10-25T02:15')).toBe('2026-10-25T00:15:00.000Z')
  })

  it('prikazuje naziv zadatka i otvara taj zadatak iz obavijesti', async () => {
    const events: Record<string, (event: unknown) => void> = {}
    const showNotification = vi.fn().mockResolvedValue(undefined)
    const openWindow = vi.fn().mockResolvedValue(undefined)
    new Function('self', workerCode)({
      addEventListener: (type: string, handler: (event: unknown) => void) => { events[type] = handler },
      registration: { showNotification },
      clients: { matchAll: async () => [], openWindow },
    })
    const taskId = '10000000-0000-4000-8000-000000000001'
    let completion: Promise<unknown> | undefined
    const waitUntil = (operation: Promise<unknown>) => { completion = operation }
    events.push({ waitUntil, data: { json: () => ({ taskId, title: 'Kupi kruh', remindAt: '2026-11-25T08:30:00Z' }) } })
    await completion
    expect(showNotification).toHaveBeenCalledWith('Kupi kruh', expect.objectContaining({ data: { taskId } }))
    for (const [kind, body] of [
      ['before_due', 'Trenio · Rok je za tri dana'],
      ['due_today', 'Trenio · Rok je danas'],
      ['overdue', 'Trenio · Rok je istekao'],
    ]) {
      events.push({ waitUntil, data: { json: () => ({ taskId, title: 'Kupi kruh', kind }) } })
      await completion
      expect(showNotification).toHaveBeenLastCalledWith('Kupi kruh', expect.objectContaining({ body }))
    }
    const close = vi.fn()
    events.notificationclick({ waitUntil, notification: { data: { taskId }, close } })
    await completion
    expect(close).toHaveBeenCalledOnce()
    expect(openWindow).toHaveBeenCalledWith(`/#task=${taskId}`)
  })
})
