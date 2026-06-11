import Sidebar from '@/components/shared/Sidebar'
import type { Profile } from '@/types'

const mockProfile: Profile = {
  id: 'student',
  email: 'student@sasa.com',
  full_name: 'Student',
  role: 'student',
  created_at: '',
  updated_at: '',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar profile={mockProfile} />
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}