import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, verifyAuth } from '@/lib/supabase/server'
import { checkEligibility } from '@/lib/eligibility'
import { STUDENT_NOTIFICATIONS } from '@/lib/eligibility.config'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const body = await request.json()
  const { semester_records = [], ...memberData } = body
  const { id } = await params

  const { error: memberError } = await admin.from('members').update({
    full_name: memberData.full_name, email: memberData.email,
    graduation_year: memberData.graduation_year, major: memberData.major || null,
    is_active: memberData.is_active ?? true, admin_notes: memberData.admin_notes || null,
    admin_override: memberData.admin_override ?? false,
    ...(memberData.admin_override && { eligibility_status: memberData.eligibility_status }),
  }).eq('id', id)

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 })

  const deduped = Array.from(
    new Map(semester_records.map((r: any) => [r.semester_id, r])).values()
  )
  const currentSemesterIds = deduped.map((r: any) => r.semester_id)

  // Remove any semester records the user took OUT of the form
  let deleteQuery = admin.from('member_semesters').delete().eq('member_id', id)
  if (currentSemesterIds.length > 0) {
    deleteQuery = deleteQuery.not('semester_id', 'in', `(${currentSemesterIds.join(',')})`)
  }
  const { error: deleteError } = await deleteQuery
  if (deleteError) {
    return NextResponse.json({ error: `Failed to clear old semester data: ${deleteError.message}` }, { status: 500 })
  }

  // Upsert current records — updates existing rows instead of erroring on conflict
  if (deduped.length > 0) {
    const records = deduped.map((r: any) => ({
      member_id:         id,
      semester_id:       r.semester_id,
      meetings_attended: r.meetings_attended,
      meetings_total:    r.meetings_total,
      events_attended:   r.events_attended,
      tasks_completed:   r.tasks_completed,
      volunteer_hours:   r.volunteer_hours,
      held_leadership:   r.held_leadership,
      leadership_role:   r.leadership_role || null,
    }))

    const { error: semUpsertError } = await admin
      .from('member_semesters')
      .upsert(records, { onConflict: 'member_id,semester_id' })

    if (semUpsertError) {
      return NextResponse.json({ error: `Failed to save semester data: ${semUpsertError.message}` }, { status: 500 })
    }
  }

  const { data: fullMember } = await admin
    .from('members').select('*, member_semesters(*, semester:semesters(*))').eq('id', id).single()

  if (!memberData.admin_override && fullMember) {
    const result = checkEligibility(fullMember, fullMember.member_semesters ?? [])
    await admin.from('members').update({ eligibility_status: result.status }).eq('id', id)
    fullMember.eligibility_status = result.status

    if (fullMember.profile_id) {
      await admin.from('notifications').insert({
        profile_id: fullMember.profile_id, member_id: id, type: result.status,
        title: result.allMet ? 'You are eligible for a cord!' : 'Eligibility status updated',
        message: result.allMet ? STUDENT_NOTIFICATIONS.eligible : STUDENT_NOTIFICATIONS.not_eligible,
      })
    }
  }

  await admin.from('audit_logs').insert({
    actor_id: auth.userId, action: 'member.update',
    target_type: 'member', target_id: id, details: { full_name: memberData.full_name },
  })

  return NextResponse.json({ data: fullMember })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { id } = await params
  const { error } = await admin.from('members').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('audit_logs').insert({
    actor_id: auth.userId, action: 'member.delete', target_type: 'member', target_id: id,
  })

  return NextResponse.json({ data: { id } })
}