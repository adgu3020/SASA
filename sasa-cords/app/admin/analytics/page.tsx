import { createAdminClient } from '@/lib/supabase/server'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
  const admin = createAdminClient()

  const [{ data: members }, { data: submissions }, { data: semesters }] = await Promise.all([
    admin.from('members').select('eligibility_status, graduation_year, created_at, total_semesters, total_events'),
    admin.from('cord_submissions').select('status, submitted_at, auto_eligible'),
    admin.from('semesters').select('*, member_semesters(count)').order('year', { ascending: false }).limit(6),
  ])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm">Eligibility trends and membership insights</p>
      </div>
      <AnalyticsDashboard
        members={members ?? []}
        submissions={submissions ?? []}
        semesters={semesters ?? []}
      />
    </div>
  )
}