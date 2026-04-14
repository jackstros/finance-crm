'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type ContactReminder = {
  id: string
  name: string
  firm: string | null
  email: string | null
  date_of_contact: string
}

type FirmReminder = {
  id: string
  firm_name: string
  role: string | null
  status: string
  last_contacted: string | null
  created_at: string
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  researching: { label: 'Researching', color: 'text-slate-700', bg: 'bg-slate-100' },
  applied: { label: 'Applied', color: 'text-blue-700', bg: 'bg-blue-50' },
  interview: { label: 'Interview', color: 'text-amber-700', bg: 'bg-amber-50' },
  offer: { label: 'Offer', color: 'text-green-700', bg: 'bg-green-50' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50' },
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

function DaysAgo({ days }: { days: number }) {
  const color =
    days >= 21 ? 'text-red-600 bg-red-50' : days >= 14 ? 'text-amber-600 bg-amber-50' : 'text-slate-500 bg-slate-100'
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {days}d ago
    </span>
  )
}

export default function RemindersPage() {
  const supabase = createClient()
  const [contacts, setContacts] = useState<ContactReminder[]>([])
  const [firms, setFirms] = useState<FirmReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissing, setDismissing] = useState<string | null>(null)

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load dismissed entity IDs
    const { data: dismissals } = await supabase
      .from('follow_up_dismissals')
      .select('entity_type, entity_id')
      .eq('user_id', user.id)

    const dismissedContacts = new Set(
      dismissals?.filter((d) => d.entity_type === 'contact').map((d) => d.entity_id) ?? []
    )
    const dismissedFirms = new Set(
      dismissals?.filter((d) => d.entity_type === 'firm').map((d) => d.entity_id) ?? []
    )

    // Contacts where date_of_contact is set and > 7 days ago
    const { data: contactData } = await supabase
      .from('contacts')
      .select('id, name, firm, email, date_of_contact')
      .not('date_of_contact', 'is', null)
      .lt('date_of_contact', cutoff)
      .order('date_of_contact', { ascending: true })

    // Firms where last_contacted > 7 days ago, or never contacted but added > 7 days ago
    const { data: firmData } = await supabase
      .from('firms')
      .select('id, firm_name, role, status, last_contacted, created_at')
      .or(`last_contacted.lt.${cutoff},and(last_contacted.is.null,created_at.lt.${cutoff}T00:00:00Z)`)
      .not('status', 'eq', 'rejected')
      .order('last_contacted', { ascending: true, nullsFirst: true })

    setContacts(
      (contactData ?? []).filter((c) => !dismissedContacts.has(c.id)) as ContactReminder[]
    )
    setFirms(
      (firmData ?? []).filter((f) => !dismissedFirms.has(f.id)) as FirmReminder[]
    )
    setLoading(false)
  }, [supabase, cutoff])

  useEffect(() => {
    load()
  }, [load])

  async function dismiss(entityType: 'contact' | 'firm', entityId: string) {
    setDismissing(entityId)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('follow_up_dismissals').upsert({
      user_id: user.id,
      entity_type: entityType,
      entity_id: entityId,
    })

    if (entityType === 'contact') {
      setContacts((prev) => prev.filter((c) => c.id !== entityId))
    } else {
      setFirms((prev) => prev.filter((f) => f.id !== entityId))
    }
    setDismissing(null)
  }

  const total = contacts.length + firms.length

  return (
    <div className="px-8 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Reminders</h1>
        <p className="text-sm text-slate-500 mt-1">
          Contacts and firms you haven&apos;t followed up with in over a week
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400 py-10 text-center">Loading…</div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-base font-medium text-slate-700">You&apos;re all caught up</p>
          <p className="text-sm text-slate-400 mt-1">
            No follow-ups needed right now. Check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Contact reminders */}
          {contacts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-slate-900">Contacts</h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {contacts.length}
                </span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-50">
                {contacts.map((c) => {
                  const days = daysSince(c.date_of_contact)
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-4 px-4 py-3.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                          <DaysAgo days={days} />
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {c.firm && (
                            <p className="text-xs text-slate-400 truncate">{c.firm}</p>
                          )}
                          {c.email && (
                            <a
                              href={`mailto:${c.email}`}
                              className="text-xs text-indigo-500 hover:text-indigo-700 truncate"
                            >
                              {c.email}
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => dismiss('contact', c.id)}
                        disabled={dismissing === c.id}
                        className="shrink-0 text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition disabled:opacity-40"
                      >
                        {dismissing === c.id ? '…' : 'Dismiss'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Firm reminders */}
          {firms.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-slate-900">Firms</h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {firms.length}
                </span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-50">
                {firms.map((f) => {
                  const refDate = f.last_contacted ?? f.created_at.slice(0, 10)
                  const days = daysSince(refDate)
                  const meta = STATUS_META[f.status]
                  return (
                    <div
                      key={f.id}
                      className="flex items-center justify-between gap-4 px-4 py-3.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {f.firm_name}
                          </p>
                          <DaysAgo days={days} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {f.role && (
                            <p className="text-xs text-slate-400">{f.role}</p>
                          )}
                          {meta && (
                            <span
                              className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}
                            >
                              {meta.label}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => dismiss('firm', f.id)}
                        disabled={dismissing === f.id}
                        className="shrink-0 text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition disabled:opacity-40"
                      >
                        {dismissing === f.id ? '…' : 'Dismiss'}
                      </button>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-slate-400 mt-2 px-1">
                Dismissed firms won&apos;t reappear unless you update them.
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
