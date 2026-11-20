const zagrebClock = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Zagreb', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

export function reminderInput(instant: string | null | undefined): string {
  return instant ? zagrebClock.format(new Date(instant)).replace(' ', 'T') : ''
}

export function reminderInstant(input: string): string | null {
  if (!input) return null
  const wallTime = Date.parse(`${input}Z`)
  if (!Number.isFinite(wallTime)) throw new Error('Odaberi valjan datum i vrijeme podsjetnika.')
  // In the autumn overlap use the first occurrence.
  for (const offset of [2, 1]) {
    const instant = new Date(wallTime - offset * 3_600_000).toISOString()
    if (reminderInput(instant) === input) return instant
  }
  throw new Error('To vrijeme ne postoji pri promjeni sata u Zagrebu. Odaberi drugo vrijeme.')
}

export function validTaskId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)
}
