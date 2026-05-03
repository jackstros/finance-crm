import { NextResponse }                        from 'next/server'
import { createClient }                        from '@/lib/supabase/server'
import { inferFirmFromEmail }                  from '@/lib/firms'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Load user's tracked firms for body-keyword matching
  const { data: userFirms } = await supabase
    .from('firms')
    .select('id, firm_name')
    .eq('user_id', user.id)

  const firmList = (userFirms ?? []) as { id: string; firm_name: string }[]

  // Find sent outreach emails whose linked contact has no firm set
  const { data: rows } = await supabase
    .from('outlook_emails')
    .select('id, to_email, body_text, body_preview, contact_id, contacts(id, firm)')
    .eq('direction', 'sent')
    .eq('is_recruiting', true)
    .not('contact_id', 'is', null)

  if (!rows || rows.length === 0) {
    return NextResponse.json({ updated: 0 })
  }

  let updated = 0

  for (const row of rows as unknown as Array<{
    id: string
    to_email: string | null
    body_text: string | null
    body_preview: string | null
    contact_id: string
    contacts: { id: string; firm: string | null } | null
  }>) {
    // Skip if contact already has a firm
    if (row.contacts?.firm) continue
    if (!row.to_email) continue

    // 1. Domain match
    let firm = inferFirmFromEmail(row.to_email)
    if (firm) {
      console.log(`[backfill-firms] "${firm}" matched by domain for ${row.to_email}`)
    } else {
      // 2. Body keyword scan
      const bodyText = row.body_text ?? row.body_preview ?? ''
      if (bodyText && firmList.length > 0) {
        const bodyLower = bodyText.toLowerCase()
        const matches   = firmList.filter((f) => bodyLower.includes(f.firm_name.toLowerCase()))
        if (matches.length === 1) {
          firm = matches[0].firm_name
          console.log(`[backfill-firms] "${firm}" matched by body keyword for ${row.to_email}`)
        } else if (matches.length > 1) {
          console.log(`[backfill-firms] Multiple firms matched for ${row.to_email}: ${matches.map((f) => f.firm_name).join(', ')} — skipping`)
        } else {
          console.log(`[backfill-firms] No firm match for ${row.to_email}`)
        }
      }
    }

    if (firm) {
      const { error } = await supabase
        .from('contacts')
        .update({ firm })
        .eq('id', row.contact_id)
        .eq('user_id', user.id)
      if (!error) updated++
      else console.error(`[backfill-firms] Update failed for contact ${row.contact_id}:`, error.message)
    }
  }

  console.log(`[backfill-firms] Done. Updated ${updated} contacts.`)
  return NextResponse.json({ updated })
}
