import { Suspense }       from 'react'
import { createClient }   from '@/lib/supabase/server'
import MicrosoftConnectButton from './MicrosoftConnectButton'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let connected      = false
  let microsoftEmail: string | null = null
  let lastSynced:     string | null = null

  if (user) {
    const { data: token } = await supabase
      .from('microsoft_tokens')
      .select('microsoft_email, last_synced_at')
      .eq('user_id', user.id)
      .single()

    if (token) {
      connected      = true
      microsoftEmail = token.microsoft_email  as string | null
      lastSynced     = token.last_synced_at   as string | null
    }
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 700, minHeight: '100%', background: '#f8fafc' }}>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>Settings</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
          Account preferences and integrations
        </p>
      </div>

      {/* Integrations */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: 20 }}>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Integrations</p>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <Suspense fallback={null}>
            <MicrosoftConnectButton
              connected={connected}
              microsoftEmail={microsoftEmail}
              lastSynced={lastSynced}
            />
          </Suspense>
        </div>
      </div>

      {/* Account */}
      {user && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Account</p>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', margin: '0 0 2px' }}>{user.email}</p>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                  Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
