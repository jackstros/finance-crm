import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getValidToken, createOutlookEvent } from '@/lib/microsoft'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    subject:    string
    startTime:  string
    endTime:    string
    location?:  string
    notes?:     string
    contactId?: string
    attendees?: Array<{ address: string; name: string }>
  }

  if (!body.subject || !body.startTime || !body.endTime) {
    return NextResponse.json({ error: 'subject, startTime, endTime are required' }, { status: 400 })
  }

  const accessToken = await getValidToken(user.id, supabase)
  if (!accessToken) {
    return NextResponse.json(
      { error: 'No valid Microsoft connection. Please reconnect Outlook.' },
      { status: 400 }
    )
  }

  // Resolve contact info if contactId provided
  let contactEmail: string | null = null
  let contactName:  string | null = null
  if (body.contactId) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('email, name')
      .eq('id', body.contactId)
      .eq('user_id', user.id)
      .single()
    if (contact) {
      contactEmail = contact.email
      contactName  = contact.name
    }
  }

  const attendees = body.attendees ?? []
  if (contactEmail && contactName && !attendees.find((a) => a.address === contactEmail)) {
    attendees.push({ address: contactEmail, name: contactName })
  }

  let outlookId: string
  try {
    const created = await createOutlookEvent(accessToken, {
      subject:   body.subject,
      startTime: body.startTime,
      endTime:   body.endTime,
      location:  body.location,
      notes:     body.notes,
      attendees,
    })
    outlookId = created.id
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[calendar/events] createOutlookEvent failed:', msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  const { data: row, error: dbErr } = await supabase
    .from('calendar_events')
    .insert({
      user_id:          user.id,
      outlook_event_id: outlookId,
      contact_id:       body.contactId ?? null,
      title:            body.subject,
      start_time:       body.startTime,
      end_time:         body.endTime,
      location:         body.location ?? null,
      body_preview:     body.notes    ?? null,
      attendees:        attendees,
      is_recruiting:    !!body.contactId,
    })
    .select('id')
    .single()

  if (dbErr) {
    console.error('[calendar/events] DB insert error:', dbErr.message)
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  return NextResponse.json({ id: row.id, outlookId })
}
