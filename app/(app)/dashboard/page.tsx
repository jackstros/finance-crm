import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  researching: { label: 'Researching', color: 'text-slate-700', bg: 'bg-slate-100' },
  applied: { label: 'Applied', color: 'text-blue-700', bg: 'bg-blue-50' },
  interview: { label: 'Interview', color: 'text-amber-700', bg: 'bg-amber-50' },
  offer: { label: 'Offer', color: 'text-green-700', bg: 'bg-green-50' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50' },
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: number
  sub?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-6 py-5">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-semibold text-slate-900 mt-2">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const outlookConnected = params.outlook === 'connected'
  const supabase = await createClient()

  const [
    { count: contactsCount },
    { count: firmsCount },
    { data: firms },
    { data: recentContacts },
    { count: reminderCount },
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('firms').select('*', { count: 'exact', head: true }),
    supabase.from('firms').select('status'),
    supabase
      .from('contacts')
      .select('id, name, firm, date_of_contact')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .lt('date_of_contact', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
      .not('date_of_contact', 'is', null),
  ])

  const statusCounts = { researching: 0, applied: 0, interview: 0, offer: 0, rejected: 0 }
  firms?.forEach((f) => {
    const s = f.status as keyof typeof statusCounts
    if (s in statusCounts) statusCounts[s]++
  })

  const total = firmsCount ?? 0

  return (
    <div className="px-8 py-8 max-w-4xl">
      {outlookConnected && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-3.5 mb-6">
          <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-green-800">
            <span className="font-medium">Outlook connected.</span>{' '}
            Go to{' '}
            <a href="/settings" className="underline underline-offset-2 hover:text-green-900">
              Settings
            </a>{' '}
            to sync your recruiting emails.
          </p>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Your recruiting pipeline at a glance</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Contacts Logged" value={contactsCount ?? 0} sub="people networked with" />
        <StatCard label="Firms Tracked" value={firmsCount ?? 0} sub="companies in pipeline" />
        <StatCard
          label="Emails Sent"
          value={contactsCount ?? 0}
          sub="total outreach logged"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Pipeline breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Pipeline Breakdown</h2>
          {total === 0 ? (
            <p className="text-sm text-slate-400">No firms added yet.</p>
          ) : (
            <div className="space-y-3">
              {(Object.entries(statusCounts) as [string, number][]).map(([status, count]) => {
                const meta = STATUS_META[status]
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-xs text-slate-500">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full transition-all"
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
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Recent Contacts</h2>
            <Link href="/contacts" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all →
            </Link>
          </div>
          {!recentContacts?.length ? (
            <p className="text-sm text-slate-400">No contacts logged yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {recentContacts.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{c.name}</p>
                    {c.firm && (
                      <p className="text-xs text-slate-400">{c.firm}</p>
                    )}
                  </div>
                  {c.date_of_contact && (
                    <span className="text-xs text-slate-400 shrink-0 mt-0.5">
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

      {/* Reminders nudge */}
      {(reminderCount ?? 0) > 0 && (
        <div className="mt-6 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-amber-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </span>
            <p className="text-sm text-amber-800 font-medium">
              {reminderCount} contact{reminderCount !== 1 ? 's' : ''} due for follow-up
            </p>
          </div>
          <Link
            href="/reminders"
            className="text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors"
          >
            Review →
          </Link>
        </div>
      )}
    </div>
  )
}
