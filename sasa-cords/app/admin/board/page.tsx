import { requireAdminPage } from '@/lib/supabase/server'
import BoardManager from '@/components/admin/BoardManager'
export default async function AdminBoardPage() {
  await requireAdminPage()
  return <div className="space-y-6"><h1 className="font-serif text-3xl">Board Members</h1><p className="text-sm text-muted-foreground">Manage the public board page. These profiles are separate from the student attendance directory.</p><BoardManager /></div>
}
