import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Archive, ArrowLeft, ArrowUpRight, CalendarDays, Check, Download, FileText, Folder, LayoutList, Lightbulb, ListTodo, LogOut, MoreHorizontal, Pin, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { configurationIncomplete, createLinkedTask, deleteRecord, loadData, removeCategory, saveCategory, saveRecord, supabase } from './data'
import { createDemo, formatDay, isTodayTask, planProgress, taskGroup, todayInZagreb } from './domain'
import type { Category, Data, Note, Task, View } from './domain'
import { CategoryTree } from './CategoryTree'
import { CategoryIcon, iconLabels } from './CategoryIcon'
import { categoryColors, categoryDisplayColor, categoryIcons, categoryPath, orderedCategories, promoteChildren, siblings, validateCategory } from './categories'
import { createBackup } from './backup'
import { changeNode, checklistItems, contentText, matchesSearch, syncDemo, unlinkTask } from './content'

const NoteEditor = lazy(() => import('./NoteEditor').then(module => ({ default: module.NoteEditor })))

type Draft = { kind: 'task'; item: Task } | { kind: 'note'; item: Note }
const empty: Data = { categories: [], tasks: [], notes: [] }

export function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!supabase)
  const [data, setData] = useState<Data>(() => supabase ? empty : createDemo(todayInZagreb()))
  const [view, setView] = useState<View>('overview')
  const [query, setQuery] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [tab, setTab] = useState<'today' | 'pinned'>('today')
  const [categoryId, setCategoryId] = useState<string | null | undefined>()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [savedDestination, setSavedDestination] = useState<{ categoryId: string | null; name: string } | null>(null)
  const [today, setToday] = useState(todayInZagreb())
  const [categoryForm, setCategoryForm] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [newCategory, setNewCategory] = useState('')
  const [categoryParent, setCategoryParent] = useState<string | null>(null)
  const [categoryIcon, setCategoryIcon] = useState('folder')
  const [categoryColor, setCategoryColor] = useState(categoryColors[0])
  const [categoryPosition, setCategoryPosition] = useState(0)
  const [iconQuery, setIconQuery] = useState('')
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingCategoryVersion, setEditingCategoryVersion] = useState(0)
  const pageTitle = useRef<HTMLHeadingElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const categoryDialog = useRef<HTMLDialogElement>(null)
  const savedDestinationAction = useRef<HTMLButtonElement>(null)
  const pending = useRef(false)
  const request = useRef(0)
  const demo = !supabase
  const editingId = draft?.item.id

  const refresh = useCallback(async () => {
    if (!supabase || !session) return
    const current = ++request.current
    setLoading(true)
    try {
      const next = await loadData()
      if (current === request.current) { setData(next); setError('') }
    } catch (err) { if (current === request.current) setError(message(err)) }
    finally { if (current === request.current) setLoading(false) }
  }, [session])

  useEffect(() => {
    if (!supabase) return
    let active = true
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      setSession(data.session); setAuthReady(true)
      if (error) setError('Prijavu nije moguće provjeriti. Pokušaj ponovno.')
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next); setAuthReady(true)
      if (!next) { request.current++; setData(empty); setDraft(null); setDirty(false); setLoading(false) }
    })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => {
    const update = () => { setOnline(navigator.onLine); setToday(todayInZagreb()); if (!pending.current) void refresh() }
    const offline = () => setOnline(false)
    const visible = () => { if (document.visibilityState === 'visible') update() }
    const interval = window.setInterval(() => setToday(todayInZagreb()), 30_000)
    window.addEventListener('focus', update)
    window.addEventListener('online', update)
    window.addEventListener('offline', offline)
    document.addEventListener('visibilitychange', visible)
    return () => { clearInterval(interval); window.removeEventListener('focus', update); window.removeEventListener('online', update); window.removeEventListener('offline', offline); document.removeEventListener('visibilitychange', visible) }
  }, [refresh])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  useEffect(() => {
    if (editingId) {
      if (!dialog.current?.open) dialog.current?.showModal()
      dialog.current?.querySelector<HTMLElement>('#draft-heading')?.focus()
    }
    if (!editingId && dialog.current?.open) dialog.current.close()
  }, [editingId])
  useEffect(() => {
    if (savedDestination) savedDestinationAction.current?.focus()
  }, [savedDestination])
  useEffect(() => {
    if (categoryForm) {
      categoryDialog.current?.showModal()
      categoryDialog.current?.querySelector<HTMLElement>('#category-heading')?.focus()
    }
    else categoryDialog.current?.close()
  }, [categoryForm])

  useEffect(() => {
    // A new screen should start at its heading, including after a long mobile list.
    window.scrollTo({ top: 0 })
    if (!dialog.current?.open && !categoryDialog.current?.open) pageTitle.current?.focus({ preventScroll: true })
  }, [view, categoryId])

  function openDraft(next: Draft) { setError(''); setDirty(false); setDraft(structuredClone(next)) }
  function closeDraft() {
    if (pending.current) return
    if (dirty && !window.confirm('Odbaciti nespremljene promjene?')) return
    setDraft(null); setDirty(false); setError(''); void refresh()
  }
  function newTask() {
    openDraft({ kind: 'task', item: { id: crypto.randomUUID(), title: '', categoryId: categoryId ?? null,
      plannedDate: view === 'overview' && tab === 'today' ? today : null, dueDate: null, completedAt: null, pinned: false, version: 0 } })
  }
  function newNote(kind: Note['kind'] = 'note') {
    openDraft({ kind: 'note', item: { kind, id: crypto.randomUUID(), title: '', categoryId: categoryId ?? null,
      body: { type: 'doc', content: [{ type: 'paragraph' }] }, archivedAt: null, pinned: false, version: 0 } })
  }
  function patchDraft(patch: Partial<Task & Note>) {
    setDirty(true)
    setDraft(current => current ? { ...current, item: { ...current.item, ...patch } } as Draft : null)
  }

  async function run(action: () => Promise<void>) {
    if (pending.current) return false
    request.current++
    setLoading(false)
    pending.current = true; setBusy(true); setError(''); setNotice(''); setSavedDestination(null)
    try { await action(); return true } catch (err) { setError(message(err)); return false }
    finally { pending.current = false; setBusy(false) }
  }
  async function reloadAfterChange() {
    try { setData(await loadData()) }
    catch { setNotice('Promjena je spremljena, ali prikaz nije osvježen. Osvježi podatke prije sljedeće izmjene.') }
  }
  async function persist(kind: 'task' | 'note', item: Task | Note) {
    const existing = item.version > 0
    await saveRecord(kind, item, session?.user.id ?? '', existing)
    if (demo) {
      setData(current => syncDemo(current, kind, item))
    } else {
      await reloadAfterChange()
    }
  }
  async function submitDraft(event: FormEvent) {
    event.preventDefault()
    if (!draft || !draft.item.title.trim()) return
    const saved = await run(() => persist(draft.kind, { ...draft.item, title: draft.item.title.trim() }))
    if (saved) {
      setDraft(null); setDirty(false)
      const destination = draft.kind === 'note' && !draft.item.archivedAt && view === 'overview' && (tab === 'today' || !draft.item.pinned)
        ? { categoryId: draft.item.categoryId, name: categoryName(draft.item.categoryId) } : null
      setSavedDestination(destination)
      const confirmation = destination ? `Spremljeno u kategoriju „${destination.name}”.` : 'Spremljeno.'
      setNotice(current => current || (demo ? `${confirmation} Probni prikaz; izmjene nestaju nakon osvježavanja.` : confirmation))
    }
  }
  async function linkStep(path: number[]) {
    if (draft?.kind !== 'note' || !draft.item.title.trim() || draft.item.version === 0) return
    const note = draft.item
    const taskId = crypto.randomUUID()
    await run(async () => {
      await createLinkedTask(note, path, taskId)
      if (demo) {
        const step = checklistItems(note.body).find(item => JSON.stringify(item.path) === JSON.stringify(path))!
        const body = changeNode(note.body, path, node => { node.attrs = { ...node.attrs, taskId } })
        const updated = { ...note, body, title: note.title.trim(), version: note.version + 1 }
        const task: Task = { id: taskId, title: contentText(step.node).trim().slice(0, 300), categoryId: note.categoryId, plannedDate: null, dueDate: null, completedAt: step.node.attrs?.checked ? new Date().toISOString() : null, pinned: false, version: 1 }
        setData(current => syncDemo({ ...current, tasks: [...current.tasks, task] }, 'note', { ...note, body, title: note.title.trim() }))
        openDraft({ kind: 'note', item: updated })
      } else {
        try {
          const next = await loadData()
          setData(next)
          const updated = next.notes.find(row => row.id === note.id)
          if (updated) openDraft({ kind: 'note', item: updated })
          else { setDraft(null); setDirty(false) }
        } catch { setDraft(null); setDirty(false); setNotice('Zadatak je povezan, ali prikaz nije osvježen. Osvježi podatke prije sljedeće izmjene.') }
      }
    })
  }
  function openLinkedTask(id: string) {
    if (dirty) { setError('Prvo spremi promjene izvora, zatim otvori povezani zadatak.'); return }
    const task = data.tasks.find(row => row.id === id)
    if (task) openDraft({ kind: 'task', item: task })
    else setError('Zadatak nije u učitanom prikazu. Zatvori obrazac i osvježi podatke.')
  }
  async function convertIdea() {
    if (draft?.kind !== 'note' || draft.item.kind !== 'idea' || !draft.item.title.trim() || draft.item.version === 0) return
    const saved = await run(() => persist('note', { ...draft.item, title: draft.item.title.trim(), kind: 'plan' }))
    if (saved) { setDraft(null); setDirty(false); setNotice(current => current || 'Ideja je pretvorena u plan.') }
  }
  async function removeDraft() {
    if (!draft || !window.confirm('Trajno izbrisati ovu stavku?')) return
    const current = draft
    const saved = await run(async () => {
      await deleteRecord(current.kind, current.item)
      if (demo) {
        const collection = current.kind === 'task' ? 'tasks' : 'notes'
        setData(state => ({ ...state, [collection]: state[collection].filter(item => item.id !== current.item.id), ...(current.kind === 'task' ? { notes: state.notes.map(note => { const body = unlinkTask(note.body, current.item.id); return body === note.body ? note : { ...note, body, version: note.version + 1 } }) } : {}) }))
      } else await reloadAfterChange()
    })
    if (saved) { setDraft(null); setDirty(false); setNotice(current => current || 'Stavka je izbrisana.') }
  }
  function navigate(next: View) { if (next === 'search') { setQuery(''); setIncludeArchived(false) } setView(next); setCategoryId(undefined); setError(''); setNotice(''); setSavedDestination(null) }
  function openCategoryForm(category?: Category, parentId: string | null = null) {
    setError(''); setEditingCategory(category?.id ?? null); setEditingCategoryVersion(category ? category.version ?? 1 : 0); setNewCategory(category?.name ?? '')
    setCategoryParent(category?.parentId ?? parentId); setCategoryIcon(category?.icon ?? 'folder'); setCategoryColor(category?.color ?? categoryColors[0]); setIconQuery('')
    const group = siblings(data.categories, category?.parentId ?? parentId)
    setCategoryPosition(category ? group.findIndex(row => row.id === category.id) : group.length)
    setCategoryForm(true)
  }
  async function deleteCategory() {
    if (!categoryId || !window.confirm('Izbrisati kategoriju? Sadržaj ove kategorije ostat će u Bez kategorije. Podkategorije postaju samostalne kategorije i čuvaju svoj sadržaj.')) return
    const id = categoryId
    await run(async () => {
      await removeCategory(id)
      if (demo) setData(current => ({
        categories: promoteChildren(current.categories, id),
        tasks: current.tasks.map(task => task.categoryId === id ? { ...task, categoryId: null, version: task.version + 1 } : task),
        notes: current.notes.map(note => note.categoryId === id ? { ...note, categoryId: null, version: note.version + 1 } : note),
      }))
      else await reloadAfterChange()
      setCategoryId(undefined)
    })
  }
  async function exportData() {
    await run(async () => {
      const snapshot = demo ? data : await loadData()
      const payload = createBackup(snapshot, demo)
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `trenio-${today}.json`; anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice('Izvoz je pripremljen za preuzimanje.')
    })
  }

  const categoryName = (id: string | null) => categoryPath(data.categories, id)
  const tasks = data.tasks.filter(task => {
    if (view === 'search') return (includeArchived || !task.completedAt) && matchesSearch(query, task.title, categoryName(task.categoryId))
    if (view === 'archive') return Boolean(task.completedAt)
    if (task.completedAt) return false
    if (view === 'categories') return categoryId !== undefined && task.categoryId === categoryId
    return tab === 'today' ? isTodayTask(task, today) : task.pinned
  })
  const notes = data.notes.filter(note => {
    if (view === 'search') return (includeArchived || !note.archivedAt) && matchesSearch(query, note.title, contentText(note.body), categoryName(note.categoryId))
    if (view === 'archive') return Boolean(note.archivedAt)
    if (note.archivedAt) return false
    if (view === 'categories') return categoryId !== undefined && note.categoryId === categoryId
    return tab === 'pinned' && note.pinned
  })
  const sourceNote = draft?.kind === 'task' ? data.notes.find(note => checklistItems(note.body).some(step => step.node.attrs?.taskId === draft.item.id)) : undefined
  const hasCategory = view === 'categories' && categoryId !== undefined
  const title = view === 'search' ? 'Pretraga' : view === 'overview' ? 'Tvoj prostor za danas.' : view === 'archive' ? 'Arhiva' : hasCategory ? categoryName(categoryId!) : 'Kategorije'

  if (!authReady) return <main className="login-page"><p role="status">Otvaranje Trenija…</p></main>
  if (supabase && !session) return <Login />
  if (configurationIncomplete) return <main className="login-page"><h1>Postavke povezivanja nisu potpune</h1><p>Potrebni su Supabase URL i javni ključ. Provjeri .env prema README uputama.</p></main>

  return <div className="app-shell">
    <a className="skip-link" href="#main">Preskoči na sadržaj</a>
    <aside className="sidebar">
      <a className="brand" href="#" onClick={event => { event.preventDefault(); navigate('overview') }}>trenio<span>.</span></a>
      <p className="sidebar-caption">Manje buke. Više prostora.</p>
      <nav aria-label="Glavna navigacija">
        <button className={view === 'overview' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('overview')}><LayoutList size={20} />Pregled</button>
        <button className={view === 'categories' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('categories')}><Folder size={20} />Kategorije</button>
        <button className={view === 'archive' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('archive')}><Archive size={20} />Arhiva</button>
      </nav>
      <div className="sidebar-bottom"><span className="avatar">T</span><div>Tvoj osobni prostor<small>{demo ? 'Probni prikaz' : session?.user.email}</small></div></div>
    </aside>
    <div className="workspace">
      <header className="mobile-header"><span className="brand">trenio<span>.</span></span><button className="icon-button" aria-label="Otvori arhivu" onClick={() => navigate('archive')}><Archive size={21} /></button></header>
      {demo && <div className="demo-banner">Probni prikaz <span>Podaci se ne spremaju. Osvježavanje vraća primjere.</span></div>}
      {!online && !demo && !draft && !categoryForm && <OfflineNotice />}
      <main id="main" className="main-content">
        <div className="page-heading">
          <div><p className="eyebrow">{view === 'overview' ? new Intl.DateTimeFormat('hr', { dateStyle: 'full', timeZone: 'Europe/Zagreb' }).format(new Date()) : 'TVOJ PROSTOR'}</p><h1 ref={pageTitle} tabIndex={-1}>{title}</h1><p className="subtitle">{view === 'overview' ? 'Ono što je važno, na jednom mjestu.' : view === 'archive' ? 'Dovršeno i sačuvano. Vrati kad zatreba.' : 'Organiziraj na svoj način.'}</p></div>
          <button className="icon-button" aria-label="Otvori pretragu" onClick={() => navigate('search')}><Search size={21} /></button><details className="page-menu" onClick={event => { if (event.target instanceof Element && event.target.closest('button')) event.currentTarget.open = false }}><summary aria-label="Više mogućnosti"><MoreHorizontal size={22} /></summary><div className="popover"><button onClick={() => void exportData()} disabled={busy || loading}><Download size={17} />Izvezi podatke</button><button onClick={() => navigate('archive')}><Archive size={17} />Arhiva</button>{!demo && <><button onClick={() => void refresh()} disabled={busy || loading}><RefreshCw size={17} />Osvježi</button><button onClick={() => void supabase?.auth.signOut().then(({ error }) => { if (error) setError('Odjava nije uspjela.') })}><LogOut size={17} />Odjava</button></>}</div></details>
        </div>
        {error && !draft && !categoryForm && <div className="error" role="alert">{error}<button onClick={() => void refresh()}>Pokušaj ponovno</button></div>}
        {notice && <div className="notice"><p role="status">{notice}</p>{savedDestination && <button ref={savedDestinationAction} className="text-button" onClick={() => { const destination = savedDestination; navigate('categories'); setCategoryId(destination.categoryId) }}><Folder size={17} />Otvori kategoriju: {savedDestination.name}<ArrowUpRight size={16} /></button>}</div>}
        {loading && <p className="quiet" role="status">Učitavanje podataka…</p>}
        {view === 'search' && <section className="search-controls" aria-label="Pretraga sadržaja"><label htmlFor="search-query">Pretraži sadržaj</label><input id="search-query" type="search" maxLength={300} placeholder="Naziv, tekst ili kategorija" value={query} onChange={event => setQuery(event.target.value)} /><label className="check-field"><input type="checkbox" checked={includeArchived} onChange={event => setIncludeArchived(event.target.checked)} />Uključi arhivu</label><p className="quiet" role="status">{tasks.length + notes.length} rezultata sadržaja · {includeArchived ? 'uključena arhiva' : 'bez arhive'}</p>{data.categories.filter(category => query.trim() && matchesSearch(query, category.name)).map(category => <button key={category.id} className="text-button" onClick={() => { setView('categories'); setCategoryId(category.id) }}><CategoryIcon category={category} size={17} />Otvori kategoriju: {categoryPath(data.categories, category.id)}</button>)}</section>}
        {view === 'overview' && <div className="tabs" aria-label="Pregled"><button aria-pressed={tab === 'today'} onClick={() => setTab('today')}>Danas</button><button aria-pressed={tab === 'pinned'} onClick={() => setTab('pinned')}>Trenutno</button></div>}
        {hasCategory && <><button className="back-button" onClick={() => setCategoryId(undefined)}><ArrowLeft size={17} />Sve kategorije</button>{categoryId && <div className="category-tools"><button className="text-button" disabled={busy} onClick={() => { openCategoryForm(data.categories.find(row => row.id === categoryId)) }}>Uredi kategoriju</button><button className="text-button" disabled={busy} onClick={() => void deleteCategory()}>Izbriši kategoriju</button></div>}</>}
        {hasCategory && categoryId && !data.categories.find(row => row.id === categoryId)?.parentId && <section className="subcategory-nav" aria-label="Podkategorije">{siblings(data.categories, categoryId).map(category => <button className="text-button" key={category.id} onClick={() => setCategoryId(category.id)}><CategoryIcon category={category} />{category.name}</button>)}<button className="text-button" disabled={busy} onClick={() => openCategoryForm(undefined, categoryId)}><Plus size={17} />Nova podkategorija</button></section>}
        {view === 'categories' && !hasCategory ? <CategoryTree data={data} onOpen={setCategoryId} onAdd={() => openCategoryForm()} /> : <>
          <section aria-label="Zadaci" className="content-section task-list">
            {tasks.length > 0 && <SectionHeading kind="task" label={view === 'archive' ? 'Dovršeni zadaci' : 'Zadaci'} count={tasks.length} />}
            {tasks.map(task => <div className="task-row" key={task.id}>
              <button disabled={busy} className={task.completedAt ? 'task-check checked' : 'task-check'} aria-label={`${task.completedAt ? 'Vrati zadatak' : 'Dovrši zadatak'}: ${task.title}`} onClick={() => void run(() => persist('task', { ...task, completedAt: task.completedAt ? null : new Date().toISOString() }))}>{task.completedAt && <Check size={15} />}</button>
              <button className="task-content" onClick={() => openDraft({ kind: 'task', item: task })}><span>{task.title}</span><small><span><CategoryIcon category={data.categories.find(row => row.id === task.categoryId)} size={12} />{categoryName(task.categoryId)}</span>{view === 'search' && task.completedAt && <span>Arhivirano</span>}{task.dueDate && <span className={task.dueDate < today && !task.completedAt ? 'overdue' : ''}><CalendarDays size={12} />Rok {formatDay(task.dueDate)}</span>}{view === 'overview' && tab === 'today' && !task.dueDate && <span>{taskGroup(task, today)}</span>}</small></button>
              <button disabled={busy} className={task.pinned ? 'icon-button pin-button pinned' : 'icon-button pin-button'} aria-label={`${task.pinned ? 'Ukloni iz Trenutno' : 'Prikvači u Trenutno'}: ${task.title}`} aria-pressed={task.pinned} onClick={() => void run(() => persist('task', { ...task, pinned: !task.pinned }))}><Pin size={16} /></button>
            </div>)}
          </section>
          {(['plan', 'idea', 'note'] as const).map(kind => {
            const items = notes.filter(note => note.kind === kind)
            const label = kind === 'plan' ? 'Planovi' : kind === 'idea' ? 'Ideje' : 'Bilješke'
            return items.length > 0 && <section className={`content-section notes-list content-${kind}`} aria-label={label} key={kind}><SectionHeading kind={kind} label={label} count={items.length} />{items.map(note => <button className="note-row" key={note.id} onClick={() => openDraft({ kind: 'note', item: note })}>{kind === 'plan' ? <ListTodo size={21} /> : kind === 'idea' ? <Lightbulb size={21} /> : <FileText size={21} />}<span>{note.title}<small><CategoryIcon category={data.categories.find(row => row.id === note.categoryId)} size={12} /> {categoryName(note.categoryId)}{view === 'search' && note.archivedAt ? ' · Arhivirano' : ''}</small>{kind === 'plan' && <PlanProgress body={note.body} />}</span><ArrowUpRight size={17} /></button>)}</section>
          })}
          {!tasks.length && !notes.length && !loading && <div className="empty-state"><Check size={28} /><h2>{view === 'search' ? 'Nema rezultata.' : view === 'archive' ? 'Ovdje čuvamo dovršeno.' : tab === 'pinned' && view === 'overview' ? 'Važno ti je? Prikvači.' : 'Prostor za ono što slijedi.'}</h2><p>{view === 'search' ? 'Pokušaj s drugim pojmom ili uključi arhivu.' : view === 'archive' ? 'Dovršeni zadaci i arhivirani sadržaj pojavit će se ovdje.' : tab === 'pinned' && view === 'overview' ? 'Prikvači sadržaj pri uređivanju. Ostale ideje, planove i bilješke pronađi u Kategorijama ili pretragom.' : view === 'categories' ? 'Dodaj zadatak, ideju, plan ili bilješku u ovu kategoriju.' : 'Dodaj zadatak za danas. Ideje, planove i bilješke pronađi u Kategorijama ili pretragom.'}</p></div>}
          {view !== 'archive' && view !== 'search' && <div className="add-actions" role="group" aria-label="Dodaj sadržaj"><p className="add-label">Dodaj u svoj prostor</p><button className="inline-add add-primary" onClick={newTask}><Plus size={18} />Dodaj zadatak</button><button className="inline-add" onClick={() => newNote()}><FileText size={17} />Nova bilješka</button><button className="inline-add" onClick={() => newNote('plan')}><ListTodo size={17} />Novi plan</button><button className="inline-add" onClick={() => newNote('idea')}><Lightbulb size={17} />Nova ideja</button></div>}
        </>}
      </main>
    </div>
    <nav className="bottom-nav" aria-label="Mobilna navigacija"><button aria-current={view === 'overview' ? 'page' : undefined} onClick={() => navigate('overview')}><LayoutList size={22} /><span>Pregled</span></button><button className="add-button" aria-label="Brzo dodaj zadatak" onClick={newTask}><Plus size={25} /></button><button aria-current={view === 'categories' ? 'page' : undefined} onClick={() => navigate('categories')}><Folder size={22} /><span>Kategorije</span></button></nav>

    <dialog aria-labelledby="draft-heading" className={draft?.kind === 'note' ? 'edit-dialog note-dialog' : 'edit-dialog'} ref={dialog} onCancel={event => { event.preventDefault(); closeDraft() }}>
      {draft && <form onSubmit={event => void submitDraft(event)}>
        <header className="dialog-header"><button type="button" className="icon-button" aria-label="Zatvori uređivanje" onClick={closeDraft} disabled={busy}><X size={21} /></button><h2 id="draft-heading" tabIndex={-1} autoFocus>{draft.kind === 'task' ? 'Zadatak' : draft.item.kind === 'plan' ? 'Plan' : draft.item.kind === 'idea' ? 'Ideja' : 'Bilješka'}</h2><button className="primary-button" type="submit" disabled={busy || !draft.item.title.trim()}>{busy ? 'Spremanje…' : 'Spremi'}</button></header>
        {!online && !demo && <OfflineNotice />}
        {error && <p className="error" role="alert">{error}</p>}
        <fieldset disabled={busy} className="draft-fields">
          <label className="field-label" htmlFor="item-title">{draft.kind === 'task' ? 'Naziv zadatka' : draft.item.kind === 'plan' ? 'Naziv plana' : draft.item.kind === 'idea' ? 'Naziv ideje' : 'Naslov bilješke'}</label>
          <input id="item-title" className="title-input" required maxLength={300} placeholder={draft.kind === 'task' ? 'Što želiš napraviti?' : draft.item.kind === 'plan' ? 'Što želiš ostvariti?' : draft.item.kind === 'idea' ? 'Koja ti je ideja?' : 'Naslov bilješke'} value={draft.item.title} onChange={event => patchDraft({ title: event.target.value })} />
          <label className="field-label" htmlFor="item-category">Kategorija</label><select id="item-category" value={draft.item.categoryId ?? ''} onChange={event => patchDraft({ categoryId: event.target.value || null })}><option value="">Bez kategorije</option>{orderedCategories(data.categories).map(category => <option key={category.id} value={category.id}>{categoryPath(data.categories, category.id)}</option>)}</select>
          {draft.kind === 'task' ? <div className="date-fields"><label>Planirano za<input type="date" value={draft.item.plannedDate ?? ''} onChange={event => patchDraft({ plannedDate: event.target.value || null })} /></label><label>Krajnji rok<input type="date" value={draft.item.dueDate ?? ''} onChange={event => patchDraft({ dueDate: event.target.value || null })} /></label></div> : <>{draft.item.kind === 'plan' && <><p className="quiet">Opiši plan. Ako želiš pratiti napredak, pretvori retke u korake pomoću ikone checkliste.</p><PlanProgress body={draft.item.body} /></>}<Suspense fallback={<p role="status">Otvaranje editora…</p>}><NoteEditor key={`${draft.item.id}:${draft.item.version}`} body={draft.item.body} disabled={busy} kind={draft.item.kind} onChange={body => patchDraft({ body })} /></Suspense>{checklistItems(draft.item.body).length > 0 && <section className="step-links" aria-label="Zadaci iz checkboxa"><p className="quiet">Checkbox može postati povezani zadatak. Promjena stanja checkboxa primjenjuje se spremanjem. Naslov zadatka uređuje se zasebno.</p>{draft.item.version === 0 && <p className="quiet">Prvo spremi sadržaj da možeš povezati zadatke.</p>}{checklistItems(draft.item.body).map(({ node, path }, index) => <div className="step-link" key={path.join('.')}><span>{contentText(node) || `Checkbox ${index + 1}`}</span>{node.attrs?.taskId ? <button type="button" className="text-button" disabled={busy} onClick={() => openLinkedTask(String(node.attrs?.taskId))}>Otvori povezani zadatak</button> : <button type="button" className="text-button" disabled={busy || draft.item.version === 0 || !contentText(node).trim() || !draft.item.title.trim()} onClick={() => void linkStep(path)}>Stvori povezani zadatak</button>}</div>)}</section>}</>}
          {draft.kind === 'task' && sourceNote && <button type="button" className="text-button" onClick={() => { if (dirty) setError('Prvo spremi promjene zadatka, zatim otvori izvor.'); else openDraft({ kind: 'note', item: sourceNote }) }}>Otvori izvor: {sourceNote.title}</button>}
          <label className="check-field"><input type="checkbox" checked={draft.item.pinned} onChange={event => patchDraft({ pinned: event.target.checked })} />Prikvači u Trenutno</label>
        </fieldset>
        <footer className="dialog-footer"><span>{demo ? 'Probni prikaz · bez trajnog spremanja' : dirty ? 'Nespremljene promjene' : 'Bez nespremljenih promjena'}</span><div>{draft.kind === 'note' && draft.item.kind === 'idea' && draft.item.version > 0 && <button type="button" className="text-button" disabled={busy || !draft.item.title.trim()} onClick={() => void convertIdea()}><ListTodo size={17} />Pretvori u plan</button>}{draft.kind === 'note' && data.notes.some(note => note.id === draft.item.id) && <button type="button" className="text-button" disabled={busy} onClick={() => {
          if (draft.kind !== 'note') return
          patchDraft({ archivedAt: draft.item.archivedAt ? null : new Date().toISOString() })
        }}><Archive size={17} />{draft.item.archivedAt ? 'Vrati iz arhive' : 'Arhiviraj'}</button>}{(draft.kind === 'task' ? data.tasks : data.notes).some(item => item.id === draft.item.id) && <button type="button" className="icon-button danger" aria-label="Izbriši stavku" disabled={busy} onClick={() => void removeDraft()}><Trash2 size={18} /></button>}</div></footer>
      </form>}
    </dialog>
    <dialog aria-labelledby="category-heading" className="edit-dialog category-dialog" ref={categoryDialog} onCancel={event => { event.preventDefault(); if (!busy) setCategoryForm(false) }}>
      <form onSubmit={event => {
        event.preventDefault()
        if (!newCategory.trim()) return
        void run(async () => {
          const id = editingCategory ?? crypto.randomUUID()
          const category: Category = { id, name: newCategory.trim(), parentId: categoryParent, icon: categoryIcon, color: categoryColor, version: editingCategoryVersion, sortOrder: categoryPosition }
          validateCategory(category, data.categories)
          await saveCategory(category, categoryPosition)
          if (demo) setData(current => {
            const group = siblings(current.categories.filter(row => row.id !== id), categoryParent)
            group.splice(Math.min(categoryPosition, group.length), 0, category)
            const ordered = group.map((row, index) => ({ ...row, sortOrder: index, version: (row.version ?? 0) + 1 }))
            return { ...current, categories: [...current.categories.filter(row => row.id !== id && (row.parentId ?? null) !== categoryParent), ...ordered] }
          })
          else await reloadAfterChange()
          setCategoryForm(false); setNewCategory('')
        })
      }}><h2 id="category-heading" tabIndex={-1} autoFocus>{editingCategory ? 'Uredi kategoriju' : 'Nova kategorija'}</h2>{!online && !demo && <OfflineNotice />}{error && <p className="error" role="alert">{error}</p>}<label>Naziv<input required maxLength={80} value={newCategory} disabled={busy} onChange={event => setNewCategory(event.target.value)} /></label><fieldset className="category-settings" disabled={busy}><label>Nadređena kategorija<select aria-label="Nadređena kategorija" value={categoryParent ?? ''} disabled={Boolean(editingCategory && data.categories.some(row => row.parentId === editingCategory))} onChange={event => { setCategoryParent(event.target.value || null); setCategoryPosition(siblings(data.categories, event.target.value || null).filter(row => row.id !== editingCategory).length) }}><option value="">Bez nadređene kategorije</option>{siblings(data.categories).filter(row => row.id !== editingCategory).map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>{editingCategory && data.categories.some(row => row.parentId === editingCategory) && <p className="quiet">Kategorija s podkategorijama ostaje na prvoj razini.</p>}<label>Redoslijed<select value={categoryPosition} onChange={event => setCategoryPosition(Number(event.target.value))}>{Array.from({ length: siblings(data.categories, categoryParent).filter(row => row.id !== editingCategory).length + 1 }, (_, index) => <option key={index} value={index}>{index + 1}. mjesto</option>)}</select></label><details className="icon-picker"><summary><CategoryIcon category={{ icon: categoryIcon, color: categoryColor }} />Ikona: {iconLabels[categoryIcon]}</summary><label>Pretraži ikone<input type="search" value={iconQuery} onChange={event => setIconQuery(event.target.value)} /></label><div className="icon-grid">{categoryIcons.filter(icon => matchesSearch(iconQuery, iconLabels[icon], icon)).map(icon => <button type="button" key={icon} aria-label={`Ikona: ${iconLabels[icon]}`} aria-pressed={categoryIcon === icon} onClick={() => setCategoryIcon(icon)}><CategoryIcon category={{ icon, color: categoryColor }} /></button>)}</div>{!categoryIcons.some(icon => matchesSearch(iconQuery, iconLabels[icon], icon)) && <p className="quiet">Nema ikona za ovaj pojam.</p>}</details><div className="color-picker" role="group" aria-label="Boja ikone">{categoryColors.map((color, index) => <button type="button" key={color} aria-label={`Boja: ${['Neutralna', 'Mint', 'Plava', 'Pješčana', 'Ljubičasta', 'Ružičasta'][index]}`} aria-pressed={categoryColor === color} onClick={() => setCategoryColor(color)}><span style={{ background: categoryDisplayColor(color) }} /></button>)}</div></fieldset><div className="category-actions"><button type="button" className="text-button" disabled={busy} onClick={() => { setCategoryForm(false); setError('') }}>Odustani</button><button className="primary-button" disabled={busy || !newCategory.trim()}>{busy ? 'Spremanje…' : editingCategory ? 'Spremi' : 'Dodaj'}</button></div></form>
    </dialog>
  </div>
}

function SectionHeading({ kind, label, count }: { kind: 'task' | Note['kind']; label: string; count: number }) {
  const Icon = kind === 'task' ? Check : kind === 'plan' ? ListTodo : kind === 'idea' ? Lightbulb : FileText
  return <div className="section-label"><Icon size={18} aria-hidden="true" /><h2>{label}</h2><span>{count}</span></div>
}

function OfflineNotice() {
  return <p className="error" role="status">Nema internetske veze. Izmjene nisu spremljene dok spremanje ne bude potvrđeno.</p>
}

function PlanProgress({ body }: { body: Note['body'] }) {
  const progress = planProgress(body)
  return progress && <span className="plan-progress"><span>{progress.done}/{progress.total} koraka · {progress.percent}%</span><progress aria-label="Napredak plana" value={progress.done} max={progress.total} /></span>
}

function message(error: unknown): string { return error instanceof Error ? error.message : 'Došlo je do greške. Pokušaj ponovno.' }

function Login() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  return <main className="login-page"><span className="brand">trenio<span>.</span></span><h1>Tvoj osobni prostor.</h1><p>Zadaci i bilješke, spremni kad ti zatrebaju.</p><form onSubmit={event => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    setBusy(true); setError('')
    void supabase!.auth.signInWithPassword({ email: String(fields.get('email')), password: String(fields.get('password')) })
      .then(({ error }) => { if (error) setError('Prijava nije uspjela. Provjeri podatke i vezu.') })
      .catch(() => setError('Prijava nije uspjela. Provjeri vezu.')).finally(() => setBusy(false))
  }}><label>Email<input type="email" name="email" autoComplete="username" required disabled={busy} /></label><label>Lozinka<input type="password" name="password" autoComplete="current-password" required disabled={busy} /></label>{error && <p className="error" role="alert">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? 'Prijava…' : 'Prijavi se'}</button></form><small>Pristup je namijenjen vlasniku aplikacije.</small></main>
}
