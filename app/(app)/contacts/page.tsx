'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Contact = {
  id: string
  name: string
  firm: string | null
  email: string | null
  date_of_contact: string | null
  notes: string | null
  created_at: string
}

type FormData = Omit<Contact, 'id' | 'created_at'>

const EMPTY_FORM: FormData = {
  name: '',
  firm: '',
  email: '',
  date_of_contact: '',
  notes: '',
}

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg border border-n7 bg-n9 text-white placeholder-[#8A9BB5]/50 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition'

const labelCls = 'block text-xs font-medium text-muted uppercase tracking-wider mb-1.5'

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-n8 rounded-xl border border-n7 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-n7 sticky top-0 bg-n8">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function ContactForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: FormData
  onSave: (data: FormData) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<FormData>(initial)

  function set(field: keyof FormData, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelCls}>Name <span className="text-neg normal-case">*</span></label>
          <input required value={form.name} onChange={(e) => set('name', e.target.value)}
            placeholder="Jane Smith" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Firm</label>
          <input value={form.firm ?? ''} onChange={(e) => set('firm', e.target.value)}
            placeholder="Goldman Sachs" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)}
            placeholder="jane@firm.com" className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Date of Contact</label>
          <input type="date" value={form.date_of_contact ?? ''} onChange={(e) => set('date_of_contact', e.target.value)}
            className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Notes</label>
          <textarea rows={3} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)}
            placeholder="Key topics discussed, next steps…"
            className={`${inputCls} resize-none`} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-muted rounded-lg border border-n7 hover:bg-n6 hover:text-white transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm font-medium text-n9 bg-gold rounded-lg hover:bg-gold2 disabled:opacity-60 transition-colors">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function ContactsPage() {
  const supabase = createClient()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [notes, setNotes] = useState<Contact | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })
    setContacts(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function handleSave(form: FormData) {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      ...form,
      firm: form.firm || null,
      email: form.email || null,
      date_of_contact: form.date_of_contact || null,
      notes: form.notes || null,
    }

    if (editing) {
      await supabase.from('contacts').update(payload).eq('id', editing.id)
      await supabase.from('follow_up_dismissals').delete()
        .eq('entity_type', 'contact').eq('entity_id', editing.id)
    } else {
      await supabase.from('contacts').insert({ ...payload, user_id: user.id })
    }

    setSaving(false)
    setShowModal(false)
    setEditing(null)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contact?')) return
    await supabase.from('contacts').delete().eq('id', id)
    load()
  }

  function openAdd() { setEditing(null); setShowModal(true) }
  function openEdit(c: Contact) { setEditing(c); setShowModal(true) }
  function closeModal() { setShowModal(false); setEditing(null) }

  const filtered = search.trim()
    ? contacts.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.firm ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (c.email ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : contacts

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">CRM</h1>
          <p className="text-sm text-muted mt-1">People you&apos;ve networked with</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-n9 bg-gold rounded-lg hover:bg-gold2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Contact
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts…"
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-n7 bg-n8 text-white placeholder-[#8A9BB5]/50 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition"
        />
      </div>

      {/* Table */}
      <div className="bg-n8 rounded-xl border border-n7 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 bg-n7 rounded-full flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white">
              {search ? 'No contacts match your search' : 'No contacts yet'}
            </p>
            <p className="text-xs text-muted mt-1">
              {search ? 'Try a different search term' : 'Add your first networking contact above'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-n7">
                <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Name</th>
                <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Firm</th>
                <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Email</th>
                <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Date</th>
                <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Notes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-n7/50 hover:bg-n6 transition-colors ${
                    i % 2 === 0 ? 'bg-n8' : 'bg-n9/30'
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                  <td className="px-4 py-3 text-muted">{c.firm ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {c.date_of_contact
                      ? new Date(c.date_of_contact).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {c.notes ? (
                      <button
                        onClick={() => setNotes(c)}
                        className="text-xs text-gold hover:text-gold2 font-medium transition-colors"
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-muted/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-xs text-muted hover:text-white px-2.5 py-1 rounded border border-n7 hover:border-n5 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-xs text-neg/70 hover:text-neg px-2.5 py-1 rounded border border-neg/20 hover:border-neg/40 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Contact' : 'Add Contact'} onClose={closeModal}>
          <ContactForm
            initial={
              editing
                ? {
                    name: editing.name,
                    firm: editing.firm ?? '',
                    email: editing.email ?? '',
                    date_of_contact: editing.date_of_contact ?? '',
                    notes: editing.notes ?? '',
                  }
                : EMPTY_FORM
            }
            onSave={handleSave}
            onCancel={closeModal}
            saving={saving}
          />
        </Modal>
      )}

      {/* Notes modal */}
      {notes && (
        <Modal title={`Notes — ${notes.name}`} onClose={() => setNotes(null)}>
          <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{notes.notes}</p>
          <div className="flex justify-end mt-5">
            <button
              onClick={() => setNotes(null)}
              className="px-4 py-2 text-sm font-medium text-muted rounded-lg border border-n7 hover:bg-n6 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
