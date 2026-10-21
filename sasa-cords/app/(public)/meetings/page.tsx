import { createAdminClient } from '@/lib/supabase/server'
import MeetingsClient from '@/components/public/MeetingsClient'

export const dynamic = 'force-dynamic'

export default async function MeetingsPage() {
  const admin = createAdminClient()

  const { data: meetings, error } = await admin
    .from('meetings')
    .select('*, semester:semesters(name)')
    .order('date', { ascending: false })

  if (error) throw new Error('Unable to load meeting information')
  const today    = new Date().toISOString().split('T')[0]
  const upcoming = (meetings ?? []).filter((m: any) => m.date >= today)
  const past     = (meetings ?? []).filter((m: any) => m.date < today)

  return <MeetingsClient upcoming={upcoming} past={past} />
}