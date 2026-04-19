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

const STATUS_META: Record<string, { label: string; badge: string }> = {
  prospective: { label: 'Prospective', badge: 'bg-n7 text-muted' },
  applied:     { label: 'Applied',     badge: 'bg-[#4A90E2]/20 text-[#4A90E2]' },
  interview:   { label: 'Interview',   badge: 'bg-warn/20 text-warn' },
  offer:       { label: 'Offer',       badge: 'bg-pos/20 text-pos' },
  rejected:    { label: 'Rejected',    badge: 'bg-neg/20 text-neg' },
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

function DaysAgo({ days }: { days: number }) {
  const cls =
    days >= 21
      ? 'bg-neg/20 text-neg'
      : days >= 14
      ? 'bg-warn/20 text-warn'
      : 'bg-n7 text-muted'
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
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

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

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

    const { data: contactData } = await supabase
      .from('contacts')
      .select('id, name, firm, email, date_of_contact')
      .not('date_of_contact', 'is', null)
      .lt('date_of_contact', cutoff)
      .order('date_of_contact', { ascending: true })

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

  useEffect(() => { load() }, [load])

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
        <h1 className="text-2xl font-semibold text-white">Reminders</h1>
        <p className="text-sm text-muted mt-1">
          Contacts and firms you haven&apos;t followed up with in over a week
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-muted py-10 text-center">Loading…</div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-pos/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-pos" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-base font-medium text-white">You&apos;re all caught up</p>
          <p className="text-sm text-muted mt-1">No follow-ups needed right now.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {contacts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-white">Contacts</h2>
                <span className="text-xs text-muted bg-n7 px-2 py-0.5 rounded-full">
                  {contacts.length}
                </span>
              </div>
              <div className="bg-n8 rounded-xl border border-n7 divide-y divide-n7/50">
                {contacts.map((c) => {
                  const days = daysSince(c.date_of_contact)
                  return (
                    <div key={c.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white truncate">{c.name}</p>
                          <DaysAgo days={days} />
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {c.firm && <p className="text-xs text-muted truncate">{c.firm}</p>}
                          {c.email && (
                            <a
                              href={`mailto:${c.email}`}
                              className="text-xs text-gold hover:text-gold2 truncate transition-colors"
                            >
                              {c.email}
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => dismiss('contact', c.id)}
                        disabled={dismissing === c.id}
                        className="shrink-0 text-xs text-muted hover:text-white px-3 py-1.5 rounded-lg border border-n7 hover:border-n5 transition disabled:opacity-40"
                      >
                        {dismissing === c.id ? '…' : 'Dismiss'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {firms.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-white">Firms</h2>
                <span className="text-xs text-muted bg-n7 px-2 py-0.5 rounded-full">
                  {firms.length}
                </span>
              </div>
              <div className="bg-n8 rounded-xl border border-n7 divide-y divide-n7/50">
                {firms.map((f) => {
                  const refDate = f.last_contacted ?? f.created_at.slice(0, 10)
                  const days = daysSince(refDate)
                  const meta = STATUS_META[f.status]
                  return (
                    <div key={f.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white truncate">{f.firm_name}</p>
                          <DaysAgo days={days} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {f.role && <p className="text-xs text-muted">{f.role}</p>}
                          {meta && (
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${meta.badge}`}>
                              {meta.label}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => dismiss('firm', f.id)}
                        disabled={dismissing === f.id}
                        className="shrink-0 text-xs text-muted hover:text-white px-3 py-1.5 rounded-lg border border-n7 hover:border-n5 transition disabled:opacity-40"
                      >
                        {dismissing === f.id ? '…' : 'Dismiss'}
                      </button>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-muted mt-2 px-1">
                Dismissed firms won&apos;t reappear unless you update them.
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
