import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getValidToken } from '@/lib/microsoft'

export async function POST() {
  console.log('[emails/sync] Request received')

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('[emails/sync] User:', user?.id ?? 'not found')
  if (authError) console.error('[emails/sync] Auth error:', authError.message)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Get valid access token (auto-refreshes if expired) ───────────────────
  console.log('[emails/sync] Fetching valid token for user:', user.id)
  const accessToken = await getValidToken(user.id, supabase)
  console.log('[emails/sync] Access token present:', !!accessToken)
  console.log('[emails/sync] Access token length:', accessToken?.length ?? 0)

  if (!accessToken) {
    console.error('[emails/sync] No valid token — user needs to reconnect')
    return NextResponse.json(
      { error: 'No valid Microsoft connection. Please reconnect Outlook.' },
      { status: 400 }
    )
  }

  // ── Build Graph API URL ───────────────────────────────────────────────────
  // Do NOT use URLSearchParams — it encodes '$' as '%24', which causes
  // Microsoft Graph's OData parser to ignore the query parameters entirely,
  // returning an empty value array instead of the actual messages.
  const graphUrl =
    'https://graph.microsoft.com/v1.0/me/messages' +
    '?$top=100' +
    '&$select=id,subject,from,receivedDateTime,bodyPreview,isRead' +
    '&$orderby=receivedDateTime%20desc'
  console.log('[emails/sync] Fetching from:', graphUrl)

  // ── Call Graph API ────────────────────────────────────────────────────────
  let graphRes: Response
  let rawBody: string
  try {
    graphRes = await fetch(graphUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept:        'application/json',
      },
    })
    rawBody = await graphRes.text()
  } catch (err) {
    console.error('[emails/sync] Network error calling Graph API:', err)
    return NextResponse.json({ error: 'Network error calling Graph API' }, { status: 500 })
  }

  console.log('[emails/sync] Response status:', graphRes.status)
  console.log('[emails/sync] Response status text:', graphRes.statusText)
  console.log('[emails/sync] Content-Type:', graphRes.headers.get('content-type'))

  if (!graphRes.ok) {
    console.error('[emails/sync] Graph API error response body:', rawBody)
    return NextResponse.json(
      { error: `Graph API returned ${graphRes.status}`, detail: rawBody },
      { status: 502 }
    )
  }

  // ── Parse response ────────────────────────────────────────────────────────
  let parsed: { value?: unknown[]; '@odata.nextLink'?: string; error?: { message: string } }
  try {
    parsed = JSON.parse(rawBody)
  } catch (err) {
    console.error('[emails/sync] Failed to parse Graph response as JSON:', err)
    console.error('[emails/sync] Raw body (first 500 chars):', rawBody.slice(0, 500))
    return NextResponse.json({ error: 'Invalid JSON from Graph API' }, { status: 502 })
  }

  console.log('[emails/sync] Parsed response keys:', Object.keys(parsed))
  console.log('[emails/sync] Has @odata.nextLink:', !!parsed['@odata.nextLink'])

  if (parsed.error) {
    console.error('[emails/sync] Graph API error in body:', parsed.error.message)
    return NextResponse.json({ error: parsed.error.message }, { status: 502 })
  }

  const value = parsed.value
  console.log('[emails/sync] response.value is array:', Array.isArray(value))
  console.log('[emails/sync] Number of emails in response:', Array.isArray(value) ? value.length : 'N/A')

  if (!Array.isArray(value)) {
    console.error('[emails/sync] Unexpected response shape — value is not an array:', typeof value)
    console.error('[emails/sync] Full parsed response:', JSON.stringify(parsed).slice(0, 1000))
    return NextResponse.json({ error: 'Unexpected Graph API response shape' }, { status: 502 })
  }

  if (value.length === 0) {
    console.log('[emails/sync] Graph returned 0 emails — inbox may be empty or filter matched nothing')
    await supabase.from('microsoft_tokens')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', user.id)
    return NextResponse.json({ synced: 0 })
  }

  // ── Process each email ────────────────────────────────────────────────────
  type GraphEmail = {
    id: string
    subject?: string | null
    from?: { emailAddress?: { address?: string; name?: string } }
    receivedDateTime?: string
    bodyPreview?: string | null
    isRead?: boolean
  }

  const rows = value.map((raw, i) => {
    const e = raw as GraphEmail
    console.log(
      `[emails/sync] Processing email ${i + 1}:`,
      `id="${e.id}"`,
      `subject="${e.subject ?? '(no subject)'}"`,
      `from="${e.from?.emailAddress?.address ?? 'unknown'}"`,
      `received="${e.receivedDateTime ?? 'unknown'}"`
    )
    return {
      user_id:      user.id,
      message_id:   e.id,
      subject:      e.subject ?? '(no subject)',
      from_email:   e.from?.emailAddress?.address ?? null,
      from_name:    e.from?.emailAddress?.name    ?? null,
      received_at:  e.receivedDateTime            ?? null,
      body_preview: e.bodyPreview                 ?? null,
    }
  })

  console.log('[emails/sync] Rows to upsert:', rows.length)

  // ── Upsert to Supabase ────────────────────────────────────────────────────
  const { error: upsertError, data: upsertData } = await supabase
    .from('outlook_emails')
    .upsert(rows, { onConflict: 'user_id,message_id', ignoreDuplicates: false })
    .select('id')

  if (upsertError) {
    console.error('[emails/sync] Supabase upsert error:', upsertError.message)
    console.error('[emails/sync] Upsert error details:', upsertError.details)
    console.error('[emails/sync] Upsert error hint:', upsertError.hint)
    return NextResponse.json(
      { error: 'Database insert failed', detail: upsertError.message },
      { status: 500 }
    )
  }

  console.log('[emails/sync] Upsert succeeded. Rows affected:', upsertData?.length ?? 'unknown')

  // ── Update last_synced_at ─────────────────────────────────────────────────
  const { error: updateErr } = await supabase
    .from('microsoft_tokens')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (updateErr) {
    console.warn('[emails/sync] Failed to update last_synced_at:', updateErr.message)
  }

  console.log('[emails/sync] Done. Synced:', rows.length)
  return NextResponse.json({ synced: rows.length })
}
