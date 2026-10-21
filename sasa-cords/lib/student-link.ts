import { createAdminClient } from '@/lib/supabase/server'
export async function ensureStudentMember(userId: string) {
  const { data, error } = await createAdminClient().rpc('ensure_student_member', { p_user_id: userId })
  if (error) throw new Error('Could not connect your attendance record. Please retry or contact SASA.')
  if (!data) throw new Error('Verify your email to connect attendance. If it is verified, contact SASA for account review.')
  return data as string
}
