import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, verifyAuth } from '@/lib/supabase/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { id } = await params

  const { data, error } = await admin
    .from('attendance')
    .select('*, member:members(id, full_name, email)')
    .eq('meeting_id', id).eq('attended', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { id: meeting_id } = await params
  let member_ids: unknown
  try { ({ member_ids } = await request.json()) }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!Array.isArray(member_ids) || member_ids.length > 10000 || member_ids.some(id => typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id))) {
    return NextResponse.json({ error: 'Invalid student selection' }, { status: 400 })
  }
  const { data: count, error } = await admin.rpc('save_meeting_attendance', {
    p_meeting: meeting_id, p_members: [...new Set(member_ids)], p_actor: auth.userId,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data: { meeting_id, count } })
}
