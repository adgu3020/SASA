import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, verifyAuth } from '@/lib/supabase/server'
import { photoExtension } from '@/lib/photo-validation'
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (Number(request.headers.get('content-length')) > 6 * 1024 * 1024) return NextResponse.json({ error: 'Photo is too large' }, { status: 413 })
  try {
    const file = (await request.formData()).get('file')
    if (!file || typeof file === 'string') throw new Error('Choose a photo')
    const bytes = new Uint8Array(await file.arrayBuffer())
    const ext = photoExtension(file.type, file.size, bytes)
    const path = `uploads/${crypto.randomUUID()}.${ext}`
    const { error } = await createAdminClient().storage.from('board-photos').upload(path, bytes, { contentType: file.type, upsert: false })
    if (error) throw new Error('Photo upload failed. Please retry.')
    return NextResponse.json({ data: { path } }, { status: 201 })
  } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }) }
}
export async function DELETE(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { path } = await request.json()
  if (typeof path !== 'string' || !/^uploads\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(path)) return NextResponse.json({ error: 'Invalid photo path' }, { status: 400 })
  const admin = createAdminClient()
  const { count, error } = await admin.from('board_members').select('id', { count: 'exact', head: true }).eq('photo_path', path)
  if (error || count !== 0) return NextResponse.json({ error: 'Photo is still in use or could not be checked' }, { status: 409 })
  const { error: removeError } = await admin.storage.from('board-photos').remove([path])
  if (removeError) return NextResponse.json({ error: 'Unable to remove unused photo' }, { status: 500 })
  return NextResponse.json({ data: { removed: path } })
}
