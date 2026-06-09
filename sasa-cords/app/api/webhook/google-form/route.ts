import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { isEligible } from '@/lib/eligibility'
import { emailNewSubmission } from '@/lib/email'

// This endpoint receives POST requests from Google Apps Script
// when a student submits the Google Form.
//
// HOW TO SECURE THIS:
// The Apps Script sends a header: X-Webhook-Secret: <your WEBHOOK_SECRET>
// We verify it here before processing.

export async function POST(request: NextRequest) {
  // ── Verify webhook secret ───────────────────────────────────────────
  const secret = request.headers.get('x-webhook-secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // ── Extract fields from Google Form payload ─────────────────────────
  // These field names come from your Google Form question titles.
  // Adjust these keys to match your exact form question titles.
  const {
    response_id,       // Google Form response ID (prevents duplicates)
    full_name,         // "Full Name" question
    email,             // "Email Address" question
    graduation_year,   // "Graduation Year" question
    comments,          // "Comments / Notes (Optional)" question
  } = body

  if (!email || !full_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // ── Prevent duplicate submissions ───────────────────────────────────
  if (response_id) {
    const { data: existing } = await admin
      .from('cord_submissions')
      .select('id')
      .eq('form_response_id', response_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ message: 'Already processed' }, { status: 200 })
    }
  }

  // ── Try to match to existing member ─────────────────────────────────
  const { data: member } = await admin
    .from('members')
    .select('*, member_semesters(*, semester:semesters(*))')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  // ── Check auto-eligibility ───────────────────────────────────────────
  let autoEligible: boolean | null = null
  if (member) {
    autoEligible = isEligible(member, member.member_semesters ?? [])
  }

  // ── Insert submission ───────────────────────────────────────────────
  const { data: submission, error } = await admin
    .from('cord_submissions')
    .insert({
      member_id:        member?.id ?? null,
      submitted_name:   full_name.trim(),
      submitted_email:  email.toLowerCase().trim(),
      graduation_year:  graduation_year ? Number(graduation_year) : null,
      comments:         comments ?? null,
      form_response_id: response_id ?? null,
      auto_eligible:    autoEligible,
      status:           'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('[Webhook] Insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ── In-app notification to student (if profile linked) ──────────────
  if (member?.profile_id) {
    await admin.from('notifications').insert({
      profile_id: member.profile_id,
      member_id:  member.id,
      type:       'info',
      title:      'Cord Request Received',
      message:    'Your graduation cord request has been received and is under review. We will update you soon.',
    })
  }

  // ── Admin email notification ─────────────────────────────────────────
  await emailNewSubmission({
    studentName:    full_name,
    studentEmail:   email,
    graduationYear: graduation_year ? Number(graduation_year) : null,
    autoEligible,
    comments,
  })

  return NextResponse.json({ data: { id: submission.id, auto_eligible: autoEligible } })
}
