import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, verifyAuth } from '@/lib/supabase/server'
import { isEligible } from '@/lib/eligibility'
import { emailNewSubmission } from '@/lib/email'

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const body = await request.json()
  const { full_name, email, graduation_year, comments } = body

  if (!full_name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  // Check for existing active submission
  const { data: existing } = await admin
    .from('cord_submissions')
    .select('id, status')
    .eq('submitted_email', email.toLowerCase().trim())
    .in('status', ['pending', 'under_review'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'You already have a pending submission. Please wait for it to be reviewed.' },
      { status: 409 }
    )
  }

  // Find matching member for auto-eligibility check
  const { data: member } = await admin
    .from('members')
    .select('*, member_semesters(*, semester:semesters(*))')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  const autoEligible = member ? isEligible(member, member.member_semesters ?? []) : null

  // Create submission
  const { data: submission, error } = await admin
    .from('cord_submissions')
    .insert({
      member_id:       member?.id ?? null,
      submitted_name:  full_name.trim(),
      submitted_email: email.toLowerCase().trim(),
      graduation_year: graduation_year ? Number(graduation_year) : null,
      comments:        comments || null,
      auto_eligible:   autoEligible,
      status:          'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // In-app notification to student
  await admin.from('notifications').insert({
    profile_id: auth.userId,
    member_id:  member?.id ?? null,
    type:       'info',
    title:      'Cord Request Received',
    message:    'Your graduation cord request has been received and is under review. We will update you soon.',
  })

  // Admin email
  await emailNewSubmission({
    studentName:    full_name,
    studentEmail:   email,
    graduationYear: graduation_year ? Number(graduation_year) : null,
    autoEligible,
    comments,
  })

  return NextResponse.json({ data: submission }, { status: 201 })
}