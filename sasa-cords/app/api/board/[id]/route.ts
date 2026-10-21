import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, verifyAuth } from '@/lib/supabase/server'
import { boardInput } from '@/lib/board-input'
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  let input
  try { input = boardInput(await request.json()) }
  catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }) }
  // Clearing/replacing a photo also clears the bundled seed photo; otherwise preserve it.
  const { data, error } = await createAdminClient().from('board_members')
    .update({ ...input, ...('photo_path' in input && { local_image: null }) }).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
// Hide rather than deleting: removal from public display is reversible.
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { error } = await createAdminClient().from('board_members').update({ is_visible: false }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: { id: params.id } })
}
