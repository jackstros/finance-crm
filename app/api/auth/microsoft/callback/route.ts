import { NextRequest, NextResponse } from 'next/server'
import { cookies }                   from 'next/headers'
import { createClient }              from '@/lib/supabase/server'

const APP_URL       = process.env.NEXT_PUBLIC_APP_URL!
const CLIENT_ID     = process.env.MICROSOFT_CLIENT_ID!
const CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!
const REDIRECT_URI  = process.env.MICROSOFT_REDIRECT_URI!
const TOKEN_URL     = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'

export async function GET(req: NextRequest) {
  console.log('[microsoft/callback] Request received')
  console.log('[microsoft/callback] Full URL:', req.nextUrl.toString())

  const { searchParams } = req.nextUrl
  const code             = searchParams.get('code')
  const state            = searchParams.get('state')
  const errorParam       = searchParams.get('error')
  const errorDesc        = searchParams.get('error_description')

  console.log('[microsoft/callback] code present:', !!code)
  console.log('[microsoft/callback] state present:', !!state)
  console.log('[microsoft/callback] error param:', errorParam ?? 'none')

  // ── Microsoft returned an error ───────────────────────────────────────────
  if (errorParam) {
    console.error('[microsoft/callback] OAuth error from Microsoft:', errorParam, errorDesc)
    return NextResponse.redirect(`${APP_URL}/settings?error=oauth_denied`)
  }

  if (!code) {
    console.error('[microsoft/callback] Missing authorization code')
    return NextResponse.redirect(`${APP_URL}/settings?error=missing_code`)
  }

  if (!state) {
    console.error('[microsoft/callback] Missing state parameter')
    return NextResponse.redirect(`${APP_URL}/settings?error=missing_state`)
  }

  // ── Validate CSRF state ───────────────────────────────────────────────────
  const cookieStore = await cookies()
  const savedState  = cookieStore.get('ms_oauth_state')?.value
  console.log('[microsoft/callback] savedState present:', !!savedState)
  console.log('[microsoft/callback] state match:', savedState === state)

  if (!savedState || savedState !== state) {
    console.error('[microsoft/callback] State mismatch — possible CSRF. savedState:', savedState, '| received:', state)
    return NextResponse.redirect(`${APP_URL}/settings?error=invalid_state`)
  }
  cookieStore.delete('ms_oauth_state')
  console.log('[microsoft/callback] State validated, cookie cleared')

  // ── Get Supabase user ─────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('[microsoft/callback] Supabase user:', user?.id ?? 'not found')
  if (authError) console.error('[microsoft/callback] Supabase auth error:', authError.message)

  if (!user) {
    console.error('[microsoft/callback] No authenticated Supabase user')
    return NextResponse.redirect(`${APP_URL}/login`)
  }

  // ── Exchange code for tokens ──────────────────────────────────────────────
  console.log('[microsoft/callback] Exchanging code at:', TOKEN_URL)
  console.log('[microsoft/callback] REDIRECT_URI:', REDIRECT_URI)
  console.log('[microsoft/callback] CLIENT_ID:', CLIENT_ID)

  let tokenData: {
    access_token:  string
    refresh_token: string
    expires_in:    number
    scope?:        string
    token_type?:   string
    error?:        string
    error_description?: string
  }

  try {
    const tokenRes = await fetch(TOKEN_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri:  REDIRECT_URI,
        grant_type:    'authorization_code',
        scope: [
          'https://graph.microsoft.com/Mail.Read',
          'https://graph.microsoft.com/Mail.ReadBasic',
          'https://graph.microsoft.com/User.Read',
          'offline_access',
        ].join(' '),
      }),
    })

    console.log('[microsoft/callback] Token endpoint status:', tokenRes.status)
    tokenData = await tokenRes.json()
    console.log('[microsoft/callback] Token response keys:', Object.keys(tokenData))

    if (tokenData.error) {
      console.error('[microsoft/callback] Token error:', tokenData.error, tokenData.error_description)
      return NextResponse.redirect(`${APP_URL}/settings?error=token_exchange`)
    }

    if (!tokenData.access_token) {
      console.error('[microsoft/callback] No access_token in response')
      return NextResponse.redirect(`${APP_URL}/settings?error=token_exchange`)
    }
  } catch (err) {
    console.error('[microsoft/callback] Token exchange fetch failed:', err)
    return NextResponse.redirect(`${APP_URL}/settings?error=token_exchange`)
  }

  console.log('[microsoft/callback] Token exchange successful')
  console.log('[microsoft/callback] access_token length:', tokenData.access_token.length)
  console.log('[microsoft/callback] refresh_token present:', !!tokenData.refresh_token)
  console.log('[microsoft/callback] expires_in:', tokenData.expires_in)

  // ── Fetch Microsoft account email ─────────────────────────────────────────
  let microsoftEmail: string | null = null
  try {
    const profileRes = await fetch(
      'https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName',
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    )
    console.log('[microsoft/callback] Graph profile status:', profileRes.status)
    if (profileRes.ok) {
      const profile = await profileRes.json()
      microsoftEmail = profile.mail ?? profile.userPrincipalName ?? null
      console.log('[microsoft/callback] Microsoft email:', microsoftEmail)
    } else {
      console.warn('[microsoft/callback] Profile fetch failed:', await profileRes.text())
    }
  } catch (err) {
    console.warn('[microsoft/callback] Profile fetch error (non-fatal):', err)
  }

  // ── Save tokens to Supabase ───────────────────────────────────────────────
  const expiresAt = Date.now() + tokenData.expires_in * 1000
  console.log('[microsoft/callback] Saving tokens to Supabase. expires_at (ms):', expiresAt)

  const { error: upsertError } = await supabase.from('microsoft_tokens').upsert(
    {
      user_id:         user.id,
      access_token:    tokenData.access_token,
      refresh_token:   tokenData.refresh_token,
      expires_at:      expiresAt,
      microsoft_email: microsoftEmail,
    },
    { onConflict: 'user_id' }
  )

  if (upsertError) {
    console.error('[microsoft/callback] Supabase upsert error:', upsertError.message, upsertError.details)
    return NextResponse.redirect(`${APP_URL}/settings?error=db_save`)
  }

  console.log('[microsoft/callback] Tokens saved successfully. Redirecting to /settings?connected=true')
  return NextResponse.redirect(`${APP_URL}/settings?connected=true`)
}
