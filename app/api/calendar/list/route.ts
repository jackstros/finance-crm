import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const to   = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

  const { data: events, error } = await supabase
    .from('calendar_events')
    .select(`
      id,
      outlook_event_id,
      contact_id,
      title,
      start_time,
      end_time,
      location,
      body_preview,
      organizer_email,
      attendees,
      is_recruiting,
      follow_up_logged,
      contacts ( id, name, firm, outreach_status )
    `)
    .eq('user_id', user.id)
    .gte('start_time', from)
    .lte('start_time', to)
    .order('start_time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ events: events ?? [] })
}
