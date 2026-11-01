import type { Category } from './domain'

export const categoryColors = ['#B4D6D3', '#8FFFE0', '#A8C9F5', '#EDCF97', '#D5BBE9', '#F0B8B1']
// Preserve stored color IDs and backup compatibility; adapt their display to light surfaces.
export function categoryDisplayColor(color?: string): string {
  const tones: Record<string, string> = { '#B4D6D3': '#626262', '#8FFFE0': '#28715E', '#A8C9F5': '#386799', '#EDCF97': '#86601D', '#D5BBE9': '#795391', '#F0B8B1': '#A34740' }
  return tones[color ?? categoryColors[0]] ?? '#626262'
}

export const categoryIcons = ['folder', 'briefcase', 'graduation-cap', 'house', 'wallet', 'lightbulb', 'code', 'heart', 'book-open', 'target', 'plane', 'music', 'calendar', 'shopping-bag', 'dumbbell', 'coffee']
export function siblings(categories: Category[], parentId: string | null = null): Category[] {
  return categories.filter(category => (category.parentId ?? null) === parentId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, 'hr') || a.id.localeCompare(b.id))
}
export function orderedCategories(categories: Category[]): Category[] {
  return siblings(categories).flatMap(category => [category, ...siblings(categories, category.id)])
}
export function categoryPath(categories: Category[], id: string | null): string {
  const category = categories.find(row => row.id === id)
  const parent = categories.find(row => row.id === category?.parentId)
  return category ? `${parent ? `${parent.name} / ` : ''}${category.name}` : 'Bez kategorije'
}
export function validateCategory(category: Category, categories: Category[]): void {
  if (!category.name.trim() || category.name.trim().length > 80) throw new Error('Upiši naziv do 80 znakova.')
  if (!categoryIcons.includes(category.icon ?? 'folder') || !categoryColors.includes(category.color ?? categoryColors[0])) throw new Error('Odaberi ponuđenu ikonu i boju.')
  if (category.parentId) {
    const parent = categories.find(row => row.id === category.parentId)
    if (!parent || parent.parentId || parent.id === category.id || categories.some(row => row.parentId === category.id)) throw new Error('Dopuštene su najviše dvije razine kategorija.')
  }
  if (categories.some(row => row.id !== category.id && (row.parentId ?? null) === (category.parentId ?? null) && row.name.trim().toLocaleLowerCase('hr') === category.name.trim().toLocaleLowerCase('hr'))) throw new Error('Kategorija s ovim nazivom već postoji na ovoj razini.')
}

export function promoteChildren(categories: Category[], deletedId: string): Category[] {
  const result = categories.filter(row => row.id !== deletedId && row.parentId !== deletedId)
  for (const child of siblings(categories, deletedId)) {
    let name = child.name
    let suffix = 0
    while (result.some(row => !row.parentId && row.name.trim().toLocaleLowerCase('hr') === name.trim().toLocaleLowerCase('hr'))) {
      suffix++
      name = `${child.name.slice(0, 60)} · ${child.id.slice(0, 8)}${suffix > 1 ? `-${suffix}` : ''}`
    }
    result.push({ ...child, name, parentId: null, sortOrder: Math.max(-1, ...result.filter(row => !row.parentId).map(row => row.sortOrder ?? 0)) + 1, version: (child.version ?? 1) + 1 })
  }
  return result
}
