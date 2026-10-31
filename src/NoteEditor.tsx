import { useEffect, useMemo, useState } from 'react'
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
  return <div className={disabled ? 'editor is-saving' : 'editor'}>
    <div className="editor-toolbar" onPointerDown={event => { if (event.isPrimary && event.target instanceof Element && event.target.closest('button') && editor.isFocused) event.preventDefault() }} role="toolbar" aria-label={kind === 'plan' ? 'Formatiranje plana' : kind === 'idea' ? 'Formatiranje ideje' : 'Formatiranje bilješke'}>
      <button type="button" disabled={disabled} aria-label="Podebljano" aria-pressed={active?.bold} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={18} /></button>
      <button type="button" disabled={disabled} aria-label="Kurziv" aria-pressed={active?.italic} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={18} /></button>
      <button type="button" disabled={disabled} aria-label="Naslov" aria-pressed={active?.heading} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={18} /></button>
      <button type="button" disabled={disabled} aria-label="Lista" aria-pressed={active?.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={18} /></button>
      <button type="button" disabled={disabled} aria-label={kind === 'plan' ? 'Pretvori redak u korak plana' : 'Pretvori redak u checkbox'} aria-pressed={active?.taskList} onClick={() => editor.chain().focus().toggleTaskList().run()}><ListTodo size={18} /></button>
      <button type="button" disabled={disabled} aria-label="Dodaj ili ukloni link" onClick={() => {
        const url = window.prompt('Adresa linka (https://…). Prazno polje uklanja link.', editor.getAttributes('link').href ?? '')
        if (url === null) return
        if (!url.trim()) { editor.chain().focus().unsetLink().run(); return }
        if (!safeLink(url.trim())) { window.alert('Upiši valjanu http, https ili mailto adresu.'); return }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
      }}><Link size={18} /></button>
    </div>
    <EditorContent editor={editor} />
  </div>
}
