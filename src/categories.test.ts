import { describe, expect, it } from 'vitest'
import { categoryPath, orderedCategories, promoteChildren, validateCategory } from './categories'
import { createBackup, parseBackup, recoverySql } from './backup'
import type { Category } from './domain'

const root: Category = { id: '20000000-0000-4000-8000-000000000001', name: 'Posao', icon: 'briefcase', color: '#A8C9F5', parentId: null, sortOrder: 1, version: 3 }
const child: Category = { id: '20000000-0000-4000-8000-000000000002', name: 'INA', parentId: root.id, sortOrder: 0, icon: 'target', color: '#EDCF97', version: 2 }
describe('kategorije i kopije hijerarhije', () => {
  it('dopušta ista imena u različitim roditeljima, odbija duplikat unutar roditelja', () => {
    expect(() => validateCategory({ ...child, id: 'other' }, [root, child])).toThrow('nazivom')
    expect(() => validateCategory({ ...child, id: 'other', parentId: null }, [root, child])).not.toThrow()
  })
  it('odbija treću razinu, ciklus, nestalog roditelja i premještanje roditelja s djecom', () => {
    for (const value of [{ ...child, parentId: child.id }, { ...root, parentId: child.id }, { ...child, parentId: 'missing' }, { ...root, id: 'third', parentId: child.id }]) expect(() => validateCategory(value, [root, child])).toThrow('dvije razine')
  })
  it('redoslijed drži djecu uz roditelja i put daje kontekst', () => {
    expect(orderedCategories([child, root])).toEqual([root, child])
    expect(categoryPath([root, child], child.id)).toBe('Posao / INA')
  })
  it('brisanje roditelja čuva djecu, rješava sudar naziva i ostavlja valjanu strukturu', () => {
    const promoted = promoteChildren([root, child, { id: 'root-ina', name: 'INA' }], root.id)
    expect(promoted).toHaveLength(2)
    expect(promoted[1]).toMatchObject({ id: child.id, parentId: null, name: 'INA · 20000000', version: 3 })
    for (const category of promoted) expect(() => validateCategory(category, promoted)).not.toThrow()
  })
  it('kopija čuva roditelja, ikonu, boju, redoslijed i verziju; stari format ne smije izgubiti hijerarhiju', () => {
    const backup = createBackup({ categories: [root, child], tasks: [], notes: [] }, false)
    expect(parseBackup(JSON.stringify(backup)).categories).toEqual([root, child])
    expect(() => parseBackup(JSON.stringify({ ...backup, formatVersion: 4 }))).toThrow()
    expect(recoverySql(backup)).toContain('parent_id, icon, color, sort_order, version')
    expect(recoverySql(backup)).toContain('Category content mismatch')
    expect(() => parseBackup(JSON.stringify({ ...backup, categories: [child] }))).toThrow()
  })
})
