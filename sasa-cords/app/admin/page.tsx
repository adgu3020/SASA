import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, FileCheck, CheckCircle2, Clock, TrendingUp, ArrowRight } from 'lucide-react'
import { EligibilityBadge, SubmissionBadge } from '@/components/shared/EligibilityBadge'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const admin = createAdminClient()

  const [
    { count: totalMembers },
    { count: eligibleMembers },
    { count: pendingSubmissions },
    { count: approvedCords },
    { data: recentSubmissions },
    { data: recentMembers },
  ] = await Promise.all([
    admin.from('members').select('*', { count: 'exact', head: true }).eq('is_active', true),
    admin.from('members').select('*', { count: 'exact', head: true }).eq('eligibility_status', 'eligible'),
    admin.from('cord_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('cord_submissions').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    admin.from('cord_submissions')
      .select('*, member:members(full_name, eligibility_status)')
      .order('submitted_at', { ascending: false })
      .limit(5),
    admin.from('members')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: 'Active Members', value: totalMembers ?? 0, icon: Users, color: 'text-sky-400', bg: 'bg-sky-50 border-sky-200', href: '/admin/members' },
    { label: 'Eligible Members', value: eligibleMembers ?? 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', href: '/admin/members' },
    { label: 'Pending Requests', value: pendingSubmissions ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', href: '/admin/submissions' },
    { label: 'Approved Cords', value: approvedCords ?? 0, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', href: '/admin/submissions' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">SASA Cord Eligibility — Admin Dashboard</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href}
              className="glass-card p-5 border hover:border-amber-200 transition-all hover:shadow-md group"
            >
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-4 ${stat.bg}`}>
                <Icon size={18} className={stat.color} />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              <ArrowRight size={14} className="text-muted-foreground group-hover:text-amber-500 mt-2 transition-colors" />
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg">Recent Submissions</h2>
            <Link href="/admin/submissions" className="text-xs text-amber-600 hover:text-amber-700 transition-colors">View all →</Link>
          </div>
          {recentSubmissions && recentSubmissions.length > 0 ? (
            <div className="space-y-3">
              {recentSubmissions.map((sub: any) => (
                <div key={sub.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{sub.submitted_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{sub.submitted_email}</p>
                  </div>
                  <SubmissionBadge status={sub.status} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No submissions yet</p>
          )}
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg">Recently Added Members</h2>
            <Link href="/admin/members" className="text-xs text-amber-600 hover:text-amber-700 transition-colors">View all →</Link>
          </div>
          {recentMembers && recentMembers.length > 0 ? (
            <div className="space-y-3">
              {recentMembers.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{member.full_name}</p>
                    <p className="text-xs text-muted-foreground">{member.graduation_year}</p>
                  </div>
                  <EligibilityBadge status={member.eligibility_status} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No members yet — <Link href="/admin/members" className="text-amber-600">add one</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}