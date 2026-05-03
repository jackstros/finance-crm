'use client'

import { useState, useMemo } from 'react'
import type { CalendarEventRow } from './page'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function CalendarClient({
  initialEvents,
  connected,
}: {
  initialEvents: CalendarEventRow[]
  connected:     boolean
}) {
  const today = new Date()

  const [events,        setEvents]        = useState<CalendarEventRow[]>(initialEvents)
  const [viewYear,      setViewYear]      = useState(today.getFullYear())
  const [viewMonth,     setViewMonth]     = useState(today.getMonth())
  const [selected,      setSelected]      = useState<CalendarEventRow | null>(null)
  const [recruitingOnly, setRecruitingOnly] = useState(false)
  const [syncing,       setSyncing]       = useState(false)
  const [syncMsg,       setSyncMsg]       = useState<string | null>(null)
  const [syncError,     setSyncError]     = useState<string | null>(null)
  const [followUpNotes, setFollowUpNotes] = useState('')
  const [savingFollowUp, setSavingFollowUp] = useState(false)

  // New event modal
  const [showNewEvent, setShowNewEvent]   = useState(false)
  const [newForm, setNewForm] = useState({
    subject:   '',
    date:      '',
    startHour: '09',
    startMin:  '00',
    endHour:   '10',
    endMin:    '00',
    location:  '',
    notes:     '',
  })
  const [savingNew, setSavingNew] = useState(false)

  const displayed = useMemo(
    () => recruitingOnly ? events.filter((e) => e.is_recruiting) : events,
    [events, recruitingOnly]
  )

  // Map day → events for fast lookup
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventRow[]>()
    for (const ev of displayed) {
      const key = ev.start_time.slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(ev)
    }
    return map
  }, [displayed])

  // ── Sync ──────────────────────────────────────────────────────────────────

  async function handleSync() {
    setSyncing(true)
    setSyncMsg(null)
    setSyncError(null)
    try {
      const res  = await fetch('/api/calendar/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'calendar_scope_missing') {
          setSyncError('Calendar access not granted. Please reconnect Outlook in Settings to add calendar permissions.')
        } else {
          setSyncError(data.error ?? 'Sync failed')
        }
        return
      }
      setSyncMsg(`Synced ${data.synced} events · ${data.linked} linked to contacts · ${data.statusUpdates} status updates`)
      // Reload events
      const reload = await fetch('/api/calendar/list')
      if (reload.ok) {
        const { events: fresh } = await reload.json()
        setEvents(fresh)
      }
    } catch {
      setSyncError('Network error during sync')
    } finally {
      setSyncing(false)
    }
  }

  // ── Follow-up logging ─────────────────────────────────────────────────────

  async function handleLogFollowUp() {
    if (!selected) return
    setSavingFollowUp(true)
    try {
      const res = await fetch('/api/follow-ups', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id:     selected.contact_id,
          follow_up_date: selected.start_time.slice(0, 10),
          notes:          followUpNotes || `Follow-up from: ${selected.title}`,
        }),
      })
      if (!res.ok) throw new Error('Failed to log follow-up')

      // Mark follow_up_logged on calendar_events row
      await fetch(`/api/calendar/events/${selected.id}/follow-up`, { method: 'POST' })

      setEvents((prev) =>
        prev.map((e) => e.id === selected.id ? { ...e, follow_up_logged: true } : e)
      )
      setSelected((prev) => prev ? { ...prev, follow_up_logged: true } : prev)
      setFollowUpNotes('')
    } catch (err) {
      console.error(err)
    } finally {
      setSavingFollowUp(false)
    }
  }

  // ── New event ──────────────────────────────────────────────────────────────

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!newForm.subject || !newForm.date) return
    setSavingNew(true)
    try {
      const startTime = `${newForm.date}T${newForm.startHour}:${newForm.startMin}:00`
      const endTime   = `${newForm.date}T${newForm.endHour}:${newForm.endMin}:00`
      const res = await fetch('/api/calendar/events', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: newForm.subject, startTime, endTime, location: newForm.location, notes: newForm.notes }),
      })
      if (!res.ok) throw new Error('Failed to create event')
      setShowNewEvent(false)
      setNewForm({ subject: '', date: '', startHour: '09', startMin: '00', endHour: '10', endMin: '00', location: '', notes: '' })
      // Reload
      const reload = await fetch('/api/calendar/list')
      if (reload.ok) {
        const { events: fresh } = await reload.json()
        setEvents(fresh)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingNew(false)
    }
  }

  // ── Month navigation ──────────────────────────────────────────────────────

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }

  // ── Grid cells ────────────────────────────────────────────────────────────

  const daysInMonth  = getDaysInMonth(viewYear, viewMonth)
  const firstDayDow  = getFirstDayOfMonth(viewYear, viewMonth)
  const totalCells   = Math.ceil((firstDayDow + daysInMonth) / 7) * 7

  const isPast = selected
    ? new Date(selected.start_time) < today && !isSameDay(new Date(selected.start_time), today)
    : false

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
      {/* Header */}
      <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Calendar</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>Outlook events synced with your recruiting contacts</p>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={recruitingOnly}
            onChange={(e) => setRecruitingOnly(e.target.checked)}
            style={{ accentColor: '#0f766e' }}
          />
          Recruiting only
        </label>

        {connected && (
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: syncing ? '#f1f5f9' : '#ffffff', color: '#0f172a',
              fontSize: 13, fontWeight: 500, cursor: syncing ? 'default' : 'pointer',
            }}
          >
            {syncing ? 'Syncing...' : 'Sync Calendar'}
          </button>
        )}

        <button
          onClick={() => setShowNewEvent(true)}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: '#0f766e', color: '#ffffff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          + New Event
        </button>
      </div>

      {/* Sync messages */}
      {syncMsg && (
        <div style={{ padding: '10px 28px', background: '#f0fdfa', borderBottom: '1px solid #99f6e4', fontSize: 13, color: '#0d9488' }}>
          {syncMsg}
        </div>
      )}
      {syncError && (
        <div style={{ padding: '10px 28px', background: '#fef2f2', borderBottom: '1px solid #fecaca', fontSize: 13, color: '#dc2626' }}>
          {syncError}
        </div>
      )}

      {/* Calendar grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px 28px' }}>
        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <button onClick={prevMonth} style={navBtnStyle}>&#8249;</button>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', minWidth: 160, textAlign: 'center' }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} style={navBtnStyle}>&#8250;</button>
          <button
            onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()) }}
            style={{ marginLeft: 8, padding: '4px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 12, cursor: 'pointer' }}
          >
            Today
          </button>
        </div>

        {/* Day-of-week header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 1 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#94a3b8', padding: '6px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, flex: 1, background: '#e2e8f0', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
          {Array.from({ length: totalCells }).map((_, i) => {
            const dayNum = i - firstDayDow + 1
            const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth
            const dateStr = isCurrentMonth
              ? `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
              : null
            const dayEvents = dateStr ? (eventsByDay.get(dateStr) ?? []) : []
            const cellDate = dateStr ? new Date(dateStr + 'T12:00:00') : null
            const isToday = cellDate ? isSameDay(cellDate, today) : false

            return (
              <div
                key={i}
                style={{
                  background: isToday ? '#f0fdfa' : '#ffffff',
                  minHeight: 90,
                  padding: '6px 4px',
                  opacity: isCurrentMonth ? 1 : 0.3,
                }}
              >
                <div style={{
                  fontSize: 12, fontWeight: isToday ? 700 : 400,
                  color: isToday ? '#0f766e' : '#475569',
                  marginBottom: 4, textAlign: 'right', paddingRight: 4,
                }}>
                  {isCurrentMonth ? dayNum : ''}
                </div>
                {dayEvents.slice(0, 3).map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => { setSelected(ev); setFollowUpNotes('') }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '2px 5px', borderRadius: 4, marginBottom: 2,
                      fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer',
                      background: ev.is_recruiting ? '#f0fdfa' : '#f8fafc',
                      color:      ev.is_recruiting ? '#0d9488' : '#64748b',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {ev.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <div style={{ fontSize: 10, color: '#94a3b8', paddingLeft: 4 }}>+{dayEvents.length - 3} more</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Event detail modal */}
      {selected && (
        <div
          style={overlayStyle}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null) }}
        >
          <div style={{ ...modalStyle, maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>{selected.title}</h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  {formatDate(selected.start_time)} · {formatTime(selected.start_time)} – {formatTime(selected.end_time)}
                </p>
              </div>
              <button onClick={() => setSelected(null)} style={closeBtnStyle}>&#x2715;</button>
            </div>

            {selected.location && (
              <p style={detailRowStyle}><span style={labelStyle}>Location</span>{selected.location}</p>
            )}
            {selected.contacts && (
              <p style={detailRowStyle}>
                <span style={labelStyle}>Contact</span>
                {selected.contacts.name}
                {selected.contacts.firm ? ` · ${selected.contacts.firm}` : ''}
              </p>
            )}
            {selected.organizer_email && (
              <p style={detailRowStyle}><span style={labelStyle}>Organizer</span>{selected.organizer_email}</p>
            )}
            {selected.body_preview && (
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 12, lineHeight: 1.5, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                {selected.body_preview}
              </p>
            )}

            {/* Follow-up prompt for past recruiting events */}
            {isPast && selected.is_recruiting && selected.contact_id && (
              <div style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                {selected.follow_up_logged ? (
                  <p style={{ fontSize: 13, color: '#16a34a', fontWeight: 500 }}>Follow-up logged</p>
                ) : (
                  <>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>Log a follow-up for this meeting</p>
                    <textarea
                      value={followUpNotes}
                      onChange={(e) => setFollowUpNotes(e.target.value)}
                      placeholder="Notes (optional)"
                      rows={2}
                      style={textareaStyle}
                    />
                    <button
                      onClick={handleLogFollowUp}
                      disabled={savingFollowUp}
                      style={{ ...primaryBtnStyle, marginTop: 8 }}
                    >
                      {savingFollowUp ? 'Saving...' : 'Log Follow-up'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New event modal */}
      {showNewEvent && (
        <div
          style={overlayStyle}
          onClick={(e) => { if (e.target === e.currentTarget) setShowNewEvent(false) }}
        >
          <div style={{ ...modalStyle, maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0, flex: 1 }}>New Calendar Event</h2>
              <button onClick={() => setShowNewEvent(false)} style={closeBtnStyle}>&#x2715;</button>
            </div>
            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={fieldLabelStyle}>Subject</label>
                <input required value={newForm.subject} onChange={(e) => setNewForm({ ...newForm, subject: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={fieldLabelStyle}>Date</label>
                <input required type="date" value={newForm.date} onChange={(e) => setNewForm({ ...newForm, date: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={fieldLabelStyle}>Start time</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <select value={newForm.startHour} onChange={(e) => setNewForm({ ...newForm, startHour: e.target.value })} style={selectStyle}>
                      {hours.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <select value={newForm.startMin} onChange={(e) => setNewForm({ ...newForm, startMin: e.target.value })} style={selectStyle}>
                      {mins.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={fieldLabelStyle}>End time</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <select value={newForm.endHour} onChange={(e) => setNewForm({ ...newForm, endHour: e.target.value })} style={selectStyle}>
                      {hours.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <select value={newForm.endMin} onChange={(e) => setNewForm({ ...newForm, endMin: e.target.value })} style={selectStyle}>
                      {mins.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label style={fieldLabelStyle}>Location (optional)</label>
                <input value={newForm.location} onChange={(e) => setNewForm({ ...newForm, location: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={fieldLabelStyle}>Notes (optional)</label>
                <textarea value={newForm.notes} onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })} rows={2} style={textareaStyle} />
              </div>
              <button type="submit" disabled={savingNew} style={{ ...primaryBtnStyle, marginTop: 4 }}>
                {savingNew ? 'Creating...' : 'Create Event'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Style constants ───────────────────────────────────────────────────────────

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const mins  = ['00', '15', '30', '45']

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
}

const modalStyle: React.CSSProperties = {
  background: '#ffffff', borderRadius: 14, padding: 24, width: '100%',
  boxShadow: '0 20px 60px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto',
}

const navBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0',
  background: '#ffffff', color: '#475569', fontSize: 18, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
}

const closeBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#94a3b8', fontSize: 18, padding: 4, lineHeight: 1,
}

const detailRowStyle: React.CSSProperties = {
  fontSize: 13, color: '#0f172a', margin: '6px 0', display: 'flex', gap: 8,
}

const labelStyle: React.CSSProperties = {
  color: '#94a3b8', minWidth: 72, fontWeight: 500,
}

const primaryBtnStyle: React.CSSProperties = {
  padding: '9px 18px', borderRadius: 8, border: 'none',
  background: '#0f766e', color: '#ffffff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  alignSelf: 'flex-start',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #e2e8f0',
  fontSize: 13, color: '#0f172a', outline: 'none', boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  flex: 1, padding: '7px 6px', borderRadius: 7, border: '1px solid #e2e8f0',
  fontSize: 13, color: '#0f172a', outline: 'none',
}

const textareaStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #e2e8f0',
  fontSize: 13, color: '#0f172a', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
}

const fieldLabelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#475569',
  marginBottom: 5, letterSpacing: '0.02em',
}
