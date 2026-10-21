import { createServerClient as _createServerClient } from '@supabase/ssr'
import { createClient as _createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

// For Server Components and Layouts
export async function createServerClient() {
  const cookieStore = await cookies()

  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as any)
            )
          } catch {}
        },
      },
    }
  )
}

// Admin client — bypasses RLS, use only server-side
export function createAdminClient() {
  return _createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Verify the Bearer token sent from client components
// Returns { userId, role } if valid, null if not
export async function verifyAuth(request: NextRequest): Promise<{ userId: string; role: string } | null> {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  if (!token) return null

  const admin = createAdminClient()
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return null

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return { userId: user.id, role: profile?.role ?? 'student' }
}
// Every server-rendered admin page checks identity before service-role reads.
export async function requireAdminPage() {
  const client = await createServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile, error } = await client.from('profiles').select('role').eq('id', user.id).single()
  if (error || profile?.role !== 'admin') redirect('/student')
  return user
}
