'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { TOPIC_LABELS, QUESTION_TYPE_LABELS, TOPICS, type Topic, type QuestionType } from '@/lib/questions'

type RecentContact = {
  id: string
  name: string
  firm: string | null
  date_of_contact: string | null
}

type PracticeBreakdown = {
  byType: { type: QuestionType; score: number; total: number }[]
  byTopic: { topic: Topic; score: number; total: number }[]
}

const TOPIC_DOT: Record<Topic, string> = {
  accounting:        'bg-[#4A90E2]',
  valuation:         'bg-[#9B59B6]',
  dcf:               'bg-[#5B8AF0]',
  lbo:               'bg-[#E67E22]',
  ma:                'bg-[#1ABC9C]',
  restructuring:     'bg-[#E74C3C]',
  financial_markets: 'bg-[#F39C12]',
}


function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}) {
  return (
    <div className="bg-n8 rounded-xl border border-n7 px-6 py-5">
      <p className="text-xs font-medium text-muted uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-semibold mt-2 ${accent ? 'text-gold' : 'text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  )
}

const STATUS_COLORS: Record<string, { label: string; bar: string; badge: string }> = {
  prospective: { label: 'Prospective', bar: 'bg-muted',  badge: 'bg-n7 text-muted' },
  applied:     { label: 'Applied',     bar: 'bg-[#4A90E2]', badge: 'bg-[#4A90E2]/20 text-[#4A90E2]' },
  interview:   { label: 'Interview',   bar: 'bg-warn',   badge: 'bg-warn/20 text-warn' },
  offer:       { label: 'Offer',       bar: 'bg-pos',    badge: 'bg-pos/20 text-pos' },
  rejected:    { label: 'Rejected',    bar: 'bg-neg',    badge: 'bg-neg/20 text-neg' },
}

export default function DashboardPage() {
  const supabase = createClient()
  const [contactsCount, setContactsCount] = useState<number>(0)
  const [firmsCount, setFirmsCount] = useState<number>(0)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    prospective: 0, applied: 0, interview: 0, offer: 0, rejected: 0,
  })
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([])
  const [practiceScore, setPracticeScore] = useState<string>('—')
  const [practiceBreakdown, setPracticeBreakdown] = useState<PracticeBreakdown | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const score = localStorage.getItem('practice_last_score')
    if (score) setPracticeScore(score)

    const raw = localStorage.getItem('practice_breakdown')
    if (raw) {
      try { setPracticeBreakdown(JSON.parse(raw)) } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    async function load() {
      const [
        { count: cCount },
        { count: fCount },
        { data: firms },
        { data: recent },
      ] = await Promise.all([
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
        supabase.from('firms').select('*', { count: 'exact', head: true }),
        supabase.from('firms').select('status'),
        supabase
          .from('contacts')
          .select('id, name, firm, date_of_contact')
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      setContactsCount(cCount ?? 0)
      setFirmsCount(fCount ?? 0)
      setRecentContacts(recent ?? [])

      const counts = { prospective: 0, applied: 0, interview: 0, offer: 0, rejected: 0 }
      firms?.forEach((f) => {
        const s = f.status as keyof typeof counts
        if (s in counts) counts[s]++
      })
      setStatusCounts(counts)
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const total = firmsCount

  if (loading) {
    return (
      <div className="px-8 py-8">
        <div className="flex items-center justify-center py-32 text-sm text-muted">Loading…</div>
      </div>
    )
  }

  return (
    <div className="px-8 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-sm text-muted mt-1">Your recruiting pipeline at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Firms Tracked" value={firmsCount} sub="in pipeline" />
        <StatCard label="Contacts Added" value={contactsCount} sub="people networked" />
        <StatCard label="Practice Score" value={practiceScore} sub="last session" accent />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Pipeline breakdown */}
        <div className="bg-n8 rounded-xl border border-n7 p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Pipeline Breakdown</h2>
          {total === 0 ? (
            <p className="text-sm text-muted">No firms added yet.</p>
          ) : (
            <div className="space-y-3">
              {(Object.entries(statusCounts) as [string, number][]).map(([status, count]) => {
                const meta = STATUS_COLORS[status]
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.badge}`}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-muted">{count}</span>
                    </div>
                    <div className="h-1 bg-n7 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${meta.bar} rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent contacts */}
        <div className="bg-n8 rounded-xl border border-n7 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Contacts</h2>
            <Link href="/contacts" className="text-xs text-gold hover:text-gold2 font-medium transition-colors">
              View all →
            </Link>
          </div>
          {recentContacts.length === 0 ? (
            <p className="text-sm text-muted">No contacts logged yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentContacts.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">{c.name}</p>
                    {c.firm && <p className="text-xs text-muted">{c.firm}</p>}
                  </div>
                  {c.date_of_contact && (
                    <span className="text-xs text-muted shrink-0 mt-0.5">
                      {new Date(c.date_of_contact).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Link
          href="/contacts"
          className="bg-n8 border border-n7 rounded-xl px-5 py-4 hover:border-gold/40 hover:bg-n6 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
              <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Add Contact</p>
              <p className="text-xs text-muted">Log a new connection</p>
            </div>
          </div>
        </Link>

        <Link
          href="/firms"
          className="bg-n8 border border-n7 rounded-xl px-5 py-4 hover:border-gold/40 hover:bg-n6 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
              <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M8 11v4M12 11v4M16 11v4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Track Firm</p>
              <p className="text-xs text-muted">Add to your pipeline</p>
            </div>
          </div>
        </Link>

        <Link
          href="/practice"
          className="bg-n8 border border-n7 rounded-xl px-5 py-4 hover:border-gold/40 hover:bg-n6 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
              <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Practice</p>
              <p className="text-xs text-muted">Technical questions</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Practice performance */}
      {practiceBreakdown && (
        <div className="mt-6 grid grid-cols-2 gap-6">
          {/* By question type */}
          {practiceBreakdown.byType.length > 0 && (
            <div className="bg-n8 rounded-xl border border-n7 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Practice — By Type</h2>
                <Link href="/practice" className="text-xs text-gold hover:text-gold2 font-medium transition-colors">
                  Practice →
                </Link>
              </div>
              <div className="space-y-3">
                {practiceBreakdown.byType.map(({ type, score, total: t }) => {
                  const pct = t > 0 ? Math.round((score / t) * 100) : 0
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-white">{QUESTION_TYPE_LABELS[type]}</span>
                        <span className="text-xs text-muted">{score}/{t} ({pct}%)</span>
                      </div>
                      <div className="h-1 bg-n7 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-pos' : pct >= 50 ? 'bg-warn' : 'bg-neg'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* By topic (technical only) */}
          {practiceBreakdown.byTopic.length > 0 && (
            <div className="bg-n8 rounded-xl border border-n7 p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Practice — Technical Topics</h2>
              <div className="space-y-3">
                {practiceBreakdown.byTopic.map(({ topic, score, total: t }) => {
                  const pct = t > 0 ? Math.round((score / t) * 100) : 0
                  return (
                    <div key={topic}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${TOPIC_DOT[topic]}`} />
                          <span className="text-xs text-muted">{TOPIC_LABELS[topic]}</span>
                        </div>
                        <span className="text-xs text-muted">{score}/{t} ({pct}%)</span>
                      </div>
                      <div className="h-1 bg-n7 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-pos' : pct >= 50 ? 'bg-warn' : 'bg-neg'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
