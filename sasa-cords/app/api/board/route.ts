import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, verifyAuth } from '@/lib/supabase/server'
import { boardInput } from '@/lib/board-input'
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data, error } = await createAdminClient().from('board_members').select('*').order('display_order').order('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  let input
  try { input = boardInput(await request.json()) }
  catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }) }
  const { data, error } = await createAdminClient().from('board_members').insert(input).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
