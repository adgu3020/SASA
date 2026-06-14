import { createAdminClient } from '@/lib/supabase/server'
import AttendanceClient from '@/components/admin/AttendanceClient'

export const dynamic = 'force-dynamic'

export default async function AdminAttendancePage() {
  const admin = createAdminClient()

  const [{ data: meetings }, { data: members }, { data: semesters }] = await Promise.all([
    admin
      .from('meetings')
      .select('*, semester:semesters(name), attendance(member_id)')
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Attendance</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Create meetings and track member attendance
        </p>
      </div>
      <AttendanceClient
        initialMeetings={meetings ?? []}
        members={members ?? []}
        semesters={semesters ?? []}
      />
    </div>
  )
}