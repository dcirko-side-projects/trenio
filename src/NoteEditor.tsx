import { useEffect, useMemo, useRef, useState } from 'react'
import { useEditor, useEditorState, EditorContent } from '@tiptap/react'
import type { JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Bold, Heading2, Italic, Link, List, ListTodo } from 'lucide-react'
import { safeLink } from './domain'

const LinkedTaskItem = TaskItem.extend({
  addAttributes() {
    return { ...this.parent?.(), taskId: { default: null, keepOnSplit: false, parseHTML: element => element.getAttribute('data-task-id'), renderHTML: attributes => attributes.taskId ? { 'data-task-id': attributes.taskId } : {} } }
  },
})

export function NoteEditor({ body, onChange, disabled, kind = 'note' }: { body: JSONContent; onChange: (body: JSONContent) => void; disabled: boolean; kind?: 'note' | 'plan' | 'idea' }) {
  // Keep the initial document and configuration stable while React receives edits.
  const [initialBody] = useState(body)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkError, setLinkError] = useState('')
  const linkButton = useRef<HTMLButtonElement>(null)
  const extensions = useMemo(() => [StarterKit.configure({
      heading: { levels: [2] },
      link: { openOnClick: false, autolink: false, isAllowedUri: safeLink },
    }), TaskList, LinkedTaskItem.configure({ nested: false })], [])
  // Avoid mobile IME capitalization resets when checklist blocks change around the caret.
  const editorProps = useMemo(() => ({ attributes: { class: 'note-body', 'aria-label': kind === 'plan' ? 'Sadržaj plana' : kind === 'idea' ? 'Sadržaj ideje' : 'Sadržaj bilješke', role: 'textbox', 'aria-multiline': 'true', autocapitalize: 'off', spellcheck: 'true' } }), [kind])
  const editor = useEditor({
    extensions,
    content: initialBody,
    editable: !disabled,
    autofocus: false,
    editorProps,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  })
  useEffect(() => { editor?.setEditable(!disabled, false) }, [editor, disabled])
  const active = useEditorState({ editor, selector: ({ editor }) => ({
    bold: editor?.isActive('bold') ?? false,
    italic: editor?.isActive('italic') ?? false,
    heading: editor?.isActive('heading') ?? false,
    bulletList: editor?.isActive('bulletList') ?? false,
    taskList: editor?.isActive('taskList') ?? false,
  }) })
  if (!editor) return <p>Otvaranje bilješke…</p>
  function closeLink() {
    setLinkOpen(false)
    linkButton.current?.focus({ preventScroll: true })
  }
  function applyLink() {
    if (!editor || disabled) return
    const url = linkUrl.trim()
    if (url && !safeLink(url)) { setLinkError('Upiši valjanu http, https ili mailto adresu.'); return }
    if (url) editor.chain().extendMarkRange('link').setLink({ href: url }).run()
    else editor.chain().unsetLink().run()
    closeLink()
  }
  return <div className={disabled ? 'editor is-saving' : 'editor'}>
    <div className="editor-toolbar" onPointerDown={event => { if (event.isPrimary && event.target instanceof Element && event.target.closest('button') && editor.isFocused) event.preventDefault() }} role="toolbar" aria-label={kind === 'plan' ? 'Formatiranje plana' : kind === 'idea' ? 'Formatiranje ideje' : 'Formatiranje bilješke'}>
      <button type="button" disabled={disabled} aria-label="Podebljano" aria-pressed={active?.bold} onClick={() => editor.chain().toggleBold().run()}><Bold size={18} /></button>
      <button type="button" disabled={disabled} aria-label="Kurziv" aria-pressed={active?.italic} onClick={() => editor.chain().toggleItalic().run()}><Italic size={18} /></button>
      <button type="button" disabled={disabled} aria-label="Naslov" aria-pressed={active?.heading} onClick={() => editor.chain().toggleHeading({ level: 2 }).run()}><Heading2 size={18} /></button>
      <button type="button" disabled={disabled} aria-label="Lista" aria-pressed={active?.bulletList} onClick={() => editor.chain().toggleBulletList().run()}><List size={18} /></button>
      <button type="button" disabled={disabled} aria-label={kind === 'plan' ? 'Pretvori redak u korak plana' : 'Pretvori redak u checkbox'} aria-pressed={active?.taskList} onClick={() => editor.chain().toggleTaskList().run()}><ListTodo size={18} /></button>
      <button ref={linkButton} type="button" disabled={disabled} aria-label="Dodaj ili ukloni link" aria-expanded={linkOpen} aria-controls="link-fields" onClick={() => {
        setLinkUrl(editor.getAttributes('link').href ?? '')
        setLinkError('')
        setLinkOpen(open => !open)
      }}><Link size={18} /></button>
    </div>
    {linkOpen && <div className="link-fields" id="link-fields" onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeLink() }
    }}>
      <label htmlFor="link-url">Adresa linka</label>
      <input id="link-url" type="text" inputMode="url" placeholder="https://…" value={linkUrl} disabled={disabled} aria-describedby={linkError ? 'link-error' : 'link-help'} aria-invalid={Boolean(linkError)} onChange={event => { setLinkUrl(event.target.value); setLinkError('') }} onKeyDown={event => {
        if (event.key === 'Enter') { event.preventDefault(); applyLink() }
      }} />
      <p className="quiet" id="link-help">Prazno polje uklanja link.</p>
      {linkError && <p className="error" role="alert" id="link-error">{linkError}</p>}
      <div><button type="button" className="primary-button" disabled={disabled} onClick={applyLink}>Primijeni link</button><button type="button" className="text-button" disabled={disabled} onClick={closeLink}>Zatvori postavke linka</button></div>
    </div>}
    <EditorContent editor={editor} />
  </div>
}
