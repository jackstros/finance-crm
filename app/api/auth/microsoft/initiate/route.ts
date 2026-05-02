import { NextResponse } from 'next/server'
import { cookies }      from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { buildAuthUrl } from '@/lib/microsoft'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export async function GET() {
  console.log('[microsoft/initiate] Request received')
  console.log('[microsoft/initiate] MICROSOFT_CLIENT_ID set:', !!process.env.MICROSOFT_CLIENT_ID)
  console.log('[microsoft/initiate] MICROSOFT_CLIENT_SECRET set:', !!process.env.MICROSOFT_CLIENT_SECRET)
  console.log('[microsoft/initiate] MICROSOFT_REDIRECT_URI:', process.env.MICROSOFT_REDIRECT_URI)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  console.log('[microsoft/initiate] User:', user?.id ?? 'not authenticated')
  if (!user) return NextResponse.redirect(`${APP_URL}/login`)

  const state       = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set('ms_oauth_state', state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    maxAge:   600,
    path:     '/',
  })

  const authUrl = buildAuthUrl(state)
  console.log('[microsoft/initiate] Redirecting to Microsoft auth URL:', authUrl)
  return NextResponse.redirect(authUrl)
}
