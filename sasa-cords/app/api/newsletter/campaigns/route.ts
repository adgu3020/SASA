import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
// Fetches your sent Mailchimp campaigns to display on the website
// Uses the same env vars as the subscribe route:
//   MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID, MAILCHIMP_SERVER
// ─────────────────────────────────────────────────────────────

export async function GET() {
  const API_KEY = process.env.MAILCHIMP_API_KEY
  const LIST_ID = process.env.MAILCHIMP_LIST_ID
  const SERVER  = process.env.MAILCHIMP_SERVER

  if (!API_KEY || !LIST_ID || !SERVER) {
    return NextResponse.json({ data: [] })
  }

  const url = `https://${SERVER}.api.mailchimp.com/3.0/campaigns?list_id=${LIST_ID}&status=sent&sort_field=send_time&sort_dir=DESC&count=12`

  try {
    const res = await fetch(url, {
      headers: { Authorization: `apikey ${API_KEY}` },
      next: { revalidate: 3600 }, // cache for 1 hour
    })

    if (!res.ok) {
      return NextResponse.json({ data: [] })
    }

    const json = await res.json()

    const campaigns = (json.campaigns ?? []).map((c: any) => ({
      id:          c.id,
      title:       c.settings?.title || c.settings?.subject_line || 'Newsletter',
      subject:     c.settings?.subject_line,
      sendTime:    c.send_time,
      archiveUrl:  c.archive_url,
      previewText: c.settings?.preview_text || '',
    }))

    return NextResponse.json({ data: campaigns })
  } catch {
    return NextResponse.json({ data: [] })
  }
}