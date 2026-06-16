import { NextRequest, NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
// Mailchimp newsletter subscription
//
// Add these to your .env.local and Vercel env vars:
//   MAILCHIMP_API_KEY=your-api-key (from mailchimp.com/account/api)
//   MAILCHIMP_LIST_ID=your-audience-id (from Audience settings)
//   MAILCHIMP_SERVER=us1 (the prefix in your API key, e.g. "us1")
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const API_KEY  = process.env.MAILCHIMP_API_KEY
  const LIST_ID  = process.env.MAILCHIMP_LIST_ID
  const SERVER   = process.env.MAILCHIMP_SERVER

  // If Mailchimp isn't configured yet, return a friendly message
  if (!API_KEY || !LIST_ID || !SERVER) {
    return NextResponse.json(
      { error: 'Newsletter signup is not configured yet. Please contact SASA directly.' },
      { status: 503 }
    )
  }

  const url = `https://${SERVER}.api.mailchimp.com/3.0/lists/${LIST_ID}/members`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `apikey ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_address: email,
      status:        'subscribed',
    }),
  })

  const data = await res.json()

  if (res.ok) {
    return NextResponse.json({ data: { email } })
  }

  // Handle already subscribed
  if (data.title === 'Member Exists') {
    return NextResponse.json({ error: 'You\'re already subscribed!' }, { status: 409 })
  }

  return NextResponse.json(
    { error: data.detail ?? 'Failed to subscribe. Please try again.' },
    { status: 500 }
  )
}