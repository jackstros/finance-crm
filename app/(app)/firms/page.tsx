'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Status = 'prospective' | 'applied' | 'interview' | 'offer' | 'rejected'

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
  status: 'prospective',
  interview_notes: '',
  last_contacted: '',
}

const STATUS_META: Record<Status, { label: string; badge: string }> = {
  prospective: { label: 'Prospective', badge: 'bg-n7 text-muted' },
  applied:     { label: 'Applied',     badge: 'bg-[#4A90E2]/20 text-[#4A90E2]' },
  interview:   { label: 'Interview',   badge: 'bg-warn/20 text-warn' },
  offer:       { label: 'Offer',       badge: 'bg-pos/20 text-pos' },
  rejected:    { label: 'Rejected',    badge: 'bg-neg/20 text-neg' },
}

const ALL_STATUSES: Status[] = ['prospective', 'applied', 'interview', 'offer', 'rejected']

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg border border-n7 bg-n9 text-white placeholder-[#8A9BB5]/50 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition'

const labelCls = 'block text-xs font-medium text-muted uppercase tracking-wider mb-1.5'

function StatusBadge({ status }: { status: Status }) {
  const { label, badge } = STATUS_META[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge}`}>
      {label}
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
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="space-y-4">
      <div>
        <label className={labelCls}>Firm Name <span className="text-neg normal-case">*</span></label>
        <input required value={form.firm_name} onChange={(e) => set('firm_name', e.target.value)}
          placeholder="Goldman Sachs" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Role</label>
          <input value={form.role} onChange={(e) => set('role', e.target.value)}
            placeholder="Summer Analyst" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value as Status)}
            className={inputCls}
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>Last Contacted</label>
        <input type="date" value={form.last_contacted} onChange={(e) => set('last_contacted', e.target.value)}
          className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>
          Interview Notes
          {form.status === 'interview' && (
            <span className="ml-1.5 text-warn normal-case font-normal">(Active interview)</span>
          )}
        </label>
        <textarea rows={4} value={form.interview_notes} onChange={(e) => set('interview_notes', e.target.value)}
          placeholder="Round details, interviewer names, questions asked, key takeaways…"
          className={`${inputCls} resize-none`} />
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

export default function FirmsPage() {
  const supabase = createClient()
  const [firms, setFirms] = useState<Firm[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Firm | null>(null)
  const [notesModal, setNotesModal] = useState<Firm | null>(null)
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('firms')
      .select('*')
      .order('created_at', { ascending: false })
    setFirms(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function handleSave(form: FormData) {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
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
      await supabase.from('follow_up_dismissals').delete()
        .eq('entity_type', 'firm').eq('entity_id', editing.id)
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

  function openAdd() { setEditing(null); setShowModal(true) }
  function openEdit(f: Firm) { setEditing(f); setShowModal(true) }
  function closeModal() { setShowModal(false); setEditing(null) }

  const byStatus = statusFilter === 'all' ? firms : firms.filter((f) => f.status === statusFilter)
  const filtered = search.trim()
    ? byStatus.filter((f) =>
        f.firm_name.toLowerCase().includes(search.toLowerCase()) ||
        (f.role ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : byStatus

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Firms</h1>
          <p className="text-sm text-muted mt-1">Companies in your recruiting pipeline</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-n9 bg-gold rounded-lg hover:bg-gold2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Firm
        </button>
      </div>

      {/* Search + Status filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search firms…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-n7 bg-n8 text-white placeholder-[#8A9BB5]/50 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition"
          />
        </div>

        <div className="flex items-center gap-1">
          {(['all', ...ALL_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === s
                  ? 'bg-gold text-n9'
                  : 'text-muted hover:text-white hover:bg-n6'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-n8 rounded-xl border border-n7 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 bg-n7 rounded-full flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M8 11v4M12 11v4M16 11v4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white">
              {search ? 'No firms match your search' : statusFilter === 'all' ? 'No firms added yet' : `No firms with status "${STATUS_META[statusFilter].label}"`}
            </p>
            {!search && statusFilter === 'all' && (
              <p className="text-xs text-muted mt-1">Add your first firm above</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-n7">
                <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Firm</th>
                <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Role</th>
                <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Last Contacted</th>
                <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Notes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <tr
                  key={f.id}
                  className={`border-b border-n7/50 hover:bg-n6 transition-colors ${
                    i % 2 === 0 ? 'bg-n8' : 'bg-n9/30'
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-white">{f.firm_name}</td>
                  <td className="px-4 py-3 text-muted">{f.role ?? '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {f.last_contacted
                      ? new Date(f.last_contacted).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {f.interview_notes ? (
                      <button
                        onClick={() => setNotesModal(f)}
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
                        onClick={() => openEdit(f)}
                        className="text-xs text-muted hover:text-white px-2.5 py-1 rounded border border-n7 hover:border-n5 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
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
        <Modal title={`Interview Notes — ${notesModal.firm_name}`} onClose={() => setNotesModal(null)}>
          <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{notesModal.interview_notes}</p>
          <div className="flex justify-end mt-5">
            <button
              onClick={() => setNotesModal(null)}
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
