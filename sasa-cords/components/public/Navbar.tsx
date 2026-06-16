'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogIn, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/',           label: 'Home' },
  { href: '/about',      label: 'About' },
  { href: '/board',      label: 'Board' },
  { href: '/meetings',   label: 'Meetings' },
  { href: '/newsletter', label: 'Newsletter' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [role, setRole]       = useState<string | null>(null)
  const [loaded, setLoaded]   = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        setRole(profile?.role ?? 'student')
      }
      setLoaded(true)
    })
  }, [])

  const dashboardHref = role === 'admin' ? '/admin' : '/student'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-full border-2 border-amber-200 overflow-hidden bg-white flex items-center justify-center">
              <img
                src="/images/SASALogo.svg"
                alt="SASA"
                style={{ width: '55px', height: '55px', marginTop: '7px', maxWidth: 'none' }}
              />
            </div>
            <span className="font-serif text-lg font-semibold text-foreground">SASA</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-amber-700 bg-amber-50'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            {loaded && role ? (
              <Link
                href={dashboardHref}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-amber-400 text-white text-sm font-semibold hover:bg-amber-500 transition-all"
              >
                <LayoutDashboard size={14} />
                Dashboard
              </Link>
            ) : loaded ? (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-amber-300 text-amber-700 text-sm font-semibold hover:bg-amber-50 transition-all"
              >
                <LogIn size={14} />
                Login
              </Link>
            ) : null}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border overflow-hidden bg-white"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'text-amber-700 bg-amber-50'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-border">
                {loaded && role ? (
                  <Link
                    href={dashboardHref}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-400 text-white text-sm font-semibold"
                  >
                    <LayoutDashboard size={14} />
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-300 text-amber-700 text-sm font-semibold"
                  >
                    <LogIn size={14} />
                    Login
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}