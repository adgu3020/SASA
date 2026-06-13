import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, verifyAuth } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { id } = await params

  const { data, error } = await admin
    .from('attendance')
    .select('*, member:members(id, full_name, email)')
    .eq('meeting_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { id: meeting_id } = await params
  const { member_ids } = await request.json() as { member_ids: string[] }

  await admin.from('attendance').delete().eq('meeting_id', meeting_id)

  if (member_ids.length > 0) {
    const records = member_ids.map(member_id => ({
      meeting_id, member_id, attended: true,
      marked_by: auth.userId, marked_at: new Date().toISOString(),
    }))
    const { error } = await admin.from('attendance').insert(records)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: meeting } = await admin
    .from('meetings').select('semester_id').eq('id', meeting_id).single()

  if (meeting?.semester_id) {
    const { count: totalMeetings } = await admin
      .from('meetings').select('*', { count: 'exact', head: true })
      .eq('semester_id', meeting.semester_id)

    const { data: allMembers } = await admin.from('members').select('id')

    if (allMembers) {
      for (const member of allMembers) {
        const { count: attended } = await admin
          .from('attendance')
          .select('*, meeting:meetings!inner(semester_id)', { count: 'exact', head: true })
          .eq('member_id', member.id)
          .eq('meeting.semester_id', meeting.semester_id)
          .eq('attended', true)

        await admin.from('member_semesters').upsert({
          member_id: member.id,
          semester_id: meeting.semester_id,
          meetings_attended: attended ?? 0,
          meetings_total: totalMeetings ?? 0,
        }, { onConflict: 'member_id,semester_id', ignoreDuplicates: false })
      }
    }
  }

  return NextResponse.json({ data: { meeting_id, count: member_ids.length } })
}