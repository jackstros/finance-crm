import { NextResponse }                         from 'next/server'
import { createClient }                         from '@/lib/supabase/server'
import { getValidToken }                        from '@/lib/microsoft'
import { inferFirmFromEmail, isFinanceDomain }  from '@/lib/firms'

// ── Recruiting relevance filter ───────────────────────────────────────────────

const RECRUITING_KEYWORDS = [
  // Networking intent
  'networking', 'informational interview', 'informational call',
  'coffee chat', 'coffee chats', 'chat',
  'reach out', 'reaching out',
  'introduction', 'introduce myself',
  'speak with you', 'would love to speak', 'speak if possible',
  'minute chat', 'minute call',
  'learn more about',
  // Student identity signals
  'student at', 'first year', 'second year', 'junior', 'senior',
  // Interest signals
  'interested in', 'your firm', 'your company',
  // Recruiting process
  'recruiting', 'recruitment',
  'internship', 'intern program',
  'summer analyst', 'summer associate', 'summer program',
  'investment banking', 'investment bank',
  'private equity', 'hedge fund', 'asset management',
  'capital markets', 'equity research',
  'interview', 'superday', 'phone screen',
  'first round', 'second round', 'final round',
  'offer letter', 'job offer', 'full-time offer',
  'breaking into finance', 'finance career', 'finance role',
  'analyst position', 'associate position',
  'recruiting process', 'application process',
]

function isRecruiting(subject: string | null, bodyText: string | null, counterpartyEmail: string): boolean {
  if (isFinanceDomain(counterpartyEmail)) return true
  const text = `${subject ?? ''} ${bodyText ?? ''}`.toLowerCase()
  return RECRUITING_KEYWORDS.some((kw) => text.includes(kw))
}

function isRecruitingVerbose(subject: string | null, bodyText: string | null, email: string): boolean {
  const domain = email.split('@')[1] ?? '(no domain)'

  if (isFinanceDomain(email)) {
    console.log(`[emails/sync][filter] PASS  domain="${domain}" subject="${subject ?? ''}"`)
    return true
  }

  const text = `${subject ?? ''} ${bodyText ?? ''}`.toLowerCase()
  const hit = RECRUITING_KEYWORDS.find((kw) => text.includes(kw))

  if (hit) {
    console.log(`[emails/sync][filter] PASS  domain="${domain}" subject="${subject ?? ''}" keyword="${hit}"`)
    return true
  }

  // Log which checks failed so we know exactly why it was dropped
  console.log(
    `[emails/sync][filter] SKIP  domain="${domain}" subject="${subject ?? ''}"` +
    ` reason="no finance domain + no keyword match"` +
    ` body_snippet="${(bodyText ?? '').slice(0, 120).replace(/\n/g, ' ')}"`
  )
  return false
}

// ── Firm detection ────────────────────────────────────────────────────────────

type FirmEntry = { id: string; firm_name: string }

function detectFirm(
  email:     string,
  bodyText:  string | null,
  userFirms: FirmEntry[],
): string | null {
  // 1. Domain match — highest confidence
  const domainFirm = inferFirmFromEmail(email)
  if (domainFirm) {
    console.log(`[emails/sync] Firm "${domainFirm}" matched by domain for ${email}`)
    return domainFirm
  }

  // 2. Body keyword scan against user's tracked firms — only if exactly one matches
  if (bodyText && userFirms.length > 0) {
    const bodyLower = bodyText.toLowerCase()
    const matches   = userFirms.filter((f) => bodyLower.includes(f.firm_name.toLowerCase()))
    if (matches.length === 1) {
      console.log(`[emails/sync] Firm "${matches[0].firm_name}" matched by body keyword for ${email}`)
      return matches[0].firm_name
    }
    if (matches.length > 1) {
      console.log(`[emails/sync] Multiple firms matched in body for ${email}: ${matches.map((f) => f.firm_name).join(', ')} — leaving blank`)
    } else {
      console.log(`[emails/sync] No firm match for ${email}`)
    }
  }

  return null
}

// ── Graph API helpers ─────────────────────────────────────────────────────────

interface GraphBody { contentType: string; content: string }

interface GraphSentItem {
  id:            string
  subject?:      string | null
  toRecipients?: Array<{ emailAddress?: { address?: string; name?: string } }>
  sentDateTime?: string
  bodyPreview?:  string | null
  body?:         GraphBody
  webLink?:      string
}

interface GraphReceivedItem {
  id:                string
  subject?:          string | null
  from?:             { emailAddress?: { address?: string; name?: string } }
  receivedDateTime?: string
  bodyPreview?:      string | null
  body?:             GraphBody
  webLink?:          string
}

async function fetchSentItems(accessToken: string): Promise<GraphSentItem[]> {
  const url =
    'https://graph.microsoft.com/v1.0/me/mailFolders/sentitems/messages' +
    '?$top=100' +
    '&$select=id,subject,toRecipients,sentDateTime,bodyPreview,body,webLink' +
    '&$orderby=sentDateTime%20desc'
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer:        'outlook.body-content-type="text"',
    },
  })
  if (!res.ok) {
    const errBody = await res.text()
    console.error('[emails/sync] sentItems error:', res.status, errBody)
    throw new Error(`Graph sentItems error ${res.status}: ${errBody}`)
  }
  const data = await res.json()
  return (data.value ?? []) as GraphSentItem[]
}

async function fetchReceivedItems(accessToken: string): Promise<GraphReceivedItem[]> {
  const url =
    'https://graph.microsoft.com/v1.0/me/messages' +
    '?$top=100' +
    '&$select=id,subject,from,receivedDateTime,bodyPreview,body,webLink,isRead' +
    '&$orderby=receivedDateTime%20desc'
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer:        'outlook.body-content-type="text"',
    },
  })
  if (!res.ok) {
    const errBody = await res.text()
    console.error('[emails/sync] messages error:', res.status, errBody)
    throw new Error(`Graph messages error ${res.status}: ${errBody}`)
  }
  const data = await res.json()
  return (data.value ?? []) as GraphReceivedItem[]
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST() {
  console.log('[emails/sync] Request received')

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) console.error('[emails/sync] Auth error:', authError.message)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accessToken = await getValidToken(user.id, supabase)
  if (!accessToken) {
    return NextResponse.json(
      { error: 'No valid Microsoft connection. Please reconnect Outlook.' },
      { status: 400 }
    )
  }

  // ── Load supporting data in parallel ─────────────────────────────────────────
  const [sentItemsResult, receivedItemsResult, contactsResult, firmsResult] = await Promise.allSettled([
    fetchSentItems(accessToken),
    fetchReceivedItems(accessToken),
    supabase.from('contacts').select('id, email, outreach_status').eq('user_id', user.id).not('email', 'is', null),
    supabase.from('firms').select('id, firm_name').eq('user_id', user.id),
  ])

  if (sentItemsResult.status === 'rejected') {
    const msg = sentItemsResult.reason instanceof Error ? sentItemsResult.reason.message : String(sentItemsResult.reason)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
  if (receivedItemsResult.status === 'rejected') {
    const msg = receivedItemsResult.reason instanceof Error ? receivedItemsResult.reason.message : String(receivedItemsResult.reason)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  const sentItems     = sentItemsResult.value
  const receivedItems = receivedItemsResult.value
  const userFirms     = (firmsResult.status === 'fulfilled' ? firmsResult.value.data : null) ?? [] as FirmEntry[]
  const existingContacts = (contactsResult.status === 'fulfilled' ? contactsResult.value.data : null) ?? []

  console.log('[emails/sync] Fetched', sentItems.length, 'sent,', receivedItems.length, 'received,', userFirms.length, 'user firms')

  // ── Index contacts by email ───────────────────────────────────────────────────
  const contactByEmail = new Map<string, { id: string; outreach_status: string }>()
  for (const c of existingContacts) {
    if (c.email) contactByEmail.set((c.email as string).toLowerCase(), c as { id: string; outreach_status: string })
  }

  // ── Process sent items ────────────────────────────────────────────────────────
  console.log(`[emails/sync] Filter pass/fail counts below (${sentItems.length} sent emails fetched from Graph):`)
  const sentRows: Record<string, unknown>[] = []
  let newContactsCreated = 0

  for (const item of sentItems) {
    const recipient = item.toRecipients?.[0]?.emailAddress
    const toEmail   = recipient?.address ?? null
    const toName    = recipient?.name    ?? null
    if (!toEmail) continue

    const bodyText = item.body?.content ?? item.bodyPreview ?? null
    if (!isRecruitingVerbose(item.subject ?? null, bodyText, toEmail)) continue

    const emailLower    = toEmail.toLowerCase()
    let existingContact = contactByEmail.get(emailLower)
    let contactId: string | null = existingContact?.id ?? null

    if (!existingContact) {
      const firm     = detectFirm(toEmail, bodyText, userFirms as FirmEntry[])
      const sentDate = item.sentDateTime ? new Date(item.sentDateTime).toISOString().slice(0, 10) : null
      const { data: newContact, error: createErr } = await supabase
        .from('contacts')
        .insert({
          user_id:         user.id,
          name:            toName ?? toEmail.split('@')[0],
          email:           toEmail,
          firm:            firm,
          outreach_status: 'Email Sent',
          date_of_contact: sentDate,
          email_sent_time: item.sentDateTime ?? null,
        })
        .select('id')
        .single()

      if (createErr) {
        console.error('[emails/sync] Failed to create contact for', toEmail, createErr.message)
      } else if (newContact) {
        const stub = { id: newContact.id, outreach_status: 'Email Sent' }
        contactByEmail.set(emailLower, stub)
        existingContact = stub
        contactId       = newContact.id
        newContactsCreated++
      }
    }

    sentRows.push({
      user_id:       user.id,
      message_id:    item.id,
      subject:       item.subject      ?? '(no subject)',
      from_email:    null,
      from_name:     null,
      to_email:      toEmail,
      to_name:       toName,
      received_at:   item.sentDateTime ?? null,
      body_preview:  item.bodyPreview  ?? null,
      body_text:     item.body?.content ?? null,
      web_link:      item.webLink      ?? null,
      direction:     'sent',
      is_recruiting: true,
      contact_id:    contactId,
    })
  }
  console.log(`[emails/sync] Sent filter result: ${sentRows.length} passed / ${sentItems.length - sentRows.length} skipped out of ${sentItems.length} fetched`)

  // ── Process received items ────────────────────────────────────────────────────
  const receivedRows: Record<string, unknown>[] = []
  let statusUpdates = 0

  for (const item of receivedItems) {
    const fromEmail = item.from?.emailAddress?.address ?? null
    const fromName  = item.from?.emailAddress?.name    ?? null
    if (!fromEmail) continue

    const bodyText = item.body?.content ?? item.bodyPreview ?? null
    if (!isRecruiting(item.subject ?? null, bodyText, fromEmail)) continue

    const emailLower      = fromEmail.toLowerCase()
    const existingContact = contactByEmail.get(emailLower)

    if (existingContact && existingContact.outreach_status === 'Email Sent') {
      const { error: updateErr } = await supabase
        .from('contacts')
        .update({
          outreach_status:   'Responded',
          last_contact_date: item.receivedDateTime
            ? new Date(item.receivedDateTime).toISOString().slice(0, 10)
            : null,
        })
        .eq('id', existingContact.id)

      if (!updateErr) {
        existingContact.outreach_status = 'Responded'
        statusUpdates++
      } else {
        console.error('[emails/sync] Status update error:', updateErr.message)
      }
    }

    receivedRows.push({
      user_id:       user.id,
      message_id:    item.id,
      subject:       item.subject          ?? '(no subject)',
      from_email:    fromEmail,
      from_name:     fromName,
      to_email:      null,
      to_name:       null,
      received_at:   item.receivedDateTime ?? null,
      body_preview:  item.bodyPreview      ?? null,
      body_text:     item.body?.content    ?? null,
      web_link:      item.webLink          ?? null,
      direction:     'received',
      is_recruiting: true,
      contact_id:    existingContact?.id   ?? null,
    })
  }

  // ── Deduplicate by message_id ─────────────────────────────────────────────────
  const rawRows = [...sentRows, ...receivedRows]
  const deduped = new Map<string, Record<string, unknown>>()
  for (const row of rawRows) {
    const key      = row.message_id as string
    const existing = deduped.get(key)
    if (!existing) {
      deduped.set(key, row)
    } else {
      const existingTs = existing.received_at ? new Date(existing.received_at as string).getTime() : 0
      const rowTs      = row.received_at      ? new Date(row.received_at      as string).getTime() : 0
      if (rowTs > existingTs) deduped.set(key, row)
    }
  }
  const allRows = Array.from(deduped.values())
  console.log(`[emails/sync] Dedup: ${rawRows.length} raw → ${allRows.length} unique (removed ${rawRows.length - allRows.length} duplicate message_ids)`)

  if (allRows.length > 0) {
    const { error: upsertError } = await supabase
      .from('outlook_emails')
      .upsert(allRows, { onConflict: 'user_id,message_id', ignoreDuplicates: false })

    if (upsertError) {
      console.error('[emails/sync] Upsert error:', upsertError.message)
      return NextResponse.json(
        { error: 'Database insert failed', detail: upsertError.message },
        { status: 500 }
      )
    }
  }

  await supabase
    .from('microsoft_tokens')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('user_id', user.id)

  console.log('[emails/sync] Done. sent:', sentRows.length, 'received:', receivedRows.length, 'new contacts:', newContactsCreated, 'status updates:', statusUpdates)

  return NextResponse.json({
    syncedSent:     sentRows.length,
    syncedReceived: receivedRows.length,
    newContacts:    newContactsCreated,
    statusUpdates,
  })
}
