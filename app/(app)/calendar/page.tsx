import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import CalendarClient   from './CalendarClient'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const to   = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()

  const { data: events } = await supabase
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

  const { data: tokenRow } = await supabase
    .from('microsoft_tokens')
    .select('microsoft_email')
    .eq('user_id', user.id)
    .single()

  return (
    <CalendarClient
      initialEvents={(events ?? []) as unknown as CalendarEventRow[]}
      connected={!!tokenRow}
    />
  )
}

// Export type so CalendarClient can import it
export type CalendarEventRow = {
  id:               string
  outlook_event_id: string | null
  contact_id:       string | null
  title:            string
  start_time:       string
  end_time:         string
  location:         string | null
  body_preview:     string | null
  organizer_email:  string | null
  attendees:        Array<{ emailAddress: { address: string; name: string }; type: string }>
  is_recruiting:    boolean
  follow_up_logged: boolean
  contacts:         { id: string; name: string; firm: string | null; outreach_status: string } | null
}
