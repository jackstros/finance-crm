import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const RECRUITING_KEYWORDS = [
  'interview',
  'application',
  'applied',
  'offer',
  'superday',
  'coffee chat',
  'recruiting',
  'recruiter',
  'internship',
  'analyst',
  'associate',
  'networking',
  'informational',
  'hireview',
  'hirevue',
  'assessment',
  'final round',
  'first round',
  'phone screen',
  'on-site',
  'onsite',
  'new hire',
]

// Keywords that indicate a high-confidence recruiting event worth auto-creating a firm for
const AUTO_CREATE_KEYWORDS = [
  'interview',
  'superday',
  'final round',
  'first round',
  'phone screen',
  'on-site',
  'onsite',
  'hirevue',
  'hireview',
  'offer',
]

// Job platforms / ATS senders — don't infer firm name from these domains
const ATS_DOMAINS = new Set([
  'greenhouse.io',
  'workday.com',
  'myworkdayjobs.com',
  'lever.co',
  'smartrecruiters.com',
  'taleo.net',
  'icims.com',
  'brassring.com',
  'jobvite.com',
  'jazz.co',
  'indeed.com',
  'linkedin.com',
  'ziprecruiter.com',
  'handshake.com',
  'welcometothejungle.com',
])

function isRecruitingEmail(subject: string, bodyPreview: string): boolean {
  const text = (subject + ' ' + bodyPreview).toLowerCase()
  return RECRUITING_KEYWORDS.some((kw) => text.includes(kw))
}

// Returns 'offer', 'interview', or null based on which high-signal keywords are present
function inferStatus(subject: string, bodyPreview: string): 'offer' | 'interview' | null {
  const text = (subject + ' ' + bodyPreview).toLowerCase()
  if (text.includes('offer')) return 'offer'
  if (AUTO_CREATE_KEYWORDS.some((kw) => text.includes(kw))) return 'interview'
  return null
}

// Derive a firm name from the sender. Returns null if no clean name can be found.
// Priority: sender display name → sender domain (skips known ATS domains)
function inferFirmName(senderEmail: string, senderName: string): string | null {
  if (senderName) {
    const cleaned = senderName
      // Strip trailing generic recruiting/ops words
      .replace(/\b(recruiting|recruitment|careers?|hr|human resources?|talent|acquisition|no[\s-]?reply|do[\s-]?not[\s-]?reply|noreply|notifications?|team|jobs?|hiring|alerts?)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (cleaned.length >= 3) return cleaned
  }

  // Fall back to sender domain if it's not a known ATS
  const domain = senderEmail.split('@')[1] ?? ''
  if (!ATS_DOMAINS.has(domain)) {
    const sld = extractSLD(senderEmail)
    if (sld && sld.length >= 3) {
      return sld.charAt(0).toUpperCase() + sld.slice(1)
    }
  }

  return null
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Extract the second-level domain from an email address
// "john@recruiting.goldmansachs.com" → "goldmansachs"
// "noreply@jpmorgan.com" → "jpmorgan"
function extractSLD(email: string): string {
  const domain = email.split('@')[1] ?? ''
  const parts = domain.split('.')
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0]
}

function matchFirmByDomain(senderEmail: string, firmName: string): boolean {
  const sld = normalize(extractSLD(senderEmail))
  const normFirm = normalize(firmName)

  if (!sld || sld.length < 2) return false

  // Direct containment: domain inside firm name or firm name inside domain
  if (normFirm.includes(sld) || (sld.length >= 4 && sld.includes(normFirm.slice(0, 6)))) return true

  // Word-level: any word in the firm name (4+ chars) appears in the domain or vice versa
  const words = firmName.toLowerCase().split(/\s+/).filter((w) => w.length >= 4)
  return words.some((w) => {
    const nw = normalize(w)
    return sld.includes(nw) || nw.includes(sld)
  })
}

// Match a firm by name appearing in the email subject or body preview.
// Handles multi-word names like "Wells Fargo" and abbreviations like "J.P. Morgan".
function matchFirmByText(subject: string, bodyPreview: string, firmName: string): boolean {
  const text = normalize(subject + ' ' + bodyPreview)
  const normFirm = normalize(firmName)
  if (normFirm.length < 3) return false

  // Full normalized name appears in text
  if (text.includes(normFirm)) return true

  // Any word in the firm name (5+ chars) appears in the text
  const words = firmName.toLowerCase().split(/\s+/).filter((w) => w.length >= 5)
  return words.some((w) => text.includes(normalize(w)))
}

async function getValidAccessToken(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<string | null> {
  const { data: row } = await supabase
    .from('microsoft_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single()

  if (!row) return null

  const expiresAt = new Date(row.expires_at)
  const needsRefresh = expiresAt.getTime() - Date.now() < 5 * 60 * 1000

  if (!needsRefresh) return row.access_token

  if (!row.refresh_token) return row.access_token // best effort

  const res = await fetch(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: row.refresh_token,
        scope: 'openid profile email offline_access Mail.Read',
      }),
    }
  )

  if (!res.ok) return row.access_token // use old token as fallback

  const fresh = await res.json()
  const newExpiresAt = new Date(
    Date.now() + (fresh.expires_in ?? 3600) * 1000
  ).toISOString()

  await supabase
    .from('microsoft_tokens')
    .update({
      access_token: fresh.access_token,
      refresh_token: fresh.refresh_token ?? row.refresh_token,
      expires_at: newExpiresAt,
    })
    .eq('user_id', userId)

  return fresh.access_token
}

export async function POST() {
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accessToken = await getValidAccessToken(supabase, user.id)
  if (!accessToken) {
    return NextResponse.json(
      { error: 'No Microsoft account connected' },
      { status: 400 }
    )
  }

  // Fetch user's contacts and firms for matching
  // firms is kept mutable so newly auto-created firms are available within the same sync run
  const [{ data: contacts }, { data: firmsData }] = await Promise.all([
    supabase.from('contacts').select('id, email, firm').eq('user_id', user.id),
    supabase.from('firms').select('id, firm_name').eq('user_id', user.id),
  ])
  const firms: { id: string; firm_name: string }[] = firmsData ?? []

  // Fetch emails from Graph API — last 60 days, paginate up to 500
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  const allMessages: GraphMessage[] = []

  let pageUrl: string =
    `https://graph.microsoft.com/v1.0/me/messages` +
    `?$filter=receivedDateTime ge ${since}` +
    `&$select=id,subject,from,receivedDateTime,bodyPreview` +
    `&$top=100` +
    `&$orderby=receivedDateTime desc`

  for (let page = 0; page < 5; page++) {
    const graphRes: Response = await fetch(pageUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!graphRes.ok) {
      const body = await graphRes.text()
      console.error('Graph API error:', graphRes.status, body)
      return NextResponse.json(
        { error: 'Graph API request failed', status: graphRes.status },
        { status: 502 }
      )
    }

    const data = await graphRes.json()
    allMessages.push(...(data.value ?? []))
    const nextPage: string | undefined = data['@odata.nextLink']
    if (!nextPage) break
    pageUrl = nextPage
  }

  // Filter for recruiting-related emails
  const recruitingMessages = allMessages.filter((m) =>
    isRecruitingEmail(m.subject ?? '', m.bodyPreview ?? '')
  )

  // Match each email to a contact and/or firm, then upsert
  const toUpsert: OutlookEmailRow[] = []
  let firmsCreated = 0

  for (const msg of recruitingMessages) {
    const senderEmail = msg.from?.emailAddress?.address?.toLowerCase() ?? ''
    const senderName = msg.from?.emailAddress?.name ?? ''

    let contactId: string | null = null
    let firmId: string | null = null

    // Exact email match → contact
    const matchedContact = contacts?.find(
      (c) => c.email && c.email.toLowerCase() === senderEmail
    )
    if (matchedContact) contactId = matchedContact.id

    // Domain match → firm
    if (senderEmail.includes('@')) {
      const matchedFirm = firms.find((f) =>
        matchFirmByDomain(senderEmail, f.firm_name)
      )
      if (matchedFirm) firmId = matchedFirm.id

      // Domain match for contact via their firm field
      if (!contactId) {
        const domainContact = contacts?.find(
          (c) => c.firm && matchFirmByDomain(senderEmail, c.firm)
        )
        if (domainContact) contactId = domainContact.id
      }
    }

    // Text match → firm (catches emails from ATS senders like greenhouse.io where
    // the firm name appears in the subject/body but not the sender domain)
    if (!firmId) {
      const textMatchedFirm = firms.find((f) =>
        matchFirmByText(msg.subject ?? '', msg.bodyPreview ?? '', f.firm_name)
      )
      if (textMatchedFirm) firmId = textMatchedFirm.id
    }

    // Auto-create firm for interview/offer emails with no existing match
    if (!firmId) {
      const autoStatus = inferStatus(msg.subject ?? '', msg.bodyPreview ?? '')
      if (autoStatus) {
        const firmName = inferFirmName(senderEmail, senderName)
        if (firmName) {
          // Avoid duplicates: check if we already created this firm in this sync run
          const dupe = firms.find(
            (f) => normalize(f.firm_name) === normalize(firmName)
          )
          if (dupe) {
            firmId = dupe.id
          } else {
            const { data: newFirm, error: insertError } = await supabase
              .from('firms')
              .insert({ user_id: user.id, firm_name: firmName, status: autoStatus })
              .select('id')
              .single()
            if (newFirm && !insertError) {
              firmId = newFirm.id
              firms.push({ id: newFirm.id, firm_name: firmName })
              firmsCreated++
              console.log(`[Outlook Sync] Auto-created firm "${firmName}" (${autoStatus})`)
            }
          }
        }
      }
    }

    // Only store if at least one match was found
    if (contactId || firmId) {
      toUpsert.push({
        user_id: user.id,
        message_id: msg.id,
        subject: msg.subject ?? '(no subject)',
        from_email: senderEmail,
        from_name: senderName,
        received_at: msg.receivedDateTime ?? null,
        body_preview: msg.bodyPreview ?? null,
        contact_id: contactId,
        firm_id: firmId,
      })
    }
  }

  if (toUpsert.length > 0) {
    await supabase
      .from('outlook_emails')
      .upsert(toUpsert, { onConflict: 'user_id,message_id' })
  }

  // Record last sync time
  await supabase
    .from('microsoft_tokens')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('user_id', user.id)

  return NextResponse.json({
    scanned: allMessages.length,
    recruiting: recruitingMessages.length,
    synced: toUpsert.length,
    firmsCreated,
  })
}

// ── Types ────────────────────────────────────────────────────────────────────

type GraphMessage = {
  id: string
  subject?: string
  bodyPreview?: string
  receivedDateTime?: string
  from?: {
    emailAddress?: {
      address?: string
      name?: string
    }
  }
}

type OutlookEmailRow = {
  user_id: string
  message_id: string
  subject: string
  from_email: string
  from_name: string
  received_at: string | null
  body_preview: string | null
  contact_id: string | null
  firm_id: string | null
}
