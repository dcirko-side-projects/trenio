import { describe, expect, it } from 'vitest'
import type { Data } from './domain'
import { createDemo } from './domain'
import { createBackup, parseBackup, recoverySql } from './backup'

const categoryId = '20000000-0000-4000-8000-000000000001'
const data: Data = {
  categories: [{ id: categoryId, name: 'Privatno' }],
  tasks: [{ id: '30000000-0000-4000-8000-000000000001', title: 'Dovršeni zadatak', categoryId, plannedDate: '2026-10-26', dueDate: null, completedAt: '2026-10-26T12:00:00Z', pinned: true, version: 3 }],
  notes: [{ kind: 'note', id: '40000000-0000-4000-8000-000000000001', title: 'Bilješka', categoryId, archivedAt: '2026-10-26T12:00:00Z', pinned: true, version: 2, body: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: "Privatni tekst ' ; drop table tasks; --" }] }] } }],
}
const backup = () => createBackup(structuredClone(data), false, new Date('2026-10-26T12:00:00Z'))

describe('sigurnosna kopija', () => {
  it('čita staru kopiju kao bilješke i čuva vrstu plana u novom formatu', () => {
    const old = JSON.parse(JSON.stringify(backup()))
    old.formatVersion = 1
    delete old.notes[0].kind
    expect(parseBackup(JSON.stringify(old)).notes[0].kind).toBe('note')
    const next = backup(); next.notes[0].kind = 'plan'
    const restored = parseBackup(JSON.stringify(next))
    expect(restored.formatVersion).toBe(5)
    expect(restored.notes[0].kind).toBe('plan')
    expect(recoverySql(restored)).toContain("restored.kind is distinct from row->>'kind'")
    const invalid = JSON.parse(JSON.stringify(next)); invalid.notes[0].kind = 'unknown'
    expect(() => parseBackup(JSON.stringify(invalid))).toThrow()
    delete invalid.notes[0].kind
    expect(() => parseBackup(JSON.stringify(invalid))).toThrow()
  })
  it('čita format 2 i čuva ideju s opisom i arhivom u formatu 3', () => {
    const legacy = { ...backup(), formatVersion: 2 }
    expect(parseBackup(JSON.stringify(legacy)).notes).toEqual(data.notes)
    const next = backup(); next.notes[0].kind = 'idea'
    expect(parseBackup(JSON.stringify(next)).notes).toEqual(next.notes)
    expect(recoverySql(next)).toContain('"kind":"idea"')
    expect(() => parseBackup(JSON.stringify({ ...next, formatVersion: 2 }))).toThrow()
  })
  it('čuva arhivu, datume, verzije i formatirani sadržaj u povratnoj pretvorbi', () => {
    const restored = parseBackup(JSON.stringify(backup()))
    expect(restored.tasks).toEqual(data.tasks)
    expect(restored.notes).toEqual(data.notes)
    expect(restored.categories).toEqual(data.categories.map((row, index) => ({ parentId: null, icon: 'folder', color: '#B4D6D3', sortOrder: index, version: 1, ...row })))
  })
  it('čuva vezu checkboxa i zadatka, odbija siročad, duplikate i različita stanja', () => {
    const next = backup()
    const step = { type: 'taskItem', attrs: { taskId: next.tasks[0].id, checked: true }, content: [{ type: 'paragraph' }] }
    next.notes[0].body = { type: 'doc', content: [{ type: 'taskList', content: [step] }] }
    expect(parseBackup(JSON.stringify(next)).notes[0].body).toEqual(next.notes[0].body)
    expect(recoverySql(next)).toContain(next.tasks[0].id)
    expect(() => parseBackup(JSON.stringify({ ...next, formatVersion: 3 }))).toThrow()
    const orphan = structuredClone(next); orphan.tasks = []
    expect(() => parseBackup(JSON.stringify(orphan))).toThrow('vezu zadatka')
    const mismatch = structuredClone(next); mismatch.tasks[0].completedAt = null
    expect(() => parseBackup(JSON.stringify(mismatch))).toThrow('vezu zadatka')
    next.notes[0].body.content![0].content!.push(step)
    expect(() => parseBackup(JSON.stringify(next))).toThrow()
  })
  it('odbija oštećen JSON i nepodržanu verziju formata', () => {
    expect(() => parseBackup('{')).toThrow()
    expect(() => parseBackup(JSON.stringify({ ...backup(), formatVersion: 6 }))).toThrow()
  })
  it('probni izvoz ne može postati prava sigurnosna kopija', () => {
    const sample = createBackup(createDemo('2026-10-26'), true)
    expect(() => parseBackup(JSON.stringify(sample))).toThrow('Probni podaci')
  })
  it('odbija nedostajuću kategoriju, duple ID-ove i nevaljane kalendarske dane', () => {
    const orphan = backup(); orphan.categories = []
    expect(() => parseBackup(JSON.stringify(orphan))).toThrow('kategoriju koja nedostaje')
    const duplicate = backup(); duplicate.tasks.push(duplicate.tasks[0])
    expect(() => parseBackup(JSON.stringify(duplicate))).toThrow('ponovljene identifikatore')
    const invalid = backup(); invalid.tasks[0].plannedDate = '2026-02-30'
    expect(() => parseBackup(JSON.stringify(invalid))).toThrow()
  })
  it('ne pretvara tekstualne booleane ni nultu verziju u valjane podatke', () => {
    const invalid = backup(); invalid.tasks[0].version = 0
    expect(() => parseBackup(JSON.stringify(invalid))).toThrow()
    expect(() => parseBackup(JSON.stringify({ ...backup(), demo: 'false' }))).toThrow()
  })
  it('odbija nepoznate čvorove editora i izvršive linkove', () => {
    const invalid = backup(); invalid.notes[0].body = { type: 'doc', content: [{ type: 'script' }] }
    expect(() => parseBackup(JSON.stringify(invalid))).toThrow()
    invalid.notes[0].body = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Link', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }] }
    expect(() => parseBackup(JSON.stringify(invalid))).toThrow()
  })
})

describe('priprema oporavka', () => {
  it('zadano piše samo u privremene tablice i poništava transakciju', () => {
    const sql = recoverySql(backup())
    expect(sql).toContain('insert into pg_temp.tasks')
    expect(sql).toContain('rollback;')
    expect(sql).not.toContain('insert into public.tasks')
    expect(sql).toContain("Privatni tekst '' ; drop table tasks; --")
  })
  it('pravi oporavak ima provjeru praznog prostora i nema brisanja ni prepisivanja', () => {
    const sql = recoverySql(backup(), false)
    expect(sql).toContain('Recovery target must be empty')
    expect(sql).toContain('lock table public.categories, public.tasks, public.notes')
    expect(sql).toContain('commit;')
    expect(sql).not.toMatch(/\b(truncate|delete from|on conflict)\b/i)
  })
})
