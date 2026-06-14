import { createAdminClient } from '@/lib/supabase/server'
import MembersClient from '@/components/admin/MembersClient'

export const dynamic = 'force-dynamic'

export default async function AdminMembersPage() {
  const admin = createAdminClient()

  const [{ data: members }, { data: semesters }] = await Promise.all([
    admin
      .from('members')
      .select('*, member_semesters(*, semester:semesters(*))')
      .order('full_name'),
    admin
      .from('semesters')
      .select('*')
      .order('year', { ascending: false }),
  ])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Members</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage member records, activity data, and eligibility
        </p>
      </div>
      <MembersClient
        initialMembers={members ?? []}
        semesters={semesters ?? []}
      />
    </div>
  )
}