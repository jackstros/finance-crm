import { NextResponse } from 'next/server'

export async function GET() {
  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`,
    scope: 'openid profile email offline_access Mail.Read',
    state,
    response_mode: 'query',
    prompt: 'select_account',
  })

  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`

  const response = NextResponse.redirect(authUrl)
  response.cookies.set('ms_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return response
}
