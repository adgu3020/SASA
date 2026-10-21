import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/supabase/server'
import { ensureStudentMember } from '@/lib/student-link'
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try { return NextResponse.json({ data: { memberId: await ensureStudentMember(auth.userId) } }) }
  catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 409 }) }
}
