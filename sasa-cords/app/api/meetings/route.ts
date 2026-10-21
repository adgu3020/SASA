import { meetingInput } from '@/lib/meeting-input'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, verifyAuth } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('meetings')
    .select(auth.role === 'admin' ? '*, semester:semesters(name), attendance(count)' : '*, semester:semesters(name)')
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  let input
  try { input = meetingInput(await request.json()) }
  catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }) }

  const { data, error } = await admin
    .from('meetings')
    .insert({ ...input, created_by: auth.userId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('audit_logs').insert({
    actor_id: auth.userId, action: 'meeting.create',
    target_type: 'meeting', target_id: data.id, details: { title: input.title },
  })

  return NextResponse.json({ data }, { status: 201 })
}