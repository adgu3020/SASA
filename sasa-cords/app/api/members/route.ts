import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, verifyAuth } from '@/lib/supabase/server'
import { checkEligibility } from '@/lib/eligibility'

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('members')
    .select('*, member_semesters(*, semester:semesters(*))')
    .order('full_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const body = await request.json()
  const { semester_records = [], ...memberData } = body

  const { data: member, error: memberError } = await admin
    .from('members')
    .insert({
      full_name:          memberData.full_name,
      email:              memberData.email,
      graduation_year:    memberData.graduation_year,
      major:              memberData.major || null,
      is_active:          memberData.is_active ?? true,
      admin_notes:        memberData.admin_notes || null,
      admin_override:     memberData.admin_override ?? false,
      eligibility_status: memberData.admin_override ? memberData.eligibility_status : 'pending',
    })
    .select().single()

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 })

  if (semester_records.length > 0) {
    const records = semester_records.map((r: any) => ({
      member_id: member.id, semester_id: r.semester_id,
      meetings_attended: r.meetings_attended, meetings_total: r.meetings_total,
      events_attended: r.events_attended, tasks_completed: r.tasks_completed,
      volunteer_hours: r.volunteer_hours, held_leadership: r.held_leadership,
      leadership_role: r.leadership_role || null,
    }))
    const { error: semError } = await admin.from('member_semesters').insert(records)
    if (semError) return NextResponse.json({ error: semError.message }, { status: 500 })
  }

  const { data: fullMember } = await admin
    .from('members').select('*, member_semesters(*, semester:semesters(*))').eq('id', member.id).single()

  if (!memberData.admin_override && fullMember) {
    const result = checkEligibility(fullMember, fullMember.member_semesters ?? [])
    await admin.from('members').update({ eligibility_status: result.status }).eq('id', member.id)
    fullMember.eligibility_status = result.status
  }

  await admin.from('audit_logs').insert({
    actor_id: auth.userId, action: 'member.create',
    target_type: 'member', target_id: member.id, details: { full_name: member.full_name },
  })

  return NextResponse.json({ data: fullMember }, { status: 201 })
}