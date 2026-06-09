import { createServerClient as _createServerClient } from '@supabase/ssr'
import { createClient as _createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// ── Server Component client (respects RLS, user session) ──────────────────
export async function createServerClient() {
  const cookieStore = await cookies()

  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookies can't be set here.
            // Middleware handles cookie refresh.
          }
        },
      },
    }
  )
}

// ── Admin client (bypasses RLS — use ONLY in server-side API routes) ──────
// Never expose the service role key to the browser.
export function createAdminClient() {
  return _createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
