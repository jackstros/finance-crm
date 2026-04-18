import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (error) {
    return NextResponse.redirect(`${appUrl}/settings?error=access_denied`)
  }

  // Validate CSRF state
  const storedState = request.cookies.get('ms_oauth_state')?.value
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/settings?error=invalid_state`)
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/settings?error=no_code`)
  }

  // Exchange authorization code for tokens
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
    console.error('Token exchange failed:', await tokenRes.text())
    return NextResponse.redirect(`${appUrl}/settings?error=token_exchange_failed`)
  }

  const tokens = await tokenRes.json()

  // Fetch Microsoft user profile to get their email address
  const profileRes = await fetch(
    'https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName',
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  )
  const profile = profileRes.ok ? await profileRes.json() : null
  const microsoftEmail = profile?.mail ?? profile?.userPrincipalName ?? null

  const expiresAt = new Date(
    Date.now() + (tokens.expires_in ?? 3600) * 1000
  ).toISOString()

  // Get the authenticated Supabase user from cookies
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
    return NextResponse.redirect(`${appUrl}/login`)
  }

  // Store tokens in Supabase (upsert in case user reconnects)
  await supabase.from('microsoft_tokens').upsert(
    {
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_at: expiresAt,
      microsoft_email: microsoftEmail,
    },
    { onConflict: 'user_id' }
  )

  const response = NextResponse.redirect(`${appUrl}/settings?connected=true`)
  response.cookies.delete('ms_oauth_state')
  return response
}
