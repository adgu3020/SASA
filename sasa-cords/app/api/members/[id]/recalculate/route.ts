import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { checkEligibility } from '@/lib/eligibility'
import { STUDENT_NOTIFICATIONS } from '@/lib/eligibility.config'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createServerClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = params

  const { data: member } = await admin
    .from('members')
    .select('*, member_semesters(*, semester:semesters(*))')
    .eq('id', id)
    .single()

  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  if (member.admin_override) return NextResponse.json({ data: member }) // respect override

  const result = checkEligibility(member, member.member_semesters ?? [])

  const { data: updated } = await admin
    .from('members')
    .update({ eligibility_status: result.status })
    .eq('id', id)
    .select()
    .single()

  // Notify student
  if (member.profile_id) {
    await admin.from('notifications').insert({
      profile_id: member.profile_id,
      member_id:  id,
      type:       result.status,
      title:      'Eligibility Recalculated',
      message:    result.allMet ? STUDENT_NOTIFICATIONS.eligible : STUDENT_NOTIFICATIONS.not_eligible,
    })
  }

  return NextResponse.json({ data: { ...member, ...updated, eligibility_status: result.status } })
}
