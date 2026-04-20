'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Constants ─────────────────────────────────────────────────────────────────

const OUTREACH_STATUSES = [
  'To Reach Out',
  'Email Sent',
  'Responded',
  'Call Scheduled',
  'In-Person Chat',
  'Following Up',
] as const

type OutreachStatus = typeof OUTREACH_STATUSES[number]

const STATUS_STYLE: Record<OutreachStatus, { bg: string; color: string; border: string }> = {
  'To Reach Out':   { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
  'Email Sent':     { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  'Responded':      { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'Call Scheduled': { bg: '#f0fdfa', color: '#0d9488', border: '#99f6e4' },
  'In-Person Chat': { bg: '#eef2ff', color: '#1e40af', border: '#c7d2fe' },
  'Following Up':   { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Contact = {
  id: string
  name: string
  firm: string | null
  email: string | null
  linkedin_url: string | null
  phone: string | null
  date_of_contact: string | null
  outreach_status: OutreachStatus
  last_contact_date: string | null
  total_follow_ups: number
  email_sent_time: string | null
  next_chat_date: string | null
  chats_completed: number
  notes: string | null
  created_at: string
}

type FollowUp = {
  id: string
  contact_id: string
  follow_up_date: string
  notes: string | null
  created_at: string
}

type FormData = {
  name: string
  firm: string
  email: string
  linkedin_url: string
  phone: string
  date_of_contact: string
  outreach_status: OutreachStatus
  email_sent_time: string
  next_chat_date: string
  notes: string
}

const EMPTY_FORM: FormData = {
  name: '',
  firm: '',
  email: '',
  linkedin_url: '',
  phone: '',
  date_of_contact: '',
  outreach_status: 'To Reach Out',
  email_sent_time: '',
  next_chat_date: '',
  notes: '',
}

// ── Shared input style ────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDateTime(dt: string | null) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// Converts a UTC ISO string to the value format required by <input type="datetime-local">
function toDateTimeLocal(dt: string | null): string {
  if (!dt) return ''
  const d = new Date(dt)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Converts a datetime-local string to ISO (interprets as local time)
function parseDateTimeLocal(s: string): string | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OutreachStatus }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE['To Reach Out']
  return (
    <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  )
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 5 }}>
      {children}{required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
    </label>
  )
}

function Input({ label, required, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <input
        {...props}
        required={required}
        style={{ ...inputStyle, borderColor: focused ? '#0d9488' : '#e2e8f0', boxShadow: focused ? '0 0 0 3px rgba(13,148,136,0.1)' : 'none' }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

function SelectField({ label, required, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; children: React.ReactNode }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <select
        {...props}
        required={required}
        style={{ ...inputStyle, borderColor: focused ? '#0d9488' : '#e2e8f0', boxShadow: focused ? '0 0 0 3px rgba(13,148,136,0.1)' : 'none', appearance: 'none', cursor: 'pointer' }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {children}
      </select>
    </div>
  )
}

function TextareaField({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <textarea
        {...props}
        style={{ ...inputStyle, resize: 'none', borderColor: focused ? '#0d9488' : '#e2e8f0', boxShadow: focused ? '0 0 0 3px rgba(13,148,136,0.1)' : 'none' }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ ...inputStyle, background: '#f8fafc', color: '#64748b', cursor: 'default', userSelect: 'none' }}>{value}</div>
    </div>
  )
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: wide ? 620 : 480, background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
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

// ── Contact Form ──────────────────────────────────────────────────────────────

function ContactForm({
  initial,
  onSave,
  onCancel,
  saving,
  isEdit,
  contact,
  followUps,
  loadingFollowUps,
}: {
  initial: FormData
  onSave: (d: FormData) => void
  onCancel: () => void
  saving: boolean
  isEdit: boolean
  contact?: Contact
  followUps?: FollowUp[]
  loadingFollowUps?: boolean
}) {
  const [form, setForm] = useState<FormData>(initial)
  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  const showEmailTime = form.outreach_status !== 'To Reach Out'

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input label="Full Name" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Jane Smith" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Firm" value={form.firm} onChange={(e) => set('firm', e.target.value)} placeholder="Goldman Sachs" />
        <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="jane@gs.com" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="LinkedIn URL" value={form.linkedin_url} onChange={(e) => set('linkedin_url', e.target.value)} placeholder="linkedin.com/in/jane" />
        <Input label="Phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Date of Initial Contact" type="date" value={form.date_of_contact} onChange={(e) => set('date_of_contact', e.target.value)} />
        <SelectField label="Outreach Status" value={form.outreach_status} onChange={(e) => set('outreach_status', e.target.value as OutreachStatus)}>
          {OUTREACH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </SelectField>
      </div>

      {/* Email sent time — only shown when a status beyond "To Reach Out" is set */}
      {showEmailTime && (
        <Input
          label="Email Sent Time"
          type="datetime-local"
          value={form.email_sent_time}
          onChange={(e) => set('email_sent_time', e.target.value)}
        />
      )}

      {/* Chat date — always available */}
      <Input
        label="Chat Date & Time"
        type="datetime-local"
        value={form.next_chat_date}
        onChange={(e) => set('next_chat_date', e.target.value)}
      />

      <TextareaField label="Notes" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="How you met, what you discussed, follow-up items…" />

      {isEdit && contact && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ReadOnlyField label="Last Contact Date" value={fmtDate(contact.last_contact_date)} />
          <ReadOnlyField label="Total Follow Ups" value={contact.total_follow_ups} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
        <button type="button" onClick={onCancel}
          style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#64748b', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0' }}>
          Cancel
        </button>
        <button type="submit" disabled={saving}
          style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#0d9488', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: saving ? 0.65 : 1 }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Follow Up History — only shown in edit mode */}
      {isEdit && (
        <div style={{ marginTop: 4, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94a3b8', margin: '0 0 12px' }}>
            Follow Up History
          </p>
          {loadingFollowUps ? (
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Loading…</p>
          ) : !followUps?.length ? (
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No follow ups logged yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {followUps.map((fu) => (
                <div key={fu.id} style={{ padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: '0 0 3px' }}>{fmtDate(fu.follow_up_date)}</p>
                  {fu.notes
                    ? <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{fu.notes}</p>
                    : <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0, fontStyle: 'italic' }}>No notes</p>
                  }
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </form>
  )
}

// ── Log Follow Up Modal ───────────────────────────────────────────────────────

function LogFollowUpModal({ contact, onClose, onSaved }: { contact: Contact; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient()
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date) { setError('Please select a date.'); return }
    setSaving(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSaving(false); return }

      const { error: fuErr } = await supabase.from('follow_ups').insert({
        contact_id: contact.id,
        user_id: user.id,
        follow_up_date: date,
        notes: notes.trim() || null,
      })
      if (fuErr) { setError(fuErr.message); setSaving(false); return }

      const { error: cErr } = await supabase.from('contacts').update({
        last_contact_date: date,
        total_follow_ups: (contact.total_follow_ups ?? 0) + 1,
      }).eq('id', contact.id)
      if (cErr) { setError(cErr.message); setSaving(false); return }

      onSaved()
    } catch (err) {
      console.error('logFollowUp exception:', err)
      setError('An unexpected error occurred.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Log Follow Up — ${contact.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        <TextareaField
          label="Notes (optional)"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What did you discuss or plan to follow up about?"
        />
        {error && <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <button type="button" onClick={onClose}
            style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#64748b', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0' }}>
            Cancel
          </button>
          <button type="submit" disabled={saving}
            style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#0d9488', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: saving ? 0.65 : 1 }}>
            {saving ? 'Saving…' : 'Log Follow Up'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Upcoming Chats Modal ──────────────────────────────────────────────────────

function UpcomingChatsModal({ contacts, onClose }: { contacts: Contact[]; onClose: () => void }) {
  const now = new Date()
  const upcoming = contacts
    .filter((c) => c.next_chat_date && new Date(c.next_chat_date) >= now)
    .sort((a, b) => new Date(a.next_chat_date!).getTime() - new Date(b.next_chat_date!).getTime())

  return (
    <Modal title="Upcoming Chats" onClose={onClose}>
      {upcoming.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#374151', margin: '0 0 4px' }}>No upcoming chats scheduled</p>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Add a chat date when editing a contact</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {upcoming.map((c) => {
            const chatDate = new Date(c.next_chat_date!)
            const hoursUntil = (chatDate.getTime() - now.getTime()) / 3600000
            const isSoon = hoursUntil <= 24
            return (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: isSoon ? '#fffbeb' : '#f8fafc',
                  border: `1px solid ${isSoon ? '#fde68a' : '#e2e8f0'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: isSoon ? '#fef3c7' : '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: isSoon ? '#d97706' : '#0d9488', flexShrink: 0 }}>
                    {initials(c.name)}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: '0 0 2px' }}>{c.name}</p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{c.firm ?? 'No firm'}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: isSoon ? '#d97706' : '#0f172a', margin: '0 0 2px', whiteSpace: 'nowrap' }}>
                    {chatDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p style={{ fontSize: 12, color: isSoon ? '#d97706' : '#64748b', margin: 0 }}>
                    {chatDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    {isSoon && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600 }}>· Soon</span>}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button onClick={onClose} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#64748b', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}>
          Close
        </button>
      </div>
    </Modal>
  )
}

// ── Chat Cleanup ──────────────────────────────────────────────────────────────

async function runChatCleanup(supabase: ReturnType<typeof createClient>): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const now = new Date().toISOString()
    const { data: pastChats } = await supabase
      .from('contacts')
      .select('id, chats_completed, next_chat_date')
      .eq('user_id', user.id)
      .not('next_chat_date', 'is', null)
      .lt('next_chat_date', now)

    if (!pastChats || pastChats.length === 0) return false

    console.log(`runChatCleanup: found ${pastChats.length} past chat(s)`)
    for (const contact of pastChats as { id: string; chats_completed: number; next_chat_date: string }[]) {
      const chatDate = new Date(contact.next_chat_date).toISOString().slice(0, 10)
      await supabase.from('contacts').update({
        chats_completed: (contact.chats_completed ?? 0) + 1,
        next_chat_date: null,
      }).eq('id', contact.id)
      await supabase.from('completed_chats').insert({
        contact_id: contact.id,
        user_id: user.id,
        chat_date: chatDate,
      })
    }
    return true
  } catch (err) {
    console.error('runChatCleanup error:', err)
    return false
  }
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const supabase = createClient()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [logFollowUp, setLogFollowUp] = useState<Contact | null>(null)
  const [showUpcomingChats, setShowUpcomingChats] = useState(false)
  const [search, setSearch] = useState('')
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loadingFollowUps, setLoadingFollowUps] = useState(false)

  const load = useCallback(async () => {
    const cleaned = await runChatCleanup(supabase)
    if (cleaned) console.log('contacts/load: chat cleanup ran, reloading')
    const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false })
    console.log('contacts/load: fetched', data?.length ?? 0, 'contacts')
    setContacts((data ?? []) as Contact[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function loadFollowUps(contactId: string) {
    setLoadingFollowUps(true)
    const { data } = await supabase
      .from('follow_ups')
      .select('*')
      .eq('contact_id', contactId)
      .order('follow_up_date', { ascending: false })
    setFollowUps((data ?? []) as FollowUp[])
    setLoadingFollowUps(false)
  }

  async function handleSave(form: FormData) {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSaving(false); return }

      const chatDateParsed = parseDateTimeLocal(form.next_chat_date)
      const chatIsInPast = chatDateParsed !== null && new Date(chatDateParsed) < new Date()

      const payload = {
        name: form.name,
        firm: form.firm || null,
        email: form.email || null,
        linkedin_url: form.linkedin_url || null,
        phone: form.phone || null,
        date_of_contact: form.date_of_contact || null,
        outreach_status: form.outreach_status,
        email_sent_time: parseDateTimeLocal(form.email_sent_time),
        // If chat date is in the past, clear it immediately (cleanup will run on reload)
        next_chat_date: chatIsInPast ? null : chatDateParsed,
        notes: form.notes || null,
      }

      if (editing) {
        const updatePayload = chatIsInPast
          ? { ...payload, chats_completed: (editing.chats_completed ?? 0) + 1 }
          : payload
        const { error } = await supabase.from('contacts').update(updatePayload).eq('id', editing.id)
        if (error) { console.error('contacts update error:', error.message, error.details); setSaving(false); return }
        if (chatIsInPast && chatDateParsed) {
          await supabase.from('completed_chats').insert({
            contact_id: editing.id,
            user_id: user.id,
            chat_date: new Date(chatDateParsed).toISOString().slice(0, 10),
          })
        }
      } else {
        const insertPayload = chatIsInPast ? { ...payload, chats_completed: 1 } : payload
        const { data: newContact, error } = await supabase
          .from('contacts')
          .insert({ ...insertPayload, user_id: user.id })
          .select('id')
          .single()
        if (error) { console.error('contacts insert error:', error.message, error.details, error.hint); setSaving(false); return }
        if (chatIsInPast && chatDateParsed && newContact) {
          await supabase.from('completed_chats').insert({
            contact_id: newContact.id,
            user_id: user.id,
            chat_date: new Date(chatDateParsed).toISOString().slice(0, 10),
          })
        }
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
    if (!confirm('Delete this contact?')) return
    await supabase.from('contacts').delete().eq('id', id)
    load()
  }

  function openAdd() {
    setEditing(null)
    setFollowUps([])
    setShowModal(true)
  }

  function openEdit(c: Contact) {
    setEditing(c)
    setFollowUps([])
    setShowModal(true)
    loadFollowUps(c.id)
  }

  function closeModal() {
    setShowModal(false)
    setEditing(null)
    setFollowUps([])
  }

  const filtered = search.trim()
    ? contacts.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.firm ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (c.email ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : contacts

  const now = new Date()

  return (
    <div style={{ padding: '32px', maxWidth: 1300, background: '#f8fafc', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>Contacts</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>Your networking contacts and outreach history</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowUpcomingChats(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 13, fontWeight: 600, color: '#0f172a', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1'; (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.background = '#fff' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Upcoming Chats
            {contacts.filter((c) => c.next_chat_date && new Date(c.next_chat_date) >= now).length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#0d9488', borderRadius: 8, padding: '1px 6px', marginLeft: 2 }}>
                {contacts.filter((c) => c.next_chat_date && new Date(c.next_chat_date) >= now).length}
              </span>
            )}
          </button>
          <button
            onClick={openAdd}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#0d9488', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Contact
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 280, marginBottom: 16 }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#cbd5e1', pointerEvents: 'none' }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts…"
          style={{ ...inputStyle, paddingLeft: 32 }}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ overflowX: 'auto', borderRadius: 12 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: '#94a3b8', fontSize: 13 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" /></svg>
              </div>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#374151', margin: 0 }}>{search ? 'No contacts match' : 'No contacts yet'}</p>
              {!search && <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, marginBottom: 0 }}>Add your first contact above</p>}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['Name', 'Firm', 'Outreach Status', 'Date of Initial Contact', 'Last Contact', 'Follow Ups', 'Chats Had', 'Upcoming Chat', ''].map((h, i) => (
                    <th key={i} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const hasFutureChat = c.next_chat_date && new Date(c.next_chat_date) >= now
                  return (
                    <tr
                      key={c.id}
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none' }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
                      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      {/* Name */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0d9488', flexShrink: 0 }}>
                            {initials(c.name)}
                          </div>
                          <span style={{ fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap' }}>{c.name}</span>
                        </div>
                      </td>

                      {/* Firm */}
                      <td style={{ padding: '11px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>{c.firm ?? '—'}</td>

                      {/* Outreach Status */}
                      <td style={{ padding: '11px 14px' }}>
                        <StatusBadge status={c.outreach_status ?? 'To Reach Out'} />
                      </td>

                      {/* Date of Initial Contact */}
                      <td style={{ padding: '11px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {fmtDate(c.date_of_contact)}
                      </td>

                      {/* Last Contact Date */}
                      <td style={{ padding: '11px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {fmtDate(c.last_contact_date)}
                      </td>

                      {/* Total Follow Ups */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2} style={{ flexShrink: 0 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{c.total_follow_ups ?? 0}</span>
                        </div>
                      </td>

                      {/* Chats Had */}
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: (c.chats_completed ?? 0) > 0 ? '#0f172a' : '#cbd5e1' }}>
                          {c.chats_completed ?? 0}
                        </span>
                      </td>

                      {/* Upcoming Chat */}
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        {c.next_chat_date ? (
                          <span style={{ fontSize: 12, color: hasFutureChat ? '#0f172a' : '#cbd5e1' }}>
                            {hasFutureChat && (
                              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#0d9488', marginRight: 5, verticalAlign: 'middle' }} />
                            )}
                            {fmtDateTime(c.next_chat_date)}
                          </span>
                        ) : (
                          <span style={{ color: '#e2e8f0' }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            onClick={() => setLogFollowUp(c)}
                            style={{ fontSize: 12, fontWeight: 500, color: '#0d9488', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#ccfbf1' }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#f0fdfa' }}
                          >
                            Log Follow Up
                          </button>
                          <button
                            onClick={() => openEdit(c)}
                            style={{ fontSize: 12, fontWeight: 500, color: '#64748b', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#0f172a'; (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1' }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#64748b'; (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            style={{ fontSize: 12, fontWeight: 500, color: '#ef4444', background: '#fff', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fef2f2' }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Contact' : 'Add Contact'} onClose={closeModal} wide>
          <ContactForm
            initial={editing ? {
              name: editing.name,
              firm: editing.firm ?? '',
              email: editing.email ?? '',
              linkedin_url: editing.linkedin_url ?? '',
              phone: editing.phone ?? '',
              date_of_contact: editing.date_of_contact ?? '',
              outreach_status: editing.outreach_status ?? 'To Reach Out',
              email_sent_time: toDateTimeLocal(editing.email_sent_time),
              next_chat_date: toDateTimeLocal(editing.next_chat_date),
              notes: editing.notes ?? '',
            } : EMPTY_FORM}
            onSave={handleSave}
            onCancel={closeModal}
            saving={saving}
            isEdit={!!editing}
            contact={editing ?? undefined}
            followUps={followUps}
            loadingFollowUps={loadingFollowUps}
          />
        </Modal>
      )}

      {/* Log Follow Up Modal */}
      {logFollowUp && (
        <LogFollowUpModal
          contact={logFollowUp}
          onClose={() => setLogFollowUp(null)}
          onSaved={() => { setLogFollowUp(null); load() }}
        />
      )}

      {/* Upcoming Chats Modal */}
      {showUpcomingChats && (
        <UpcomingChatsModal
          contacts={contacts}
          onClose={() => setShowUpcomingChats(false)}
        />
      )}
    </div>
  )
}
