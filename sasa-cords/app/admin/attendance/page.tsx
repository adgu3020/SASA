import { requireAdminPage } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import AttendanceClient from '@/components/admin/AttendanceClient'

export const dynamic = 'force-dynamic'

export default async function AdminAttendancePage() {
  await requireAdminPage()
  const admin = createAdminClient()

  const [{ data: meetings }, { data: members }, { data: semesters }] = await Promise.all([
    admin
      .from('meetings')
      .select('*, semester:semesters(name), attendance(member_id, attended)')
      .order('date', { ascending: false }),
    admin
      .from('members')
      .select('id, full_name, email')
      .eq('is_active', true)
      .order('full_name'),
    admin
      .from('semesters')
      .select('*')
      .order('year', { ascending: false }),
  ])

  const { data: reviews, error: reviewError } = await admin.from('account_link_reviews')
    .select('profile_id,reason,profile:profiles(full_name,email)')
  if (reviewError) throw new Error('Unable to load account reviews')
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Attendance</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Create meetings and track member attendance
        </p>
      </div>
      {!!reviews?.length && <div className="glass-card p-4 border border-amber-300">
        <h2 className="font-semibold">Account links need review</h2>
        <p className="text-sm text-muted-foreground mt-1">Verify ownership before resolving these records in Supabase. Existing attendance has been kept.</p>
        {reviews.map((r: any) => <p key={r.profile_id} className="text-sm mt-2">{r.profile?.full_name || r.profile?.email}: {r.reason}</p>)}
      </div>}
      <AttendanceClient
        initialMeetings={meetings ?? []}
        members={members ?? []}
        semesters={semesters ?? []}
      />
    </div>
  )
}