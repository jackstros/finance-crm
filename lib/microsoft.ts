const CLIENT_ID     = process.env.MICROSOFT_CLIENT_ID!
const CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!
const REDIRECT_URI  = process.env.MICROSOFT_REDIRECT_URI!

// Use /common/ so both work/school and personal Microsoft accounts can connect
const TOKEN_ENDPOINT = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
const AUTH_ENDPOINT  = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'

const SCOPES = [
  'https://graph.microsoft.com/Mail.Read',
  'https://graph.microsoft.com/Mail.ReadBasic',
  'https://graph.microsoft.com/User.Read',
  'offline_access',
].join(' ')

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id:     CLIENT_ID,
    response_type: 'code',
    redirect_uri:  REDIRECT_URI,
    response_mode: 'query',
    scope:         SCOPES,
    state,
  })
  return `${AUTH_ENDPOINT}?${params}`
}

export interface TokenResponse {
  access_token:  string
  refresh_token: string
  expires_in:    number
  scope:         string
  token_type:    string
}

async function postToken(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, ...body }),
  })
  if (!res.ok) throw new Error(`Microsoft token request failed: ${await res.text()}`)
  return res.json()
}

export function exchangeCode(code: string): Promise<TokenResponse> {
  return postToken({ code, redirect_uri: REDIRECT_URI, grant_type: 'authorization_code' })
}

export function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  return postToken({ refresh_token: refreshToken, grant_type: 'refresh_token' })
}

type SupabaseClient = import('@supabase/supabase-js').SupabaseClient

export async function getValidToken(
  userId: string,
  supabase: SupabaseClient
): Promise<string | null> {
  const { data: row } = await supabase
    .from('microsoft_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single()

  if (!row) return null

  // Supabase returns bigint columns as strings — Number() converts safely
  const expiresAt   = Number(row.expires_at)
  const nowPlusBuf  = Date.now() + 60_000 // 1-min buffer

  if (expiresAt > nowPlusBuf) return row.access_token as string

  try {
    const tokens     = await refreshAccessToken(row.refresh_token as string)
    const newExpires = Date.now() + tokens.expires_in * 1000
    await supabase
      .from('microsoft_tokens')
      .update({
        access_token:  tokens.access_token,
        refresh_token: tokens.refresh_token || row.refresh_token,
        expires_at:    newExpires,
      })
      .eq('user_id', userId)
    return tokens.access_token
  } catch (err) {
    console.error('microsoft token refresh error:', err)
    return null
  }
}

export interface GraphEmail {
  id:               string
  subject:          string | null
  from:             { emailAddress: { address: string; name: string } }
  receivedDateTime: string
  bodyPreview:      string | null
  isRead:           boolean
}

export async function fetchEmails(accessToken: string, top = 100): Promise<GraphEmail[]> {
  // Avoid URLSearchParams — it encodes '$' as '%24', breaking Graph OData params
  const url =
    `https://graph.microsoft.com/v1.0/me/messages` +
    `?$top=${top}` +
    `&$select=id,subject,from,receivedDateTime,bodyPreview,isRead` +
    `&$orderby=receivedDateTime%20desc`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Graph API error: ${await res.text()}`)
  const data = await res.json()
  return data.value as GraphEmail[]
}

export async function fetchMicrosoftEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(
      'https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) return null
    const profile = await res.json()
    return (profile.mail ?? profile.userPrincipalName ?? null) as string | null
  } catch {
    return null
  }
}
