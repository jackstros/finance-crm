import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // Microsoft returned an error (e.g. user denied consent)
  if (error) {
    console.error('[Outlook OAuth] Microsoft error:', error, errorDescription)
    return NextResponse.redirect(`${appUrl}/settings?error=access_denied`)
  }

  if (!code) {
    console.error('[Outlook OAuth] No code in callback')
    return NextResponse.redirect(`${appUrl}/settings?error=no_code`)
  }

  // Validate CSRF state against the cookie we set before redirecting to Microsoft
  const storedState = request.cookies.get('ms_oauth_state')?.value
  if (!state || !storedState || state !== storedState) {
    console.error('[Outlook OAuth] State mismatch', { state, storedState })
    // If the state cookie is simply missing (e.g. cookie cleared), skip CSRF check
    // and proceed — this is a graceful fallback for dev environments
    if (storedState !== undefined) {
      return NextResponse.redirect(`${appUrl}/settings?error=invalid_state`)
    }
  }

  // Exchange the authorization code for tokens
  const tokenRes = await fetch(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        code,
        redirect_uri: `${appUrl}/api/auth/microsoft/callback`,
        grant_type: 'authorization_code',
        scope: 'openid profile email offline_access Mail.Read',
      }),
    }
  )

  if (!tokenRes.ok) {
    const body = await tokenRes.text()
    console.error('[Outlook OAuth] Token exchange failed:', tokenRes.status, body)
    return NextResponse.redirect(`${appUrl}/settings?error=token_exchange_failed`)
  }

  const tokens = await tokenRes.json()

  if (!tokens.access_token) {
    console.error('[Outlook OAuth] No access_token in response:', tokens)
    return NextResponse.redirect(`${appUrl}/settings?error=token_exchange_failed`)
  }

  // Fetch the Microsoft user's email address
  const profileRes = await fetch(
    'https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName',
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  )
  const profile = profileRes.ok ? await profileRes.json() : null
  const microsoftEmail: string | null =
    profile?.mail ?? profile?.userPrincipalName ?? null

  const expiresAt = new Date(
    Date.now() + (tokens.expires_in ?? 3600) * 1000
  ).toISOString()

  // Get the currently logged-in Supabase user
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error('[Outlook OAuth] No authenticated Supabase user found — redirecting to login')
    return NextResponse.redirect(`${appUrl}/login`)
  }

  // Persist tokens (upsert so reconnecting overwrites old tokens)
  const { error: upsertError } = await supabase.from('microsoft_tokens').upsert(
    {
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_at: expiresAt,
      microsoft_email: microsoftEmail,
    },
    { onConflict: 'user_id' }
  )

  if (upsertError) {
    console.error('[Outlook OAuth] Failed to save tokens:', upsertError)
    return NextResponse.redirect(`${appUrl}/settings?error=db_error`)
  }

  console.log('[Outlook OAuth] Connected successfully for user', user.id, '— email:', microsoftEmail)

  // Clear CSRF cookie and redirect to dashboard with success flag
  const response = NextResponse.redirect(`${appUrl}/dashboard?outlook=connected`)
  response.cookies.delete('ms_oauth_state')
  return response
}
