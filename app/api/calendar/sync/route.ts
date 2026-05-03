import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getValidToken, fetchCalendarEvents } from '@/lib/microsoft'

const STATUSES_TO_ADVANCE = new Set(['To Reach Out', 'Email Sent', 'Responded'])

export async function POST() {
  console.log('[calendar/sync] Request received')

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) console.error('[calendar/sync] Auth error:', authError.message)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accessToken = await getValidToken(user.id, supabase)
  if (!accessToken) {
    return NextResponse.json(
      { error: 'No valid Microsoft connection. Please reconnect Outlook.' },
      { status: 400 }
    )
  }

  // Fetch last 30 days + next 90 days
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const to   = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

  let graphEvents
  try {
    graphEvents = await fetchCalendarEvents(accessToken, from, to)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[calendar/sync] fetchCalendarEvents error:', msg)
    if (msg === 'calendar_scope_missing') {
      return NextResponse.json({ error: 'calendar_scope_missing' }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  console.log('[calendar/sync] Fetched', graphEvents.length, 'events from Graph')

  // Load all user contacts indexed by email (lowercased)
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, email, outreach_status')
    .eq('user_id', user.id)
    .not('email', 'is', null)

  const contactsByEmail = new Map<string, { id: string; outreach_status: string }>()
  for (const c of contacts ?? []) {
    if (c.email) contactsByEmail.set(c.email.toLowerCase(), c)
  }

  console.log('[calendar/sync] Loaded', contactsByEmail.size, 'contacts with emails')

  let linked       = 0
  let statusUpdates = 0

  const rows = graphEvents.map((ev) => {
    // Collect all attendee + organizer emails
    const allEmails = [
      ev.organizer?.emailAddress?.address,
      ...ev.attendees.map((a) => a.emailAddress?.address),
    ]
      .filter(Boolean)
      .map((e) => e!.toLowerCase())

    let contactId: string | null = null
    for (const email of allEmails) {
      const match = contactsByEmail.get(email)
      if (match) {
        contactId = match.id
        break
      }
    }

    return {
      graphEvent: ev,
      contactId,
      allEmails,
    }
  })

  // Advance statuses and build upsert rows
  const upsertRows = []
  for (const { graphEvent: ev, contactId } of rows) {
    if (contactId) {
      linked++
      const contact = [...contactsByEmail.values()].find((c) => c.id === contactId)
      if (contact && STATUSES_TO_ADVANCE.has(contact.outreach_status)) {
        const { error: updateErr } = await supabase
          .from('contacts')
          .update({ outreach_status: 'Call Scheduled' })
          .eq('id', contactId)
          .eq('user_id', user.id)
        if (updateErr) {
          console.error('[calendar/sync] Failed to advance status for contact', contactId, updateErr.message)
        } else {
          contact.outreach_status = 'Call Scheduled'
          statusUpdates++
        }
      }
    }

    upsertRows.push({
      user_id:          user.id,
      outlook_event_id: ev.id,
      contact_id:       contactId,
      title:            ev.subject || '(No title)',
      start_time:       ev.start.dateTime,
      end_time:         ev.end.dateTime,
      location:         ev.location?.displayName ?? null,
      body_preview:     ev.bodyPreview ?? null,
      organizer_email:  ev.organizer?.emailAddress?.address ?? null,
      attendees:        ev.attendees ?? [],
      is_recruiting:    contactId !== null,
      updated_at:       new Date().toISOString(),
    })
  }

  console.log('[calendar/sync] Upserting', upsertRows.length, 'rows')

  const { error: upsertError } = await supabase
    .from('calendar_events')
    .upsert(upsertRows, { onConflict: 'user_id,outlook_event_id', ignoreDuplicates: false })

  if (upsertError) {
    console.error('[calendar/sync] Upsert error:', upsertError.message, upsertError.details)
    return NextResponse.json(
      { error: 'Database insert failed', detail: upsertError.message },
      { status: 500 }
    )
  }

  console.log('[calendar/sync] Done. synced:', upsertRows.length, 'linked:', linked, 'statusUpdates:', statusUpdates)
  return NextResponse.json({ synced: upsertRows.length, linked, statusUpdates })
}
