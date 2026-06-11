import Sidebar from '@/components/shared/Sidebar'
import { createServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  const profile: Profile = session ? {
    id: session.user.id,
    email: session.user.email ?? '',
    full_name: session.user.user_metadata?.full_name ?? session.user.email ?? '',
    role: 'admin',
    created_at: '',
    updated_at: '',
  } : {
    id: '',
    email: '',
    full_name: '',
    role: 'admin',
    created_at: '',
    updated_at: '',
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar profile={profile} />
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}