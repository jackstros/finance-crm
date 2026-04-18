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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
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
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(form)
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Jane Smith"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Firm</label>
          <input
            value={form.firm ?? ''}
            onChange={(e) => set('firm', e.target.value)}
            placeholder="Goldman Sachs"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
          <input
            type="email"
            value={form.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
            placeholder="jane@firm.com"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Date of Contact
          </label>
          <input
            type="date"
            value={form.date_of_contact ?? ''}
            onChange={(e) => set('date_of_contact', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes</label>
          <textarea
            rows={3}
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Key topics discussed, next steps…"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
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

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })
    setContacts(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    load()
  }, [load])

  async function handleSave(form: FormData) {
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
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
      await supabase
        .from('follow_up_dismissals')
        .delete()
        .eq('entity_type', 'contact')
        .eq('entity_id', editing.id)
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

  function openAdd() {
    setEditing(null)
    setShowModal(true)
  }
  function openEdit(c: Contact) {
    setEditing(c)
    setShowModal(true)
  }
  function closeModal() {
    setShowModal(false)
    setEditing(null)
  }

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Contacts</h1>
          <p className="text-sm text-slate-500 mt-1">
            People you&apos;ve networked with or emailed
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Contact
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
            Loading…
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">No contacts yet</p>
            <p className="text-xs text-slate-400 mt-1">Add your first networking contact above</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Name</th>
                <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Firm</th>
                <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Email</th>
                <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Date</th>
                <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Notes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {contacts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500">{c.firm ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {c.date_of_contact
                      ? new Date(c.date_of_contact).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {c.notes ? (
                      <button
                        onClick={() => setNotes(c)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium underline underline-offset-2"
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-xs text-slate-500 hover:text-slate-900 px-2.5 py-1 rounded border border-slate-200 hover:border-slate-300 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-xs text-red-500 hover:text-red-700 px-2.5 py-1 rounded border border-red-100 hover:border-red-200 transition"
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
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {notes.notes}
          </p>
          <div className="flex justify-end mt-5">
            <button
              onClick={() => setNotes(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
