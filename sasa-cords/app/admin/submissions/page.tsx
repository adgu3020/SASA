import { createServerClient } from '@/lib/supabase/server'
import SubmissionsClient from '@/components/admin/SubmissionsClient'

export default async function AdminSubmissionsPage() {
  const supabase = await createServerClient()

  const { data: submissions } = await supabase
    .from('cord_submissions')
    .select(`
      *,
      member:members(id, full_name, email, eligibility_status, total_semesters, total_events, total_tasks, volunteer_hours, has_leadership),
      reviewer:profiles(full_name, email)
    `)
    .order('submitted_at', { ascending: false })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Cord Submissions</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Review and process student graduation cord requests
        </p>
      </div>
      <SubmissionsClient initialSubmissions={submissions ?? []} />
    </div>
  )
}
