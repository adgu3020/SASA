import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// PATCH /api/notifications — mark notification(s) as read
export async function PATCH(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, all } = body // id = single notif, all = mark all read

  if (all) {
    await supabase.from('notifications').update({ is_read: true }).eq('profile_id', user.id)
    return NextResponse.json({ data: { updated: 'all' } })
  }

  if (id) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('profile_id', user.id) // ensure user can only mark their own

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: { id } })
  }

  return NextResponse.json({ error: 'Provide id or all=true' }, { status: 400 })
}
