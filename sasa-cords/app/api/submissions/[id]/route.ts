import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { STUDENT_NOTIFICATIONS } from '@/lib/eligibility.config'
import { emailStudentMarkedEligible, emailSubmissionRejected } from '@/lib/email'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createServerClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()
  if (adminProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = params
  const body   = await request.json()
  const { status, reviewer_notes } = body

  // Fetch submission + member
  const { data: submission } = await admin
    .from('cord_submissions')
    .select('*, member:members(id, profile_id, full_name, email)')
    .eq('id', id)
    .single()

  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Update submission
  const { data: updated, error } = await admin
    .from('cord_submissions')
    .update({
      status,
      reviewer_notes: reviewer_notes || null,
      reviewed_by:    user.id,
      reviewed_at:    new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update member eligibility status if approved/rejected
  if (submission.member?.id) {
    const memberStatus = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : null
    if (memberStatus) {
      await admin.from('members')
        .update({ eligibility_status: memberStatus })
        .eq('id', submission.member.id)
    }

    // In-app notification to student
    if (submission.member.profile_id) {
      const notifType = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'info'
      const notifMsg  = status === 'approved'
        ? STUDENT_NOTIFICATIONS.approved
        : status === 'rejected'
        ? STUDENT_NOTIFICATIONS.rejected
        : STUDENT_NOTIFICATIONS.pending

      await admin.from('notifications').insert({
        profile_id: submission.member.profile_id,
        member_id:  submission.member.id,
        type:       notifType,
        title:      status === 'approved' ? 'Cord Request Approved! 🎓' : status === 'rejected' ? 'Cord Request Update' : 'Request Under Review',
        message:    notifMsg,
      })
    }

    // Admin email notifications
    if (status === 'approved') {
      await emailStudentMarkedEligible({
        studentName:  submission.submitted_name,
        studentEmail: submission.submitted_email,
        adminName:    adminProfile?.full_name ?? undefined,
      })
    } else if (status === 'rejected') {
      await emailSubmissionRejected({
        studentName:  submission.submitted_name,
        studentEmail: submission.submitted_email,
        notes:        reviewer_notes,
      })
    }
  }

  // Audit log
  await admin.from('audit_logs').insert({
    actor_id:    user.id,
    action:      `submission.${status}`,
    target_type: 'submission',
    target_id:   id,
    details:     { student: submission.submitted_name, status },
  })

  return NextResponse.json({ data: updated })
}
