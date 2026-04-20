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

const EMPTY_FORM: FormData = { firm_name: '', role: '', status: 'prospective', interview_notes: '', last_contacted: '' }

const STATUS_META: Record<Status, { label: string; bg: string; color: string }> = {
  prospective: { label: 'Prospective', bg: '#f1f5f9',           color: '#64748b' },
  applied:     { label: 'Applied',     bg: '#eff6ff',           color: '#3b82f6' },
  interview:   { label: 'Interview',   bg: '#fffbeb',           color: '#d97706' },
  offer:       { label: 'Offer',       bg: '#f0fdf4',           color: '#16a34a' },
  rejected:    { label: 'Rejected',    bg: '#fef2f2',           color: '#dc2626' },
}

const ALL_STATUSES: Status[] = ['prospective', 'applied', 'interview', 'offer', 'rejected']

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  fontSize: 13,
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  color: '#0f172a',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
}

function Input({ label, required, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; required?: boolean }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
      </label>}
      <input {...props} required={required}
        style={{ ...inputStyle, borderColor: focused ? '#0d9488' : '#e2e8f0', boxShadow: focused ? '0 0 0 3px rgba(13,148,136,0.1)' : 'none' }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
    </div>
  )
}

function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 5 }}>{label}</label>}
      <select {...props}
        style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', borderColor: focused ? '#0d9488' : '#e2e8f0', boxShadow: focused ? '0 0 0 3px rgba(13,148,136,0.1)' : 'none' }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
        {children}
      </select>
    </div>
  )
}

function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 5 }}>{label}</label>}
      <textarea {...props}
        style={{ ...inputStyle, resize: 'none', borderColor: focused ? '#0d9488' : '#e2e8f0', boxShadow: focused ? '0 0 0 3px rgba(13,148,136,0.1)' : 'none' }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 520, background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>{children}</div>
      </div>
    </div>
  )
}

function FirmForm({ initial, onSave, onCancel, saving }: { initial: FormData; onSave: (d: FormData) => void; onCancel: () => void; saving: boolean }) {
  const [form, setForm] = useState<FormData>(initial)
  function set<K extends keyof FormData>(field: K, value: FormData[K]) { setForm((p) => ({ ...p, [field]: value })) }
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input label="Firm Name" required value={form.firm_name} onChange={(e) => set('firm_name', e.target.value)} placeholder="Goldman Sachs" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Role" value={form.role} onChange={(e) => set('role', e.target.value)} placeholder="Summer Analyst" />
        <Select label="Status" value={form.status} onChange={(e) => set('status', e.target.value as Status)}>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </Select>
      </div>
      <Input label="Last Contacted" type="date" value={form.last_contacted} onChange={(e) => set('last_contacted', e.target.value)} />
      <Textarea label={form.status === 'interview' ? 'Interview Notes (active interview)' : 'Interview Notes'} rows={4} value={form.interview_notes} onChange={(e) => set('interview_notes', e.target.value)} placeholder="Round details, interviewer names, questions asked…" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
        <button type="button" onClick={onCancel}
          style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#64748b', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1'}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'}>
          Cancel
        </button>
        <button type="submit" disabled={saving}
          style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#0d9488', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: saving ? 0.65 : 1 }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const { label, bg, color } = STATUS_META[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color }}>
      {label}
    </span>
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
    const { data } = await supabase.from('firms').select('*').order('created_at', { ascending: false })
    setFirms(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function handleSave(form: FormData) {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('handleSave: no authenticated user')
        setSaving(false)
        return
      }
      const payload = {
        firm_name: form.firm_name,
        role: form.role || null,
        status: form.status,
        interview_notes: form.interview_notes || null,
        last_contacted: form.last_contacted || null,
      }
      if (editing) {
        const { error } = await supabase.from('firms').update(payload).eq('id', editing.id)
        if (error) { console.error('firms update error:', error.message, error.details); setSaving(false); return }
        await supabase.from('follow_up_dismissals').delete().eq('entity_type', 'firm').eq('entity_id', editing.id)
      } else {
        const { error } = await supabase.from('firms').insert({ ...payload, user_id: user.id })
        if (error) { console.error('firms insert error:', error.message, error.details, error.hint); setSaving(false); return }
      }
      setShowModal(false)
      setEditing(null)
      await load()
    } catch (e) {
      console.error('handleSave exception:', e)
    } finally {
      setSaving(false)
    }
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
    ? byStatus.filter((f) => f.firm_name.toLowerCase().includes(search.toLowerCase()) || (f.role ?? '').toLowerCase().includes(search.toLowerCase()))
    : byStatus

  const counts = ALL_STATUSES.reduce((acc, s) => { acc[s] = firms.filter((f) => f.status === s).length; return acc }, {} as Record<Status, number>)

  return (
    <div style={{ padding: '32px', maxWidth: 960, background: '#f8fafc', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>Firms</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>Companies in your recruiting pipeline</p>
        </div>
        <button onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#0d9488', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Firm
        </button>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', maxWidth: 260 }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#cbd5e1', pointerEvents: 'none' }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search firms…"
            style={{ ...inputStyle, paddingLeft: 32, maxWidth: 260 }} />
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', ...ALL_STATUSES] as const).map((s) => {
            const active = statusFilter === s
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ padding: '6px 12px', fontSize: 12, fontWeight: 500, borderRadius: 7, border: '1px solid', borderColor: active ? '#0d9488' : '#e2e8f0', background: active ? '#f0fdfa' : '#fff', color: active ? '#0d9488' : '#64748b', cursor: 'pointer' }}>
                {s === 'all' ? `All (${firms.length})` : `${STATUS_META[s].label} (${counts[s]})`}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#94a3b8', fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#374151', margin: 0 }}>
              {search ? 'No firms match' : statusFilter === 'all' ? 'No firms yet' : `No ${STATUS_META[statusFilter as Status].label} firms`}
            </p>
            {!search && statusFilter === 'all' && <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, marginBottom: 0 }}>Add your first firm above</p>}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {['Firm', 'Role', 'Status', 'Last Contacted', 'Notes', ''].map((h, i) => (
                  <th key={i} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <tr key={f.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none' }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ fontWeight: 500, color: '#0f172a' }}>{f.firm_name}</span>
                  </td>
                  <td style={{ padding: '12px 20px', color: '#64748b' }}>{f.role ?? '—'}</td>
                  <td style={{ padding: '12px 20px' }}><StatusBadge status={f.status} /></td>
                  <td style={{ padding: '12px 20px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {f.last_contacted ? new Date(f.last_contacted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    {f.interview_notes ? (
                      <button onClick={() => setNotesModal(f)}
                        style={{ fontSize: 12, fontWeight: 500, color: '#0d9488', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = '#0f766e'}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = '#0d9488'}>View</button>
                    ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      <button onClick={() => openEdit(f)}
                        style={{ fontSize: 12, fontWeight: 500, color: '#64748b', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#0f172a'; (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#64748b'; (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0' }}>Edit</button>
                      <button onClick={() => handleDelete(f.id)}
                        style={{ fontSize: 12, fontWeight: 500, color: '#ef4444', background: '#fff', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = '#fef2f2'}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = '#fff'}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit Firm' : 'Add Firm'} onClose={closeModal}>
          <FirmForm
            initial={editing ? { firm_name: editing.firm_name, role: editing.role ?? '', status: editing.status, interview_notes: editing.interview_notes ?? '', last_contacted: editing.last_contacted ?? '' } : EMPTY_FORM}
            onSave={handleSave} onCancel={closeModal} saving={saving} />
        </Modal>
      )}

      {notesModal && (
        <Modal title={`Interview Notes — ${notesModal.firm_name}`} onClose={() => setNotesModal(null)}>
          <p style={{ fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.7, margin: 0 }}>{notesModal.interview_notes}</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button onClick={() => setNotesModal(null)}
              style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#64748b', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
