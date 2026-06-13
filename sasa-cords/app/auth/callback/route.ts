import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createServerClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const admin = createAdminClient()

      // Auto-link member record if email matches and not yet linked
      const { data: member } = await admin
        .from('members')
        .select('id, profile_id')
        .eq('email', data.user.email ?? '')
        .maybeSingle()

      if (member && !member.profile_id) {
        await admin
          .from('members')
          .update({ profile_id: data.user.id })
          .eq('id', member.id)
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const dest = profile?.role === 'admin' ? '/admin' : '/student'
      return NextResponse.redirect(`${origin}${dest}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
