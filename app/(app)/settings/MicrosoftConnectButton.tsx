'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface Props {
  connected: boolean
  microsoftEmail: string | null
  lastSynced: string | null
}

export default function MicrosoftConnectButton({ connected, microsoftEmail, lastSynced }: Props) {
  const searchParams = useSearchParams()
  const [isConnected, setIsConnected]       = useState(connected)
  const [connectedEmail, setConnectedEmail] = useState(microsoftEmail)
  const [syncing, setSyncing]               = useState(false)
  const [disconnecting, setDisconnecting]   = useState(false)
  const [syncResult, setSyncResult]         = useState<string | null>(null)

  const urlError = searchParams.get('error')
  const errorMsg: Record<string, string> = {
    oauth_denied:    'Authorization was denied. Please try again.',
    missing_params:  'OAuth response was incomplete. Please try again.',
    invalid_state:   'Security check failed. Please try connecting again.',
    token_exchange:  'Failed to exchange authorization code. Please try again.',
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res  = await fetch('/api/emails/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sync failed')
      setSyncResult(`Synced ${data.synced} email${data.synced !== 1 ? 's' : ''}`)
    } catch (err) {
      setSyncResult(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect your Outlook account? Synced emails will remain.')) return
    setDisconnecting(true)
    try {
      const res = await fetch('/api/auth/microsoft/disconnect', { method: 'POST' })
      if (!res.ok) throw new Error('Disconnect failed')
      setIsConnected(false)
      setConnectedEmail(null)
      setSyncResult(null)
    } catch {
      // keep connected state on error
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div>
      {/* Error banner from redirect */}
      {urlError && errorMsg[urlError] && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid #fecaca', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{errorMsg[urlError]}</p>
        </div>
      )}

      {isConnected ? (
        <div>
          {/* Connected state */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <OutlookIcon />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Outlook</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '1px 7px' }}>
                    Connected
                  </span>
                </div>
                {connectedEmail && (
                  <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{connectedEmail}</p>
                )}
                {lastSynced && (
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
                    Last synced {new Date(lastSynced).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSync}
                disabled={syncing}
                style={{ padding: '7px 14px', fontSize: 13, fontWeight: 600, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? 0.65 : 1, whiteSpace: 'nowrap' }}
                onMouseEnter={(e) => { if (!syncing) (e.currentTarget as HTMLElement).style.background = '#dbeafe' }}
                onMouseLeave={(e) => { if (!syncing) (e.currentTarget as HTMLElement).style.background = '#eff6ff' }}
              >
                {syncing ? 'Syncing…' : 'Sync Emails'}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                style={{ padding: '7px 14px', fontSize: 13, fontWeight: 500, color: '#64748b', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, cursor: disconnecting ? 'not-allowed' : 'pointer', opacity: disconnecting ? 0.65 : 1 }}
                onMouseEnter={(e) => { if (!disconnecting) { (e.currentTarget as HTMLElement).style.color = '#dc2626'; (e.currentTarget as HTMLElement).style.borderColor = '#fecaca' } }}
                onMouseLeave={(e) => { if (!disconnecting) { (e.currentTarget as HTMLElement).style.color = '#64748b'; (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0' } }}
              >
                {disconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </div>
          </div>

          {syncResult && (
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 13, color: '#374151' }}>
              {syncResult}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <OutlookIcon muted />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>Outlook</p>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Sync recruiting emails from your inbox</p>
            </div>
          </div>
          <a
            href="/api/auth/microsoft/initiate"
            style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#0d9488', border: 'none', borderRadius: 8, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#0f766e' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#0d9488' }}
          >
            Connect Outlook
          </a>
        </div>
      )}
    </div>
  )
}

function OutlookIcon({ muted }: { muted?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="1" width="9" height="9" rx="1" fill={muted ? '#cbd5e1' : '#0078d4'} />
      <rect x="11" y="1" width="6" height="6" rx="1" fill={muted ? '#e2e8f0' : '#50d9ff'} />
      <rect x="11" y="8" width="6" height="9" rx="1" fill={muted ? '#e2e8f0' : '#50d9ff'} />
      <rect x="1" y="11" width="9" height="6" rx="1" fill={muted ? '#cbd5e1' : '#0078d4'} />
    </svg>
  )
}
