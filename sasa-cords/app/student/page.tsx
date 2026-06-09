import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentDashboard from '@/components/student/StudentDashboard'

export default async function StudentPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: member } = await supabase
    .from('members')
    .select('*, member_semesters(*, semester:semesters(*))')
    .eq('profile_id', user.id)
    .maybeSingle()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  const { data: submission } = await supabase
    .from('cord_submissions')
    .select('*')
    .eq('submitted_email', profile?.email ?? '')
    .order('submitted_at', { ascending: false })
    .maybeSingle()

  return (
    <StudentDashboard
      profile={profile}
      member={member}
      notifications={notifications ?? []}
      submission={submission}
    />
  )
}
