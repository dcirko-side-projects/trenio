import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import type { Category, Data } from './domain'
import { siblings } from './categories'
import { CategoryIcon } from './CategoryIcon'

export function CategoryTree({ data, onOpen, onAdd }: { data: Data; onOpen: (id: string | null) => void; onAdd: () => void }) {
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  function row(category: Category | { id: null; name: string }, child = false) {
    const count = data.tasks.filter(item => item.categoryId === category.id && !item.completedAt).length + data.notes.filter(item => item.categoryId === category.id && !item.archivedAt).length
    return <button className={`category-row${child ? ' subcategory-row' : ''}`} onClick={() => onOpen(category.id)}><span className="folder-icon"><CategoryIcon category={category.id ? category : undefined} /></span><span>{category.name}<small>{count} {{ one: 'stavka', few: 'stavke', other: 'stavki' }[new Intl.PluralRules('hr').select(count) as 'one' | 'few' | 'other']}{child ? ' · Podkategorija' : ''}</small></span><ChevronRight size={18} /></button>
  }
  return <section className="categories" aria-label="Popis kategorija">
    {siblings(data.categories).map(category => {
      const children = siblings(data.categories, category.id)
      const expanded = expandedIds.includes(category.id)
      return <div className="category-group" key={category.id}><div className="category-parent">{row(category)}{children.length > 0 && <button className="icon-button category-expand" aria-label={`${expanded ? 'Sažmi' : 'Proširi'} podkategorije: ${category.name}`} aria-expanded={expanded} aria-controls={`children-${category.id}`} onClick={() => setExpandedIds(current => current.includes(category.id) ? current.filter(id => id !== category.id) : [...current, category.id])}>{expanded ? <ChevronDown size={19} /> : <ChevronRight size={19} />}</button>}</div>{children.length > 0 && <div id={`children-${category.id}`} hidden={!expanded}>{children.map(child => <div key={child.id}>{row(child, true)}</div>)}</div>}</div>
    })}
    {row({ id: null, name: 'Bez kategorije' })}
    <button className="inline-add" onClick={onAdd}><Plus size={18} />Nova kategorija</button>
  </section>
}
