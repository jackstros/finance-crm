'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Status = 'researching' | 'applied' | 'interview' | 'offer' | 'rejected'

type Firm = {
  id: string
  firm_name: string
  role: string | null
  status: Status
  interview_notes: string | null
  last_contacted: string | null
  created_at: string
}

type FormData = {
  firm_name: string
  role: string
  status: Status
  interview_notes: string
  last_contacted: string
}

const EMPTY_FORM: FormData = {
  firm_name: '',
  role: '',
  status: 'researching',
  interview_notes: '',
  last_contacted: '',
}

const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  researching: { label: 'Researching', color: 'text-slate-700', bg: 'bg-slate-100' },
  applied: { label: 'Applied', color: 'text-blue-700', bg: 'bg-blue-50' },
  interview: { label: 'Interview', color: 'text-amber-700', bg: 'bg-amber-50' },
  offer: { label: 'Offer', color: 'text-green-700', bg: 'bg-green-50' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50' },
}

const ALL_STATUSES: Status[] = ['researching', 'applied', 'interview', 'offer', 'rejected']

function StatusBadge({ status }: { status: Status }) {
  const meta = STATUS_META[status]
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.color}`}
    >
      {meta.label}
    </span>
  )
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

function FirmForm({
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

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
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
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Firm Name <span className="text-red-400">*</span>
        </label>
        <input
          required
          value={form.firm_name}
          onChange={(e) => set('firm_name', e.target.value)}
          placeholder="Goldman Sachs"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Role</label>
          <input
            value={form.role}
            onChange={(e) => set('role', e.target.value)}
            placeholder="Summer Analyst"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value as Status)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Last Contacted
        </label>
        <input
          type="date"
          value={form.last_contacted}
          onChange={(e) => set('last_contacted', e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Interview Notes
          {form.status === 'interview' && (
            <span className="ml-1.5 text-amber-600 font-normal">(Active interview)</span>
          )}
        </label>
        <textarea
          rows={4}
          value={form.interview_notes}
          onChange={(e) => set('interview_notes', e.target.value)}
          placeholder="Round details, interviewer names, questions asked, key takeaways…"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
        />
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

export default function FirmsPage() {
  const supabase = createClient()
  const [firms, setFirms] = useState<Firm[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Firm | null>(null)
  const [notesModal, setNotesModal] = useState<Firm | null>(null)
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('firms')
      .select('*')
      .order('created_at', { ascending: false })
    setFirms(data ?? [])
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
      firm_name: form.firm_name,
      role: form.role || null,
      status: form.status,
      interview_notes: form.interview_notes || null,
      last_contacted: form.last_contacted || null,
    }

    if (editing) {
      await supabase.from('firms').update(payload).eq('id', editing.id)
      await supabase
        .from('follow_up_dismissals')
        .delete()
        .eq('entity_type', 'firm')
        .eq('entity_id', editing.id)
    } else {
      await supabase.from('firms').insert({ ...payload, user_id: user.id })
    }

    setSaving(false)
    setShowModal(false)
    setEditing(null)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this firm?')) return
    await supabase.from('firms').delete().eq('id', id)
    load()
  }

  function openAdd() {
    setEditing(null)
    setShowModal(true)
  }
  function openEdit(f: Firm) {
    setEditing(f)
    setShowModal(true)
  }
  function closeModal() {
    setShowModal(false)
    setEditing(null)
  }

  const filtered =
    statusFilter === 'all' ? firms : firms.filter((f) => f.status === statusFilter)

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Firms</h1>
          <p className="text-sm text-slate-500 mt-1">Companies in your recruiting pipeline</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Firm
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 mb-4">
        {(['all', ...ALL_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === s
                ? 'bg-indigo-600 text-white'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            {s === 'all' ? 'All' : STATUS_META[s].label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M8 11v4M12 11v4M16 11v4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">
              {statusFilter === 'all'
                ? 'No firms added yet'
                : `No firms with status "${STATUS_META[statusFilter].label}"`}
            </p>
            {statusFilter === 'all' && (
              <p className="text-xs text-slate-400 mt-1">Add your first firm above</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Firm</th>
                <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Role</th>
                <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Last Contacted</th>
                <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Notes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{f.firm_name}</td>
                  <td className="px-4 py-3 text-slate-500">{f.role ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={f.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {f.last_contacted
                      ? new Date(f.last_contacted).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {f.interview_notes ? (
                      <button
                        onClick={() => setNotesModal(f)}
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
                        onClick={() => openEdit(f)}
                        className="text-xs text-slate-500 hover:text-slate-900 px-2.5 py-1 rounded border border-slate-200 hover:border-slate-300 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
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
        <Modal title={editing ? 'Edit Firm' : 'Add Firm'} onClose={closeModal}>
          <FirmForm
            initial={
              editing
                ? {
                    firm_name: editing.firm_name,
                    role: editing.role ?? '',
                    status: editing.status,
                    interview_notes: editing.interview_notes ?? '',
                    last_contacted: editing.last_contacted ?? '',
                  }
                : EMPTY_FORM
            }
            onSave={handleSave}
            onCancel={closeModal}
            saving={saving}
          />
        </Modal>
      )}

      {/* Interview notes modal */}
      {notesModal && (
        <Modal
          title={`Interview Notes — ${notesModal.firm_name}`}
          onClose={() => setNotesModal(null)}
        >
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {notesModal.interview_notes}
          </p>
          <div className="flex justify-end mt-5">
            <button
              onClick={() => setNotesModal(null)}
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
