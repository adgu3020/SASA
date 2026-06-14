import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, verifyAuth } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Get profile
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', auth.userId)
    .single()

  // Get member — first try profile_id, then by email
  let member: any = null
  const { data: memberByProfile } = await admin
    .from('members')
    .select('*, member_semesters(*, semester:semesters(*))')
    .eq('profile_id', auth.userId)
    .maybeSingle()

  member = memberByProfile

  if (!member && profile?.email) {
    const { data: memberByEmail } = await admin
      .from('members')
      .select('*, member_semesters(*, semester:semesters(*))')
      .eq('email', profile.email)
      .maybeSingle()
    member = memberByEmail

    // Auto-link if found by email
    if (member && !member.profile_id) {
      await admin.from('members').update({ profile_id: auth.userId }).eq('id', member.id)
    }
  }

  // Get all meetings
  const { data: meetings } = await admin
    .from('meetings')
    .select('*, semester:semesters(name)')
    .order('date', { ascending: false })

  // Get student's attendance records
  let attendedMeetingIds: string[] = []
  if (member) {
    const { data: attendance } = await admin
      .from('attendance')
      .select('meeting_id')
      .eq('member_id', member.id)
      .eq('attended', true)
    attendedMeetingIds = (attendance ?? []).map((a: any) => a.meeting_id)
  }

  // Get submissions
  const { data: submissions } = await admin
    .from('cord_submissions')
    .select('*')
    .eq('submitted_email', profile?.email ?? '')
    .order('submitted_at', { ascending: false })

  // Get notifications
  const { data: notifications } = await admin
    .from('notifications')
    .select('*')
    .eq('profile_id', auth.userId)
    .order('created_at', { ascending: false })

  return NextResponse.json({
    data: {
      profile,
      member,
      meetings: meetings ?? [],
      attendedMeetingIds,
      submissions: submissions ?? [],
      notifications: notifications ?? [],
    }
  })
}