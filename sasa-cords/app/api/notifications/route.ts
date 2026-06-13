import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, verifyAuth } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { id, all } = await request.json()

  if (all) {
    await admin.from('notifications').update({ is_read: true }).eq('profile_id', auth.userId)
    return NextResponse.json({ data: { updated: 'all' } })
  }

  if (id) {
    const { error } = await admin
      .from('notifications').update({ is_read: true })
      .eq('id', id).eq('profile_id', auth.userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: { id } })
  }

  return NextResponse.json({ error: 'Provide id or all=true' }, { status: 400 })
}