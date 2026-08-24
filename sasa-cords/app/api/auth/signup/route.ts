import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, fullName } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Explicitly create the profile — don't rely on the trigger
    await admin.from('profiles').upsert({
      id:        userId,
      email:     email.toLowerCase().trim(),
      full_name: fullName || '',
      role:      'student',
    }, { onConflict: 'id' })

    // Link member record if email matches
    const { data: member } = await admin
      .from('members')
      .select('id, profile_id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (member && !member.profile_id) {
      await admin.from('members').update({ profile_id: userId }).eq('id', member.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}