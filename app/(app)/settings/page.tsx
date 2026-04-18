'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type TokenInfo = {
  microsoft_email: string | null
  last_synced_at: string | null
}

type SyncResult = {
  scanned: number
  recruiting: number
  synced: number
}

function SettingsContent() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [emailCount, setEmailCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  const justConnected = searchParams.get('connected') === 'true'
  const oauthError = searchParams.get('error')

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    setLoading(true)
    const { data: tokens } = await supabase
      .from('microsoft_tokens')
      .select('microsoft_email, last_synced_at')
      .maybeSingle()

    if (tokens) {
      setTokenInfo(tokens)
      const { count } = await supabase
        .from('outlook_emails')
        .select('*', { count: 'exact', head: true })
      setEmailCount(count ?? 0)
    } else {
      setTokenInfo(null)
      setEmailCount(0)
    }
    setLoading(false)
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    setSyncError(null)

    try {
      const res = await fetch('/api/outlook/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setSyncError(data.error ?? 'Sync failed. Please try again.')
      } else {
        setSyncResult(data)
        loadStatus()
      }
    } catch {
      setSyncError('Network error. Please check your connection.')
    }
    setSyncing(false)
  }

  async function handleDisconnect() {
    if (
      !confirm(
        'Disconnect Outlook? All synced emails will be removed from your CRM.'
      )
    )
      return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await Promise.all([
      supabase.from('microsoft_tokens').delete().eq('user_id', user.id),
      supabase.from('outlook_emails').delete().eq('user_id', user.id),
    ])

    setTokenInfo(null)
    setEmailCount(0)
    setSyncResult(null)
    router.replace('/settings')
  }

  return (
    <div className="px-8 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage integrations and account preferences
        </p>
      </div>

      {/* OAuth status banners */}
      {justConnected && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6 text-sm text-green-800">
          <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Outlook connected successfully. Run a sync to import your emails.
        </div>
      )}
      {oauthError && !justConnected && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-sm text-red-800">
          <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Could not connect Outlook
          {oauthError === 'access_denied' ? ' — you denied access.' : ` (${oauthError}).`}
        </div>
      )}

      {/* Outlook Integration card */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          {/* Microsoft logo */}
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 21 21" fill="none">
            <rect x="1" y="1" width="9" height="9" fill="#F25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
            <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
          </svg>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Microsoft Outlook
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automatically sync recruiting emails to your contacts and firms
            </p>
          </div>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <div className="text-sm text-slate-400">Loading…</div>
          ) : tokenInfo ? (
            <div className="space-y-5">
              {/* Connection status */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-slate-800">
                      Connected
                    </span>
                  </div>
                  {tokenInfo.microsoft_email && (
                    <p className="text-xs text-slate-400 mt-0.5 ml-4">
                      {tokenInfo.microsoft_email}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleDisconnect}
                  className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-100 hover:border-red-200 transition"
                >
                  Disconnect
                </button>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-6 py-3 border-t border-b border-slate-100">
                <div>
                  <p className="text-xl font-semibold text-slate-900">
                    {emailCount}
                  </p>
                  <p className="text-xs text-slate-400">emails synced</p>
                </div>
                {tokenInfo.last_synced_at && (
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      {new Date(tokenInfo.last_synced_at).toLocaleString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        }
                      )}
                    </p>
                    <p className="text-xs text-slate-400">last synced</p>
                  </div>
                )}
              </div>

              {/* Sync button + result */}
              <div>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                >
                  {syncing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Syncing…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Sync Now
                    </>
                  )}
                </button>

                {syncResult && (
                  <div className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                    Scanned <span className="font-medium">{syncResult.scanned}</span> emails
                    {' · '}
                    found <span className="font-medium">{syncResult.recruiting}</span> recruiting-related
                    {' · '}
                    linked <span className="font-medium text-indigo-600">{syncResult.synced}</span> to your CRM
                  </div>
                )}
                {syncError && (
                  <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3 border border-red-100">
                    {syncError}
                  </p>
                )}
              </div>

              {/* How it works */}
              <div className="text-xs text-slate-400 space-y-1 pt-1">
                <p className="font-medium text-slate-500">How matching works</p>
                <p>
                  Emails are matched to contacts by sender address and to firms by
                  domain name. Only emails containing recruiting keywords
                  (interview, offer, superday, coffee chat, etc.) are imported.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Connect your Microsoft Outlook account to automatically scan
                your inbox for recruiting emails. Matched emails will appear on
                the relevant contact and firm records.
              </p>

              <ul className="text-xs text-slate-500 space-y-1.5">
                {[
                  'Detects emails with keywords: interview, offer, superday, coffee chat, recruiting…',
                  'Matches senders to your saved contacts by email address',
                  'Matches firm emails by domain name',
                  'Reads emails — never sends or modifies anything',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <a
                href="/api/auth/microsoft"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white border border-slate-300 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21" fill="none">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                </svg>
                Connect Outlook
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  )
}
