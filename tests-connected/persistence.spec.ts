import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { changeNode, checklistItems, contentText } from '../src/content'
import type { Note } from '../src/domain'

type Row = { id: string; title: string; owner_id: string; planned_date: string | null; due_date: string | null; category_id: string | null; completed_at: string | null; pinned: boolean; version: number }
type NoteRow = { id: string; title: string; owner_id: string; category_id: string | null; body: unknown; archived_at: string | null; pinned: boolean; version: number }

// Synthetic identities and responses, intercepted locally. No real Supabase requests.
async function setupBackend(page: Page) {
  const state = { tasks: [] as Row[], notes: [] as NoteRow[], categories: [] as { id: string; name: string; parent_id?: string | null; icon?: string; color?: string; sort_order?: number; version?: number }[], rejectWrite: false, failReadAfterWrite: false, readFailure: false, writeGate: null as Promise<void> | null }
  const user = { id: '10000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'owner@example.invalid', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
  const expiry = Math.floor(Date.now() / 1000) + 3600
  const token = [
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
    Buffer.from(JSON.stringify({ sub: user.id, exp: expiry, role: user.role, aud: user.aud })).toString('base64url'),
    'test-signature',
  ].join('.')
  await page.route('http://127.0.0.1:54329/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
    const reply = (json: unknown, status = 200) => route.fulfill({ status, json, headers })
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    if (url.pathname === '/auth/v1/token') return reply({ access_token: token, refresh_token: 'synthetic-refresh', token_type: 'bearer', expires_in: 3600, expires_at: expiry, user })
    if (url.pathname === '/auth/v1/user') return reply(user)
    if (url.pathname === '/rest/v1/rpc/is_app_owner') return reply(true)
    if (url.pathname === '/rest/v1/rpc/save_category') {
      if (state.writeGate) await state.writeGate
      if (state.rejectWrite) return reply({ code: '503' }, 503)
      const payload = request.postDataJSON()
      const index = state.categories.findIndex(row => row.id === payload.target_id)
      if (index >= 0 && (state.categories[index].version ?? 1) !== payload.expected_version) return reply({ code: '40001' }, 409)
      const row = { id: payload.target_id, name: payload.category_name, parent_id: payload.parent, icon: payload.category_icon, color: payload.category_color, sort_order: payload.target_position, version: payload.expected_version + 1 }
      if (index >= 0) state.categories[index] = row
      else state.categories.push(row)
      if (state.failReadAfterWrite) state.readFailure = true
      return reply(null)
    }
    if (url.pathname === '/rest/v1/rpc/create_linked_task') {
      if (state.writeGate) await state.writeGate
      if (state.rejectWrite) return reply({ code: '503', message: 'Synthetic link failure' }, 503)
      const payload = request.postDataJSON() as { note_id: string; expected_version: number; draft: Note; item_path: number[]; task_id: string }
      const index = state.notes.findIndex(row => row.id === payload.note_id && row.version === payload.expected_version)
      if (index < 0) return reply({ code: '40001', message: 'Stale source' }, 409)
      const step = checklistItems(payload.draft.body).find(step => step.path.join('.') === payload.item_path.join('.'))!
      const body = changeNode(payload.draft.body, payload.item_path, node => { node.attrs = { ...node.attrs, taskId: payload.task_id } })
      state.notes[index] = { ...state.notes[index], body, title: payload.draft.title, version: payload.expected_version + 1 }
      state.tasks.push({ id: payload.task_id, owner_id: user.id, category_id: payload.draft.categoryId, title: contentText(step.node), planned_date: null, due_date: null, completed_at: null, pinned: false, version: 1 })
      return reply(payload.task_id)
    }
    if (url.pathname === '/rest/v1/tasks') {
      if (request.method() === 'GET') {
        if (state.readFailure) return reply({ code: '42501', message: 'Synthetic read failure' }, 403)
        return reply(state.tasks)
      }
      if (state.rejectWrite) return reply({ code: 'unavailable', message: 'Synthetic write failure' }, 503)
      if (request.method() === 'POST') {
        const row = { ...request.postDataJSON(), version: 1 } as Row
        state.tasks.push(row)
        if (state.failReadAfterWrite) state.readFailure = true
        return reply({ id: row.id }, 201)
      }
      if (request.method() === 'PATCH') {
        const id = url.searchParams.get('id')?.replace('eq.', '')
        const version = Number(url.searchParams.get('version')?.replace('eq.', ''))
        const index = state.tasks.findIndex(task => task.id === id && task.version === version)
        if (index < 0) return reply(null)
        state.tasks[index] = { ...state.tasks[index], ...request.postDataJSON(), version: version + 1 }
        return reply({ id })
      }
    }
    if (url.pathname === '/rest/v1/notes') {
      if (request.method() === 'GET') return reply(state.notes)
      if (state.writeGate) await state.writeGate
      if (state.rejectWrite) return reply({ message: 'Synthetic write failure' }, 503)
      if (request.method() === 'POST') {
        const row = { ...request.postDataJSON(), version: 1 } as NoteRow
        state.notes.push(row)
        return reply({ id: row.id }, 201)
      }
      if (request.method() === 'PATCH') {
        const id = url.searchParams.get('id')?.replace('eq.', '')
        const version = Number(url.searchParams.get('version')?.replace('eq.', ''))
        const index = state.notes.findIndex(note => note.id === id && note.version === version)
        if (index < 0) return reply(null)
        state.notes[index] = { ...state.notes[index], ...request.postDataJSON(), version: version + 1 }
        return reply({ id })
      }
    }
    if (url.pathname === '/rest/v1/categories') {
      if (request.method() === 'GET') return reply(state.categories)
      if (request.method() === 'POST') {
        state.categories.push(request.postDataJSON())
        if (state.failReadAfterWrite) state.readFailure = true
        return reply(null, 201)
      }
    }
    throw new Error(`Unexpected backend request: ${request.method()} ${url.pathname}`)
  })
  await page.goto('/')
  await page.getByLabel('Email', { exact: true }).fill(user.email)
  await page.getByLabel('Lozinka', { exact: true }).fill('synthetic-test-password')
  await page.getByRole('button', { name: 'Prijavi se', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Tvoj prostor za danas.' })).toBeVisible()
  await expect(page.getByText('Učitavanje podataka…')).toHaveCount(0)
  return state
}

test('spremljeni zadatak se ponovno učita, a zastarjela izmjena čuva unos', async ({ page }) => {
  const state = await setupBackend(page)
  await page.getByRole('button', { name: 'Dodaj zadatak', exact: true }).click()
  await page.getByLabel('Naziv zadatka').fill('Spremljeno u bazu')
  await page.getByRole('button', { name: 'Spremi', exact: true }).click()
  await expect(page.getByText('Spremljeno u bazu', { exact: true })).toBeVisible()
  await page.reload()
  await page.getByText('Spremljeno u bazu', { exact: true }).click()
  state.tasks[0] = { ...state.tasks[0], title: 'Novija izmjena', version: 2 }
  await page.getByLabel('Naziv zadatka').fill('Moj nespremljeni unos')
  await page.getByRole('button', { name: 'Spremi', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('promijenjena na drugom uređaju')
  await expect(page.getByLabel('Naziv zadatka')).toHaveValue('Moj nespremljeni unos')
  expect(state.tasks[0].title).toBe('Novija izmjena')
})

test('uspješan zapis s greškom naknadnog dohvata zadržava upozorenje', async ({ page }) => {
  const state = await setupBackend(page)
  state.failReadAfterWrite = true
  await page.getByRole('button', { name: 'Dodaj zadatak', exact: true }).click()
  await page.getByLabel('Naziv zadatka').fill('Uspješno zapisano')
  await page.getByRole('button', { name: 'Spremi', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('spremljena, ali prikaz nije osvježen')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(state.tasks).toHaveLength(1)
})

test('greška zapisa čuva tekst i omogućuje ponovni pokušaj', async ({ page }) => {
  const state = await setupBackend(page)
  state.rejectWrite = true
  await page.getByRole('button', { name: 'Dodaj zadatak', exact: true }).click()
  await page.getByLabel('Naziv zadatka').fill('Sačuvaj moj tekst')
  await page.getByRole('button', { name: 'Spremi', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Spremanje nije uspjelo')
  await expect(page.getByLabel('Naziv zadatka')).toHaveValue('Sačuvaj moj tekst')
  state.rejectWrite = false
  await page.getByRole('button', { name: 'Spremi', exact: true }).click()
  await expect(page.getByText('Sačuvaj moj tekst', { exact: true })).toBeVisible()
  expect(state.tasks).toHaveLength(1)
})

test('izvoz dohvaća svježe podatke i uključuje arhivu', async ({ page }) => {
  const state = await setupBackend(page)
  state.tasks.push({ id: '30000000-0000-4000-8000-000000000001', owner_id: '10000000-0000-4000-8000-000000000001', title: 'U međuvremenu dovršeno', planned_date: null, due_date: null, category_id: null, completed_at: '2026-10-26T12:00:00Z', pinned: false, version: 2 })
  await page.locator('summary[aria-label="Više mogućnosti"]').click()
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Izvezi podatke', exact: true }).click()
  const download = await downloadEvent
  const payload = JSON.parse(await readFile((await download.path())!, 'utf8'))
  expect(payload.demo).toBe(false)
  expect(payload.tasks[0].title).toBe('U međuvremenu dovršeno')
  expect(payload.tasks[0].completedAt).toBe('2026-10-26T12:00:00Z')
})

test('neuspješan dohvat ne stvara praznu sigurnosnu kopiju', async ({ page }) => {
  const state = await setupBackend(page)
  state.readFailure = true
  let downloaded = false
  page.on('download', () => { downloaded = true })
  await page.locator('summary[aria-label="Više mogućnosti"]').click()
  await page.getByRole('button', { name: 'Izvezi podatke', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Podaci nisu učitani')
  expect(downloaded).toBe(false)
})

test('prekid veze u editoru prikazuje upozorenje i čuva unos do ponovnog pokušaja', async ({ page, context }) => {
  const state = await setupBackend(page)
  await page.getByRole('button', { name: 'Dodaj zadatak', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Zadatak', exact: true })
  await dialog.getByLabel('Naziv zadatka').fill('Unos tijekom prekida veze')
  await context.setOffline(true)
  await expect(dialog.getByRole('status')).toContainText('Nema internetske veze')
  // Route interception models a failed write; the offline event itself comes from the browser.
  state.rejectWrite = true
  await dialog.getByRole('button', { name: 'Spremi', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('Spremanje nije uspjelo')
  await expect(dialog.getByLabel('Naziv zadatka')).toHaveValue('Unos tijekom prekida veze')
  expect(state.tasks).toHaveLength(0)
  state.rejectWrite = false
  await context.setOffline(false)
  await expect(dialog.getByText('Nema internetske veze', { exact: false })).toHaveCount(0)
  await expect(dialog.getByLabel('Naziv zadatka')).toHaveValue('Unos tijekom prekida veze')
  await dialog.getByRole('button', { name: 'Spremi', exact: true }).click()
  await expect(page.getByText('Unos tijekom prekida veze', { exact: true })).toBeVisible()
  expect(state.tasks).toHaveLength(1)
})

test('bilješka se zaključava tijekom sporog spremanja i otključava nakon greške', async ({ page }) => {
  const state = await setupBackend(page)
  await page.getByRole('button', { name: 'Nova bilješka', exact: true }).click()
  const body = page.getByRole('textbox', { name: 'Sadržaj bilješke' })
  await expect(body).toBeVisible()
  await expect(page.getByText('Bez nespremljenih promjena', { exact: true })).toBeVisible()
  await page.getByLabel('Naslov bilješke').fill('Spori zapis')
  await body.fill('Sačuvani tekst')
  let release!: () => void
  state.writeGate = new Promise<void>(resolve => { release = resolve })
  state.rejectWrite = true
  await page.getByRole('button', { name: 'Spremi', exact: true }).click()
  await expect(body).toHaveAttribute('contenteditable', 'false')
  await expect(page.getByRole('button', { name: 'Spremanje…', exact: true })).toBeDisabled()
  release()
  await expect(page.getByRole('alert')).toContainText('Spremanje nije uspjelo')
  await expect(body).toHaveAttribute('contenteditable', 'true')
  await expect(body).toContainText('Sačuvani tekst')
  await body.fill('Ispravljeni tekst')
  state.rejectWrite = false
  await page.getByRole('button', { name: 'Spremi', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(state.notes).toHaveLength(1)
  expect(JSON.stringify(state.notes[0].body)).toContain('Ispravljeni tekst')
})

test('sukob verzija bilješke čuva lokalni tekst i noviji zapis', async ({ page }) => {
  const state = await setupBackend(page)
  await page.getByRole('button', { name: 'Nova bilješka', exact: true }).click()
  await page.getByLabel('Naslov bilješke').fill('Zajednička bilješka')
  await page.getByRole('textbox', { name: 'Sadržaj bilješke' }).fill('Početni tekst')
  await page.getByRole('checkbox', { name: 'Prikvači u Trenutno', exact: true }).check()
  await page.getByRole('button', { name: 'Spremi', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Trenutno', exact: true }).click()
  await page.getByRole('button', { name: /Zajednička bilješka/ }).click()
  state.notes[0] = { ...state.notes[0], title: 'Novija bilješka', version: 2 }
  await page.getByRole('textbox', { name: 'Sadržaj bilješke' }).fill('Lokalni nespremljeni tekst')
  await page.getByRole('button', { name: 'Spremi', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('promijenjena na drugom uređaju')
  await expect(page.getByRole('textbox', { name: 'Sadržaj bilješke' })).toContainText('Lokalni nespremljeni tekst')
  expect(state.notes[0].title).toBe('Novija bilješka')
  expect(state.notes[0].version).toBe(2)
})

test('spremljena kategorija s greškom dohvata ostavlja vidljivo upozorenje', async ({ page }) => {
  const state = await setupBackend(page)
  state.failReadAfterWrite = true
  await page.getByRole('navigation', { name: 'Mobilna navigacija' }).getByRole('button', { name: 'Kategorije', exact: true }).click()
  await page.getByRole('button', { name: 'Nova kategorija', exact: true }).click()
  await page.getByRole('dialog').getByLabel('Naziv', { exact: true }).fill('Spremljena kategorija')
  await page.getByRole('button', { name: 'Dodaj', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('status')).toContainText('spremljena, ali prikaz nije osvježen')
  expect(state.categories).toHaveLength(1)
  state.readFailure = false
  await page.getByLabel('Više mogućnosti', { exact: true }).click()
  await page.getByRole('button', { name: 'Osvježi', exact: true }).click()
  await expect(page.getByRole('button', { name: /Spremljena kategorija/ })).toBeVisible()
  expect(state.categories).toHaveLength(1)
})

test('povratak u vidljivu aplikaciju dohvaća promjene i zadržava otvoreni unos', async ({ page }) => {
  const state = await setupBackend(page)
  await page.getByRole('button', { name: 'Dodaj zadatak', exact: true }).click()
  await page.getByLabel('Naziv zadatka').fill('Moj otvoreni unos')
  state.tasks.push({ id: '30000000-0000-4000-8000-000000000002', owner_id: '10000000-0000-4000-8000-000000000001', title: 'Promjena s drugog uređaja', planned_date: '2020-01-01', due_date: null, category_id: null, completed_at: null, pinned: false, version: 1 })
  const refreshed = page.waitForResponse(response => response.url().includes('/rest/v1/tasks') && response.request().method() === 'GET')
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await refreshed
  await expect(page.getByLabel('Naziv zadatka')).toHaveValue('Moj otvoreni unos')
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Zatvori uređivanje' }).click()
  await expect(page.getByText('Promjena s drugog uređaja', { exact: true })).toBeVisible()
})

test('plan se sprema kao plan, ponovno dohvaća i izvozi bez gubitka vrste', async ({ page }) => {
  const state = await setupBackend(page)
  await page.getByRole('button', { name: 'Novi plan', exact: true }).click()
  await page.getByLabel('Naziv plana').fill('Trajni plan')
  await page.getByRole('textbox', { name: 'Sadržaj plana' }).fill('Opis bez koraka')
  await page.getByRole('checkbox', { name: 'Prikvači u Trenutno', exact: true }).check()
  await page.getByRole('button', { name: 'Spremi', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(state.notes[0]).toHaveProperty('kind', 'plan')
  await page.reload()
  await expect(page.getByText('Učitavanje podataka…')).toHaveCount(0)
  await page.getByRole('button', { name: 'Trenutno', exact: true }).click()
  await page.getByRole('region', { name: 'Planovi', exact: true }).getByRole('button', { name: /Trajni plan/ }).click()
  await expect(page.getByRole('textbox', { name: 'Sadržaj plana' })).toContainText('Opis bez koraka')
  await expect(page.getByRole('progressbar')).toHaveCount(0)
  await page.getByRole('button', { name: 'Zatvori uređivanje' }).click()
  await page.getByLabel('Više mogućnosti', { exact: true }).click()
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Izvezi podatke', exact: true }).click()
  const download = await downloadEvent
  const payload = JSON.parse(await readFile((await download.path())!, 'utf8'))
  expect(payload.formatVersion).toBe(5)
  expect(payload.notes[0].kind).toBe('plan')
})

test('spremljena ideja otvara odabranu kategoriju, a greška ne daje lažnu potvrdu', async ({ page }) => {
  const state = await setupBackend(page)
  state.categories.push({ id: '20000000-0000-4000-8000-000000000001', name: 'Moji projekti' })
  await page.reload()
  await page.getByRole('button', { name: 'Nova ideja', exact: true }).click()
  await page.getByLabel('Naziv ideje').fill('Ideja koju mogu pronaći')
  await page.getByLabel('Kategorija', { exact: true }).selectOption(state.categories[0].id)
  state.rejectWrite = true
  await page.getByRole('button', { name: 'Spremi', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Spremanje nije uspjelo')
  await expect(page.getByRole('button', { name: /^Otvori kategoriju:/ })).toHaveCount(0)
  expect(state.notes).toHaveLength(0)
  state.rejectWrite = false
  await page.getByRole('button', { name: 'Spremi', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Spremljeno u kategoriju „Moji projekti”.')
  await page.getByRole('button', { name: 'Otvori kategoriju: Moji projekti', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Moji projekti', exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Ideje', exact: true }).getByRole('button', { name: /Ideja koju mogu pronaći/ })).toBeVisible()
  expect(state.notes).toHaveLength(1)
})

test('pretvorba ideje čuva isti zapis i nespremljeni opis, a greška omogućuje ponovni pokušaj', async ({ page }) => {
  const state = await setupBackend(page)
  state.categories.push({ id: '20000000-0000-4000-8000-000000000001', name: 'Ideje' })
  await page.reload()
  await page.getByRole('button', { name: 'Nova ideja', exact: true }).click()
  await page.getByLabel('Naziv ideje').fill('Trajna ideja')
  await page.getByLabel('Kategorija', { exact: true }).selectOption(state.categories[0].id)
  await page.getByRole('checkbox', { name: 'Prikvači u Trenutno', exact: true }).check()
  await page.getByRole('button', { name: 'Spremi', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const original = structuredClone(state.notes[0])
  await page.getByRole('button', { name: 'Trenutno', exact: true }).click()
  await page.getByRole('region', { name: 'Ideje', exact: true }).getByRole('button', { name: /Trajna ideja/ }).click()
  await page.getByRole('textbox', { name: 'Sadržaj ideje' }).fill('Opis unesen prije pretvorbe')
  state.rejectWrite = true
  await page.getByRole('button', { name: 'Pretvori u plan', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Spremanje nije uspjelo')
  expect(state.notes[0]).toEqual(original)
  await expect(page.getByRole('textbox', { name: 'Sadržaj ideje' })).toContainText('Opis unesen prije pretvorbe')
  state.rejectWrite = false
  await page.getByRole('button', { name: 'Pretvori u plan', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(state.notes).toHaveLength(1)
  expect(state.notes[0]).toMatchObject({ ...original, kind: 'plan', version: 2, body: expect.any(Object) })
  expect(JSON.stringify(state.notes[0].body)).toContain('Opis unesen prije pretvorbe')
  await page.reload()
  await page.getByRole('button', { name: 'Trenutno', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Ideje', exact: true })).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Planovi', exact: true }).getByRole('button', { name: /Trajna ideja/ })).toBeVisible()
})

test('zastarjela pretvorba ne prepisuje noviju ideju i čuva lokalni unos', async ({ page }) => {
  const state = await setupBackend(page)
  await page.getByRole('button', { name: 'Nova ideja', exact: true }).click()
  await page.getByLabel('Naziv ideje').fill('Moja ideja')
  await page.getByRole('checkbox', { name: 'Prikvači u Trenutno', exact: true }).check()
  await page.getByRole('button', { name: 'Spremi', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Trenutno', exact: true }).click()
  await page.getByRole('button', { name: /Moja ideja/ }).click()
  state.notes[0] = { ...state.notes[0], title: 'Novija ideja', version: 2 }
  const newer = structuredClone(state.notes[0])
  await page.getByRole('textbox', { name: 'Sadržaj ideje' }).fill('Lokalni opis')
  await page.getByRole('button', { name: 'Pretvori u plan', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('promijenjena na drugom uređaju')
  await expect(page.getByRole('textbox', { name: 'Sadržaj ideje' })).toContainText('Lokalni opis')
  expect(state.notes[0]).toEqual(newer)
})

test('neuspješno povezivanje čuva unos i zaključava editor; ponovni pokušaj stvara jednu vezu', async ({ page }) => {
  const state = await setupBackend(page)
  await page.getByRole('button', { name: 'Novi plan', exact: true }).click()
  await page.getByLabel('Naziv plana').fill('Plan s vezom')
  await page.getByRole('textbox', { name: 'Sadržaj plana' }).fill('Moj korak')
  await page.getByRole('button', { name: 'Pretvori redak u korak plana' }).click()
  await page.getByRole('checkbox', { name: 'Prikvači u Trenutno', exact: true }).check()
  await page.getByRole('button', { name: 'Spremi', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Trenutno', exact: true }).click()
  await page.getByRole('button', { name: /Plan s vezom/ }).click()
  await page.getByLabel('Naziv plana').fill('Plan s lokalnom izmjenom')
  let release!: () => void
  state.writeGate = new Promise(resolve => { release = resolve })
  state.rejectWrite = true
  await page.getByRole('button', { name: 'Stvori povezani zadatak', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Sadržaj plana' })).toHaveAttribute('contenteditable', 'false')
  release()
  await expect(page.getByRole('alert')).toContainText('Povezivanje nije uspjelo')
  await expect(page.getByLabel('Naziv plana')).toHaveValue('Plan s lokalnom izmjenom')
  expect(state.tasks).toHaveLength(0)
  state.rejectWrite = false
  state.writeGate = null
  await page.getByRole('button', { name: 'Stvori povezani zadatak', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Otvori povezani zadatak', exact: true })).toBeVisible()
  expect(state.tasks).toHaveLength(1)
  expect(state.notes[0].title).toBe('Plan s lokalnom izmjenom')
  expect(state.notes[0].version).toBe(2)
  await page.reload()
  await page.getByRole('button', { name: 'Trenutno', exact: true }).click()
  await page.getByRole('button', { name: /Plan s lokalnom izmjenom/ }).click()
  await expect(page.getByRole('button', { name: 'Otvori povezani zadatak', exact: true })).toBeVisible()
})


test('kategorija čuva ikonu i boju nakon greške i učitavanja; sukob verzije čuva unos', async ({ page }) => {
  const state = await setupBackend(page)
  await page.getByRole('navigation', { name: 'Mobilna navigacija' }).getByRole('button', { name: 'Kategorije', exact: true }).click()
  await page.getByRole('button', { name: 'Nova kategorija', exact: true }).click()
  const form = page.getByRole('dialog')
  await form.getByLabel('Naziv', { exact: true }).fill('Kategorija test')
  await form.locator('summary').click()
  await form.getByLabel('Pretraži ikone').fill('programiranje')
  await form.getByRole('button', { name: 'Ikona: Programiranje', exact: true }).click()
  await form.getByRole('button', { name: 'Boja: Ljubičasta', exact: true }).click()
  state.rejectWrite = true
  await form.getByRole('button', { name: 'Dodaj', exact: true }).click()
  await expect(form.getByRole('alert')).toContainText('Unos je sačuvan')
  await expect(form.getByLabel('Naziv', { exact: true })).toHaveValue('Kategorija test')
  await expect(form.locator('summary')).toContainText('Programiranje')
  expect(state.categories).toHaveLength(0)
  state.rejectWrite = false
  await form.getByRole('button', { name: 'Dodaj', exact: true }).click()
  await expect(form).not.toBeVisible()
  expect(state.categories[0]).toMatchObject({ icon: 'code', color: '#D5BBE9', parent_id: null })
  await page.reload()
  await page.getByRole('navigation', { name: 'Mobilna navigacija' }).getByRole('button', { name: 'Kategorije', exact: true }).click()
  await page.getByRole('button', { name: /^Kategorija test/ }).click()
  await page.getByRole('button', { name: 'Uredi kategoriju', exact: true }).click()
  await expect(form.locator('summary')).toContainText('Programiranje')
  await expect(form.getByRole('button', { name: 'Boja: Ljubičasta' })).toHaveAttribute('aria-pressed', 'true')
  state.categories[0].version = 2
  state.categories[0].name = 'Noviji naziv kategorije'
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect(page.locator('h1')).toHaveText('Noviji naziv kategorije')
  await form.getByLabel('Naziv', { exact: true }).fill('Moj nespremljeni naziv')
  await form.getByRole('button', { name: 'Spremi', exact: true }).click()
  await expect(form.getByRole('alert')).toContainText('drugom uređaju')
  await expect(form.getByLabel('Naziv', { exact: true })).toHaveValue('Moj nespremljeni naziv')
  expect(state.categories[0].name).toBe('Noviji naziv kategorije')
})
