// Root page — middleware handles all redirects to /login, /admin, /student
// This page never actually renders but is required by Next.js App Router
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/login')
}
