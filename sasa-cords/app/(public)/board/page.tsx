import { createAdminClient } from '@/lib/supabase/server'
import BoardClient from '@/components/public/BoardClient'
export const dynamic = 'force-dynamic'
export default async function BoardPage() {
  const admin = createAdminClient()
  const { data, error } = await admin.from('board_members').select('*').eq('is_visible',true).order('display_order').order('id')
  if (error) throw new Error('Unable to load board information')
  const members = (data ?? []).map(b => ({ name: b.name, role: b.role, bio: b.bio,
    image: b.photo_path ? admin.storage.from('board-photos').getPublicUrl(b.photo_path).data.publicUrl : b.local_image,
    imagePosition: b.image_position, instagram: b.instagram ? `@${b.instagram}` : undefined,
    instagramUrl: b.instagram ? `https://www.instagram.com/${b.instagram}/` : undefined }))
  return <BoardClient members={members} />
}
