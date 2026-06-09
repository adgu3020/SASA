import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { checkEligibility } from '@/lib/eligibility'
import { STUDENT_NOTIFICATIONS } from '@/lib/eligibility.config'

async function requireAdmin(supabase: any, user: any) {
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin'
}

// PUT /api/members/[id] — update member and semester records
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createServerClient()
  const admin    = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await requireAdmin(supabase, user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { semester_records = [], ...memberData } = body
  const { id } = params

  // Update member core fields
  const { error: memberError } = await admin.from('members').update({
    full_name:       memberData.full_name,
    email:           memberData.email,
    graduation_year: memberData.graduation_year,
    major:           memberData.major || null,
    is_active:       memberData.is_active ?? true,
    admin_notes:     memberData.admin_notes || null,
    admin_override:  memberData.admin_override ?? false,
    ...(memberData.admin_override && { eligibility_status: memberData.eligibility_status }),
  }).eq('id', id)

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 })

  // Replace semester records: delete old, insert new
  await admin.from('member_semesters').delete().eq('member_id', id)

  if (semester_records.length > 0) {
    const records = semester_records.map((r: any) => ({
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
    await admin.from('member_semesters').insert(records)
  }

  // Re-fetch full member (aggregates updated by trigger)
  const { data: fullMember } = await admin
    .from('members')
    .select('*, member_semesters(*, semester:semesters(*))')
    .eq('id', id)
    .single()

  // Auto-recalculate eligibility unless overridden
  if (!memberData.admin_override && fullMember) {
    const result = checkEligibility(fullMember, fullMember.member_semesters ?? [])
    await admin.from('members').update({ eligibility_status: result.status }).eq('id', id)
    fullMember.eligibility_status = result.status

    // Send in-app notification if they have a linked profile
    if (fullMember.profile_id) {
      await admin.from('notifications').insert({
        profile_id: fullMember.profile_id,
        member_id:  id,
        type:       result.status,
        title:      result.allMet ? 'You are eligible for a cord!' : 'Eligibility status updated',
        message:    result.allMet
          ? STUDENT_NOTIFICATIONS.eligible
          : STUDENT_NOTIFICATIONS.not_eligible,
      })
    }
  }

  // Audit
  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'member.update',
    target_type: 'member',
    target_id: id,
    details: { full_name: memberData.full_name },
  })

  return NextResponse.json({ data: fullMember })
}

// DELETE /api/members/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createServerClient()
  const admin    = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!await requireAdmin(supabase, user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = params
  const { error } = await admin.from('members').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    action: 'member.delete',
    target_type: 'member',
    target_id: id,
  })

  return NextResponse.json({ data: { id } })
}
