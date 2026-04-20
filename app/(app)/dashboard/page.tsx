'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// ── Types ──────────────────────────────────────────────────────────────────────

type FollowUpDue = {
  id: string
  name: string
  firm: string | null
  outreach_status: string
  last_contact_date: string | null
}

type EmailAnalyticsContact = {
  email_sent_time: string
  outreach_status: string
}

type Range = '7D' | '30D' | '3M' | 'All' | 'Custom'
type Metric = 'contacts' | 'firms' | 'applications' | 'questions' | 'accuracy'

interface DayPoint {
  date: string
  label: string
  contacts: number
  firms: number
  applications: number
  questions: number
  accuracy: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sub(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d
}

function getRange(range: Range, customStart: string): { start: Date; end: Date } {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  let start: Date
  if (range === '7D') start = sub(end, 7)
  else if (range === '30D') start = sub(end, 30)
  else if (range === '3M') start = sub(end, 90)
  else if (range === 'Custom' && customStart) start = new Date(customStart)
  else start = new Date('2024-01-01')
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

function generateDays(start: Date, end: Date): string[] {
  const days: string[] = []
  const cur = new Date(start)
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

function fmtLabel(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtRangeLabel(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`
}

function pct(a: number, b: number): string {
  if (b === 0) return a > 0 ? '+∞%' : '—'
  const diff = ((a - b) / b) * 100
  return `${diff >= 0 ? '+' : ''}${Math.round(diff)}%`
}

// ── Email breakdown helpers ───────────────────────────────────────────────────

const RESPONDED_STATUSES = ['Responded', 'Call Scheduled', 'In-Person Chat']

function getTimeSlot(hour: number): number | null {
  if (hour >= 6 && hour < 12) return 0   // Morning
  if (hour >= 12 && hour < 18) return 1  // Afternoon
  if (hour >= 18) return 2               // Evening
  return null
}

type SliceData = {
  name: string
  sent: number
  responded: number
  rate: number   // response rate 0–100, or -1 if no data
  value: number  // pie slice size = sent count
  color: string
}

function assignSliceColors(data: { sent: number; rate: number }[]): string[] {
  const withData = data.filter((d) => d.sent > 0)
  if (withData.length === 0) return data.map(() => '#e2e8f0')
  const maxR = Math.max(...withData.map((d) => d.rate))
  const minR = Math.min(...withData.map((d) => d.rate))
  return data.map((d) => {
    if (d.sent === 0) return '#e2e8f0'
    if (d.rate === maxR) return '#16a34a'
    if (d.rate === minR && maxR !== minR) return '#94a3b8'
    return '#f59e0b'
  })
}

function PieSliceTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: SliceData }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (d.sent === 0) return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <p style={{ fontWeight: 600, color: '#0f172a', margin: '0 0 2px' }}>{d.name}</p>
      <p style={{ color: '#94a3b8', margin: 0 }}>No emails sent</p>
    </div>
  )
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <p style={{ fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>{d.name}</p>
      <p style={{ color: '#64748b', margin: '0 0 2px' }}>{d.sent} sent · {d.responded} responded</p>
      <p style={{ fontWeight: 700, color: d.rate >= 50 ? '#16a34a' : d.rate >= 30 ? '#d97706' : '#64748b', margin: 0 }}>
        {d.rate}% response rate
      </p>
    </div>
  )
}

function EmailBreakdownModal({
  analytics,
  rangeLabel,
  onClose,
}: {
  analytics: EmailAnalyticsContact[]
  rangeLabel: string
  onClose: () => void
}) {
  const totalSent = analytics.length
  const hasEnoughData = totalSent >= 3

  // ── Time of day ──────────────────────────────────────────────────────────────
  const TOD_NAMES = ['Morning\n6am–12pm', 'Afternoon\n12pm–6pm', 'Evening\n6pm–12am']
  const todRaw = [0, 1, 2].map((si) => {
    const inSlot = analytics.filter((c) => getTimeSlot(new Date(c.email_sent_time).getHours()) === si)
    const sent = inSlot.length
    const responded = inSlot.filter((c) => RESPONDED_STATUSES.includes(c.outreach_status)).length
    return { name: TOD_NAMES[si], sent, responded, rate: sent > 0 ? Math.round((responded / sent) * 100) : -1 }
  })
  const todColors = assignSliceColors(todRaw)
  const todData: SliceData[] = todRaw.map((d, i) => ({ ...d, value: d.sent, color: todColors[i] }))

  // ── Day of week ──────────────────────────────────────────────────────────────
  const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dowRaw = [0, 1, 2, 3, 4, 5, 6].map((di) => {
    const inDay = analytics.filter((c) => new Date(c.email_sent_time).getDay() === di)
    const sent = inDay.length
    const responded = inDay.filter((c) => RESPONDED_STATUSES.includes(c.outreach_status)).length
    return { name: DOW_NAMES[di], sent, responded, rate: sent > 0 ? Math.round((responded / sent) * 100) : -1 }
  })
  const dowColors = assignSliceColors(dowRaw)
  const dowData: SliceData[] = dowRaw.map((d, i) => ({ ...d, value: d.sent, color: dowColors[i] }))
  const dowFiltered = dowData.filter((d) => d.sent > 0)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 740, background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 2px' }}>Email Response Rate Breakdown</h2>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
              {rangeLabel} · {totalSent} email{totalSent !== 1 ? 's' : ''} with send time logged
            </p>
          </div>
          <button onClick={onClose} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {!hasEnoughData ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#374151', margin: '0 0 4px' }}>Not enough data</p>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                {totalSent === 0
                  ? 'No email send times logged in this period. Set an Email Sent Time when editing contacts.'
                  : `Only ${totalSent} email${totalSent !== 1 ? 's' : ''} tracked in this period — need at least 3 for a meaningful breakdown.`}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

              {/* Chart 1: By Time of Day */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 16px' }}>By Time of Day</p>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={todData.filter((d) => d.sent > 0)}
                      dataKey="value"
                      cx="50%" cy="50%"
                      innerRadius={46} outerRadius={76}
                      paddingAngle={3}
                    >
                      {todData.filter((d) => d.sent > 0).map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieSliceTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                  {todData.map((d) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#374151', whiteSpace: 'pre-line', lineHeight: 1.3 }}>{d.name}</span>
                      </div>
                      {d.sent > 0 ? (
                        <span style={{ fontSize: 12, fontWeight: 600, color: d.rate >= 50 ? '#16a34a' : d.rate >= 30 ? '#d97706' : '#64748b' }}>
                          {d.rate}%{' '}
                          <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 11 }}>({d.responded}/{d.sent})</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#cbd5e1' }}>no data</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 2: By Day of Week */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 16px' }}>By Day of Week</p>
                {dowFiltered.length === 0 ? (
                  <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No emails in this period</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={dowFiltered}
                        dataKey="value"
                        cx="50%" cy="50%"
                        innerRadius={46} outerRadius={76}
                        paddingAngle={2}
                      >
                        {dowFiltered.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieSliceTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
                  {dowFiltered.map((d) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#374151' }}>{d.name}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: d.rate >= 50 ? '#16a34a' : d.rate >= 30 ? '#d97706' : '#64748b' }}>
                        {d.rate}%{' '}
                        <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 11 }}>({d.responded}/{d.sent})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, metric }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
  metric: Metric
}) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  const display = metric === 'accuracy' ? `${Math.round(val)}%` : val
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: 13 }}>
      <p style={{ color: '#94a3b8', margin: '0 0 2px', fontSize: 11 }}>{label}</p>
      <p style={{ color: '#0f172a', fontWeight: 600, margin: 0 }}>{display}</p>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

const METRIC_LABELS: Record<Metric, string> = {
  contacts: 'Contacts Added',
  firms: 'Firms Tracked',
  applications: 'Applications',
  questions: 'Questions Practiced',
  accuracy: 'Avg Accuracy',
}

function StatCard({ metric, value, delta, active, onClick, isLast }: {
  metric: Metric
  value: number
  delta: string
  active: boolean
  onClick: () => void
  isLast: boolean
}) {
  const isPos = delta.startsWith('+')
  const isNeg = delta.startsWith('-')
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '20px 24px 16px',
        textAlign: 'left',
        background: active ? '#f0fdfa' : 'transparent',
        border: 'none',
        borderRight: isLast ? 'none' : '1px solid #f1f5f9',
        borderBottom: active ? '2px solid #0d9488' : '2px solid transparent',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
        {METRIC_LABELS[metric]}
      </p>
      <p style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: '0 0 4px', lineHeight: 1 }}>
        {metric === 'accuracy' ? `${Math.round(value)}%` : value}
      </p>
      <p style={{ fontSize: 11, margin: 0, color: isPos ? '#059669' : isNeg ? '#dc2626' : '#94a3b8', fontWeight: 500 }}>
        {delta === '—' ? '— no data' : `${delta} vs previous period`}
      </p>
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const supabase = createClient()
  const [userName, setUserName] = useState('')
  const [range, setRange] = useState<Range>('30D')
  const [customStart, setCustomStart] = useState('')
  const [activeMetric, setActiveMetric] = useState<Metric>('contacts')
  const [data, setData] = useState<DayPoint[]>([])
  const [totals, setTotals] = useState({ contacts: 0, firms: 0, applications: 0, questions: 0, accuracy: 0 })
  const [prevTotals, setPrevTotals] = useState({ contacts: 0, firms: 0, applications: 0, questions: 0, accuracy: 0 })
  const [loading, setLoading] = useState(true)
  const [followUpsDue, setFollowUpsDue] = useState<FollowUpDue[]>([])
  const [chatsScheduled, setChatsScheduled] = useState(0)
  const [chatsHad, setChatsHad] = useState(0)
  const [emailAnalytics, setEmailAnalytics] = useState<EmailAnalyticsContact[]>([])
  const [emailStatsTotal, setEmailStatsTotal] = useState({ sent: 0, responded: 0 })
  const [showBreakdown, setShowBreakdown] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        const prefix = user.email.split('@')[0].split(/[._]/)[0]
        setUserName(prefix.charAt(0).toUpperCase() + prefix.slice(1))
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    setLoading(true)
    const { start, end } = getRange(range, customStart)
    const periodMs = end.getTime() - start.getTime()
    const prevStart = new Date(start.getTime() - periodMs)
    const prevEnd = new Date(start.getTime() - 1)

    type SessionRow = { created_at: string; questions_answered: number; questions_correct: number; questions_skipped: number }
    const empty: SessionRow[] = []

    async function fetchSessions(from: string, to: string): Promise<SessionRow[]> {
      try {
        const res = await supabase.from('practice_sessions').select('created_at, questions_answered, questions_correct, questions_skipped').gte('created_at', from).lte('created_at', to)
        return (res.data ?? empty) as SessionRow[]
      } catch { return empty }
    }

    const [contactsRes, firmsRes, prevContactsRes, prevFirmsRes, sessions, prevSessions] = await Promise.all([
      supabase.from('contacts').select('created_at').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
      supabase.from('firms').select('created_at, status').gte('created_at', start.toISOString()).lte('created_at', end.toISOString()),
      supabase.from('contacts').select('created_at').gte('created_at', prevStart.toISOString()).lte('created_at', prevEnd.toISOString()),
      supabase.from('firms').select('created_at, status').gte('created_at', prevStart.toISOString()).lte('created_at', prevEnd.toISOString()),
      fetchSessions(start.toISOString(), end.toISOString()),
      fetchSessions(prevStart.toISOString(), prevEnd.toISOString()),
    ])

    const contacts = contactsRes.data ?? []
    const firms = firmsRes.data ?? []
    const prevContacts = prevContactsRes.data ?? []
    const prevFirms = prevFirmsRes.data ?? []

    type ContactRow = { created_at: string }
    type FirmRow = { created_at: string; status: string }
    const contactList = (contacts as ContactRow[])
    const firmList = (firms as FirmRow[])
    const prevContactList = (prevContacts as ContactRow[])
    const prevFirmList = (prevFirms as FirmRow[])

    const days = generateDays(start, end)
    const series: DayPoint[] = days.map((dateKey) => {
      const dayContacts = contactList.filter((c) => c.created_at.slice(0, 10) === dateKey).length
      const dayFirms = firmList.filter((f) => f.created_at.slice(0, 10) === dateKey).length
      const dayApps = firmList.filter((f) => f.created_at.slice(0, 10) === dateKey && f.status !== 'prospective').length
      const daySessions = sessions.filter((s) => s.created_at.slice(0, 10) === dateKey)
      // "Questions Practiced" = self-assessed + skipped (all questions touched)
      const dayQ = daySessions.reduce((sum, s) => sum + (s.questions_answered || 0) + (s.questions_skipped || 0), 0)
      const dayC = daySessions.reduce((sum, s) => sum + (s.questions_correct || 0), 0)
      const dayAnswered = daySessions.reduce((sum, s) => sum + (s.questions_answered || 0), 0)
      return {
        date: dateKey,
        label: fmtLabel(dateKey),
        contacts: dayContacts,
        firms: dayFirms,
        applications: dayApps,
        questions: dayQ,
        accuracy: dayAnswered > 0 ? (dayC / dayAnswered) * 100 : 0,
      }
    })
    setData(series)

    const totalQ   = sessions.reduce((s, r) => s + (r.questions_answered || 0) + (r.questions_skipped || 0), 0)
    const totalAns = sessions.reduce((s, r) => s + (r.questions_answered || 0), 0)
    const totalC   = sessions.reduce((s, r) => s + (r.questions_correct || 0), 0)
    setTotals({
      contacts: contactList.length,
      firms: firmList.length,
      applications: firmList.filter((f) => f.status !== 'prospective').length,
      questions: totalQ,
      accuracy: totalAns > 0 ? (totalC / totalAns) * 100 : 0,
    })

    const pQ   = prevSessions.reduce((s, r) => s + (r.questions_answered || 0) + (r.questions_skipped || 0), 0)
    const pAns = prevSessions.reduce((s, r) => s + (r.questions_answered || 0), 0)
    const pC   = prevSessions.reduce((s, r) => s + (r.questions_correct || 0), 0)
    setPrevTotals({
      contacts: prevContactList.length,
      firms: prevFirmList.length,
      applications: prevFirmList.filter((f) => f.status !== 'prospective').length,
      questions: pQ,
      accuracy: pAns > 0 ? (pC / pAns) * 100 : 0,
    })

    // Chats scheduled (future, regardless of range)
    try {
      const nowIso = new Date().toISOString()
      const { data: upcoming } = await supabase
        .from('contacts')
        .select('id')
        .not('next_chat_date', 'is', null)
        .gte('next_chat_date', nowIso)
      console.log('dashboard/chats scheduled:', upcoming?.length ?? 0, '| nowIso:', nowIso)
      setChatsScheduled(upcoming?.length ?? 0)
    } catch (err) {
      console.error('dashboard/chats scheduled error:', err)
      setChatsScheduled(0)
    }

    // Chats completed within the selected date range
    try {
      const startStr = start.toISOString().slice(0, 10)
      const endStr = end.toISOString().slice(0, 10)
      const { data: completed } = await supabase
        .from('completed_chats')
        .select('id')
        .gte('chat_date', startStr)
        .lte('chat_date', endStr)
      console.log('dashboard/chats had:', completed?.length ?? 0)
      setChatsHad(completed?.length ?? 0)
    } catch (err) {
      console.error('dashboard/chats had error:', err)
      setChatsHad(0)
    }

    // Period-filtered email stats for Response Rate and Emails Sent stat cards
    // Filtered by date_of_contact so they respect the selected date range
    try {
      const startStr = start.toISOString().slice(0, 10)
      const endStr = end.toISOString().slice(0, 10)
      const { data: periodEmailContacts } = await supabase
        .from('contacts')
        .select('outreach_status')
        .in('outreach_status', ['Email Sent', 'Responded', 'Call Scheduled', 'In-Person Chat', 'Following Up'])
        .gte('date_of_contact', startStr)
        .lte('date_of_contact', endStr)
      const pEC = (periodEmailContacts ?? []) as { outreach_status: string }[]
      setEmailStatsTotal({
        sent: pEC.length,
        responded: pEC.filter((c) => ['Responded', 'Call Scheduled', 'In-Person Chat'].includes(c.outreach_status)).length,
      })
    } catch {
      setEmailStatsTotal({ sent: 0, responded: 0 })
    }

    // Email analytics — ALL contacts with email_sent_time logged (for heatmap)
    try {
      const { data: emailData } = await supabase
        .from('contacts')
        .select('email_sent_time, outreach_status')
        .not('email_sent_time', 'is', null)
      setEmailAnalytics((emailData ?? []) as EmailAnalyticsContact[])
    } catch {
      setEmailAnalytics([])
    }

    // Follow Ups Due — contacts not yet at 'In-Person Chat' with last_contact_date > 7 days ago
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10)
    try {
      const { data: due } = await supabase
        .from('contacts')
        .select('id, name, firm, outreach_status, last_contact_date')
        .neq('outreach_status', 'In-Person Chat')
        .lt('last_contact_date', sevenDaysAgoStr)
        .order('last_contact_date', { ascending: true })
        .limit(8)
      setFollowUpsDue((due ?? []) as FollowUpDue[])
    } catch {
      setFollowUpsDue([])
    }

    setLoading(false)
  }, [range, customStart]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const { start, end } = getRange(range, customStart)
  const rangeLabel = fmtRangeLabel(start, end)

  // Filter email analytics to the selected period (by email_sent_time)
  const periodEmailAnalytics = emailAnalytics.filter((c) => {
    const t = new Date(c.email_sent_time).getTime()
    return t >= start.getTime() && t <= end.getTime()
  })

  const metrics: Metric[] = ['contacts', 'firms', 'applications', 'questions', 'accuracy']
  const tickInterval = data.length <= 7 ? 0 : data.length <= 30 ? 4 : data.length <= 90 ? 13 : 29

  return (
    <div style={{ padding: '32px 36px', minHeight: '100%', background: '#f8fafc' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
            Welcome back{userName ? `, ${userName}` : ''}
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Here&apos;s what&apos;s happening in your recruiting pipeline.
          </p>
        </div>
        <button
          style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, color: '#ffffff', background: '#0d9488', border: 'none', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap', marginTop: 4 }}
          onClick={() => {
            const rows = [['Date', 'Contacts', 'Firms', 'Applications', 'Questions', 'Accuracy %'], ...data.map((d) => [d.date, d.contacts, d.firms, d.applications, d.questions, d.accuracy.toFixed(1)])]
            const csv = rows.map((r) => r.join(',')).join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = 'dashboard.csv'; a.click()
            URL.revokeObjectURL(url)
          }}
        >
          Export data
        </button>
      </div>

      {/* Date range selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
          {(['7D', '30D', '3M', 'All', 'Custom'] as Range[]).map((r, i, arr) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 500,
                border: 'none',
                borderRight: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
                background: range === r ? '#0d9488' : 'transparent',
                color: range === r ? '#fff' : '#64748b',
                cursor: 'pointer',
              }}
            >
              {r === '7D' ? 'Last 7 days' : r === '30D' ? 'Last 30 days' : r === '3M' ? 'Last 3 months' : r}
            </button>
          ))}
        </div>
        {range === 'Custom' && (
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            style={{ padding: '7px 12px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#0f172a', outline: 'none' }}
          />
        )}
        <span style={{ fontSize: 13, color: '#94a3b8' }}>{rangeLabel}</span>
      </div>

      {/* Main chart card */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: 20 }}>

        {/* Stat cards row */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
          {metrics.map((m, i) => (
            <StatCard
              key={m}
              metric={m}
              value={totals[m]}
              delta={pct(totals[m], prevTotals[m])}
              active={activeMetric === m}
              onClick={() => setActiveMetric(m)}
              isLast={i === metrics.length - 1}
            />
          ))}
        </div>

        {/* Response Rate + Emails Sent row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
          <div style={{ padding: '14px 24px', borderRight: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' }}>Response Rate</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 3px', lineHeight: 1 }}>
              {emailStatsTotal.sent > 0 ? `${Math.round((emailStatsTotal.responded / emailStatsTotal.sent) * 100)}%` : '0%'}
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 10px' }}>
              {emailStatsTotal.responded} response{emailStatsTotal.responded !== 1 ? 's' : ''} out of {emailStatsTotal.sent} email{emailStatsTotal.sent !== 1 ? 's' : ''} sent · {rangeLabel}
            </p>
            <button
              onClick={() => setShowBreakdown(true)}
              style={{ fontSize: 11, fontWeight: 600, color: '#0d9488', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#ccfbf1' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#f0fdfa' }}
            >
              View Breakdown
            </button>
          </div>
          <div style={{ padding: '14px 24px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' }}>Emails Sent</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 3px', lineHeight: 1 }}>
              {emailStatsTotal.sent}
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
              {emailStatsTotal.responded} responded · {rangeLabel}
            </p>
          </div>
        </div>

        {/* Chart area */}
        <div style={{ padding: '24px 20px 12px' }}>
          {loading ? (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ccfbf1" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#ccfbf1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={tickInterval} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={activeMetric === 'accuracy' ? (v: number) => `${v}%` : undefined} />
                <Tooltip content={<CustomTooltip metric={activeMetric} />} />
                <Area type="monotone" dataKey={activeMetric} stroke="#0d9488" strokeWidth={2} fill="url(#grad)" dot={false} activeDot={{ r: 4, fill: '#0d9488', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ padding: '4px 24px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d9488' }} />
          <span style={{ fontSize: 12, color: '#64748b' }}>{METRIC_LABELS[activeMetric]}</span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>— {rangeLabel}</span>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>

        {/* Pipeline status */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 14px' }}>Pipeline Status</p>
          {[
            { label: 'Prospective', color: '#94a3b8' },
            { label: 'Applied', color: '#3b82f6' },
            { label: 'Interview', color: '#f59e0b' },
            { label: 'Offer', color: '#10b981' },
            { label: 'Rejected', color: '#ef4444' },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#374151' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 14px' }}>Quick Actions</p>
          {[
            { label: 'Add a new contact', href: '/contacts' },
            { label: 'Track a new firm', href: '/firms' },
            { label: 'Start practice session', href: '/practice' },
            { label: 'View reminders', href: '/reminders' },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#0d9488', textDecoration: 'none', fontWeight: 500, marginBottom: 10 }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = '#0f766e'}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = '#0d9488'}
            >
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {label}
            </a>
          ))}
        </div>

        {/* Chats */}
        <a
          href="/contacts"
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', textDecoration: 'none', display: 'block', transition: 'border-color 0.15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>Chats</p>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V10a2 2 0 012-2h8z" />
            </svg>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
            <div>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 2px', lineHeight: 1 }}>{chatsHad}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>had · {rangeLabel}</p>
            </div>
            <div style={{ width: 1, background: '#f1f5f9' }} />
            <div>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 2px', lineHeight: 1 }}>{chatsScheduled}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>upcoming</p>
            </div>
          </div>
        </a>

        {/* Period summary */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 14px' }}>Period Summary</p>
          {[
            { label: 'Contacts added', value: totals.contacts },
            { label: 'Firms tracked', value: totals.firms },
            { label: 'Applications', value: totals.applications },
            { label: 'Questions practiced', value: totals.questions },
            { label: 'Avg accuracy', value: totals.accuracy > 0 ? `${Math.round(totals.accuracy)}%` : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Follow Ups Due */}
      <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>Follow Ups Due</p>
          {followUpsDue.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '1px 7px' }}>
              {followUpsDue.length}
            </span>
          )}
        </div>

        {followUpsDue.length === 0 ? (
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            No follow ups due — you&apos;re all caught up.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {followUpsDue.map((c) => {
              const days = c.last_contact_date
                ? Math.floor((Date.now() - new Date(c.last_contact_date + 'T12:00:00').getTime()) / 86400000)
                : null
              return (
                <a
                  key={c.id}
                  href="/contacts"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: '#fafafa', border: '1px solid #f1f5f9', textDecoration: 'none', transition: 'border-color 0.15s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#f1f5f9' }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.firm ?? 'No firm'} · {c.outreach_status}
                    </p>
                  </div>
                  {days !== null && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: days >= 30 ? '#dc2626' : '#d97706', background: days >= 30 ? '#fef2f2' : '#fffbeb', border: `1px solid ${days >= 30 ? '#fecaca' : '#fde68a'}`, borderRadius: 10, padding: '2px 8px', marginLeft: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {days}d ago
                    </span>
                  )}
                </a>
              )
            })}
          </div>
        )}
      </div>

      {/* Best Time to Send Emails — always shown */}
      {(() => {
        const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const SLOTS = ['Morning\n6am–12pm', 'Afternoon\n12pm–6pm', 'Evening\n6pm–12am']
        const RESPONDED_STATUSES = ['Responded', 'Call Scheduled', 'In-Person Chat']

        function getSlot(hour: number): number | null {
          if (hour >= 6 && hour < 12) return 0
          if (hour >= 12 && hour < 18) return 1
          if (hour >= 18) return 2
          return null
        }

        const sentGrid: number[][] = Array.from({ length: 7 }, () => [0, 0, 0])
        const respondedGrid: number[][] = Array.from({ length: 7 }, () => [0, 0, 0])
        emailAnalytics.forEach(({ email_sent_time, outreach_status }) => {
          const d = new Date(email_sent_time)
          const slot = getSlot(d.getHours())
          if (slot === null) return
          sentGrid[d.getDay()][slot]++
          if (RESPONDED_STATUSES.includes(outreach_status)) respondedGrid[d.getDay()][slot]++
        })

        // Best window = highest response rate among cells with ≥ 2 sent
        let bestDay = -1, bestSlot = -1, bestRate = -1
        sentGrid.forEach((row, di) => row.forEach((cnt, si) => {
          if (cnt >= 2) {
            const rate = respondedGrid[di][si] / cnt
            if (rate > bestRate) { bestRate = rate; bestDay = di; bestSlot = si }
          }
        }))

        const hasData = emailAnalytics.length > 0

        return (
          <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>Best Time to Send Emails</p>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                {!hasData
                  ? 'Log email send times on contacts to see response rate analytics'
                  : bestDay >= 0
                  ? <>Tracking {emailAnalytics.length} emails · Best window: <span style={{ fontWeight: 600, color: '#16a34a' }}>{DAYS[bestDay]} {SLOTS[bestSlot].split('\n')[0]}</span> at <span style={{ fontWeight: 600, color: '#16a34a' }}>{Math.round(bestRate * 100)}% response rate</span></>
                  : `Tracking ${emailAnalytics.length} email${emailAnalytics.length !== 1 ? 's' : ''} · send more to see the best window`
                }
              </p>
            </div>

            {!hasData ? (
              <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0 }}>No email send times logged yet.</p>
            ) : (
              <>
                {/* Legend */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                  {[
                    { label: '>50% response rate', bg: '#f0fdf4', color: '#16a34a' },
                    { label: '30–50%', bg: '#fffbeb', color: '#d97706' },
                    { label: '<30%', bg: '#f1f5f9', color: '#64748b' },
                  ].map(({ label, bg, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: bg, border: `1px solid ${color}30` }} />
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
                    </div>
                  ))}
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '6px 16px 6px 0', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', minWidth: 44 }}> </th>
                        {SLOTS.map((slot) => (
                          <th key={slot} style={{ padding: '6px 12px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#64748b', whiteSpace: 'pre-line', lineHeight: 1.3 }}>
                            {slot}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS.map((day, di) => (
                        <tr key={day}>
                          <td style={{ padding: '4px 16px 4px 0', fontWeight: 600, color: '#374151', fontSize: 12 }}>{day}</td>
                          {[0, 1, 2].map((si) => {
                            const sent = sentGrid[di][si]
                            const responded = respondedGrid[di][si]
                            const rate = sent > 0 ? Math.round((responded / sent) * 100) : null
                            const isBest = di === bestDay && si === bestSlot

                            let bg = '#f8fafc', textColor = '#cbd5e1', borderColor = 'transparent'
                            if (rate !== null) {
                              if (rate >= 50)      { bg = '#f0fdf4'; textColor = '#16a34a'; borderColor = '#bbf7d0' }
                              else if (rate >= 30) { bg = '#fffbeb'; textColor = '#d97706'; borderColor = '#fde68a' }
                              else                 { bg = '#f1f5f9'; textColor = '#64748b'; borderColor = '#e2e8f0' }
                            }

                            return (
                              <td key={si} style={{ padding: '3px 6px', textAlign: 'center' }}>
                                <div style={{
                                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                  width: 84, height: 52, borderRadius: 8, background: bg,
                                  border: isBest && rate !== null ? '2px solid #0d9488' : `1px solid ${borderColor}`,
                                  gap: 1,
                                }}>
                                  {rate === null ? (
                                    <span style={{ color: '#e2e8f0', fontSize: 14 }}>—</span>
                                  ) : (
                                    <>
                                      <span style={{ fontSize: 15, fontWeight: 700, color: textColor, lineHeight: 1 }}>{rate}%</span>
                                      <span style={{ fontSize: 10, color: textColor, opacity: 0.75, lineHeight: 1 }}>{responded}/{sent}</span>
                                    </>
                                  )}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )
      })()}

      {/* Email Breakdown Modal */}
      {showBreakdown && (
        <EmailBreakdownModal
          analytics={periodEmailAnalytics}
          rangeLabel={rangeLabel}
          onClose={() => setShowBreakdown(false)}
        />
      )}
    </div>
  )
}
