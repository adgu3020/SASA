import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json()

    // Validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Create the auth user - profile is auto-created by trigger
    const supabase = await createServerClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Auto-link member record if email matches and not yet linked
    const { data: member } = await admin
      .from('members')
      .select('id, profile_id')
      .eq('email', email)
      .maybeSingle()

    if (member && !member.profile_id) {
      await admin
        .from('members')
        .update({ profile_id: authData.user.id })
        .eq('id', member.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
