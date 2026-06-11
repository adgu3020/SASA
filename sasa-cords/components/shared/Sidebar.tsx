'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  FileCheck,
  BarChart3,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, getInitials } from '@/lib/utils'
import type { Profile } from '@/types'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const ADMIN_NAV: NavItem[] = [
  { href: '/admin',             label: 'Overview',    icon: LayoutDashboard },
  { href: '/admin/members',     label: 'Members',     icon: Users },
  { href: '/admin/submissions', label: 'Submissions', icon: FileCheck },
  { href: '/admin/analytics',   label: 'Analytics',   icon: BarChart3 },
]

const STUDENT_NAV: NavItem[] = [
  { href: '/student', label: 'My Dashboard', icon: GraduationCap },
]

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)

  const isAdmin = profile.role === 'admin'
  const navItems = isAdmin ? ADMIN_NAV : STUDENT_NAV

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col h-full border-r border-border bg-card/60 backdrop-blur-sm shrink-0 overflow-hidden"
    >
      {/* Header — Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-border',
        collapsed && 'justify-center px-2'
      )}>
        <div className="w-9 h-9 rounded-full border-2 border-amber-200 flex items-center justify-center shrink-0 overflow-hidden bg-white">
          <img
            src="/images/SASALogo.svg"
            alt="SASA"
            style={{
              width: '60px',
              height: '60px',
              marginTop: '7.4px',
              marginLeft: '-0px',
              maxWidth: 'none',
            }}
          />
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              <p className="font-serif text-sm font-semibold text-foreground leading-tight">
                SASA Cords
              </p>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'Admin Portal' : 'Student Portal'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = item.href === '/admin' || item.href === '/student'
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'sidebar-item',
                isActive && 'active',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </nav>

      {/* Footer — User + Sign Out */}
      <div className="border-t border-border p-2 space-y-1">
        <div className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg',
          collapsed && 'justify-center px-2'
        )}>
          <div className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0">
            <span className="text-amber-400 text-xs font-semibold">
              {getInitials(profile.full_name ?? profile.email)}
            </span>
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0"
              >
                <p className="text-xs font-medium text-foreground truncate">
                  {profile.full_name ?? profile.email}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {profile.role}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleSignOut}
          className={cn(
            'sidebar-item w-full text-red-400/70 hover:text-red-400 hover:bg-red-400/10',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut size={16} className="shrink-0" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Sign out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-[72px] -right-3 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-amber-400/40 transition-colors z-10 shadow-lg"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  )
}
