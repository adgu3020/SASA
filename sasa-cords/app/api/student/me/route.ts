import { ensureStudentMember } from '@/lib/student-link'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, verifyAuth } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Get profile
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', auth.userId)
    .single()

  if (profileError) return NextResponse.json({ error: 'Unable to load your profile' }, { status: 500 })
  try { await ensureStudentMember(auth.userId) }
  catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 409 }) }
  const { data: member, error: memberError } = await admin
    .from('members').select('*, member_semesters(*, semester:semesters(*))')
    .eq('profile_id', auth.userId).single()
  if (memberError) return NextResponse.json({ error: 'Unable to load attendance profile' }, { status: 500 })

  // Get all meetings
  const { data: meetings, error: meetingsError } = await admin
    .from('meetings')
    .select('*, semester:semesters(name)')
    .order('date', { ascending: false })

  // Get student's attendance records
  let attendedMeetingIds: string[] = []
  if (member) {
    const { data: attendance, error: attendanceError } = await admin
      .from('attendance')
      .select('meeting_id')
      .eq('member_id', member.id)
      .eq('attended', true)
    if (attendanceError) return NextResponse.json({ error: 'Unable to load attendance history' }, { status: 500 })
    attendedMeetingIds = (attendance ?? []).map((a: any) => a.meeting_id)
  }

  // Get submissions
  const { data: submissions, error: submissionsError } = await admin
    .from('cord_submissions')
    .select('*')
    .eq('member_id', member.id)
    .order('submitted_at', { ascending: false })

  // Get notifications
  const { data: notifications, error: notificationsError } = await admin
    .from('notifications')
    .select('*')
    .eq('profile_id', auth.userId)
    .order('created_at', { ascending: false })

  if (meetingsError || submissionsError || notificationsError) return NextResponse.json({ error: 'Unable to load dashboard data. Please retry.' }, { status: 500 })
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