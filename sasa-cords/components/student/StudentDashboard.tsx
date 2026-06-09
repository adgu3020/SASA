'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCircle2, XCircle, Clock, GraduationCap, Calendar, Award } from 'lucide-react'
import { EligibilityBadge } from '@/components/shared/EligibilityBadge'
import { formatDate, timeAgo } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Member, MemberWithSemesters, Notification, CordSubmission } from '@/types'

interface Props {
  profile: Profile | null
  member: MemberWithSemesters | null
  notifications: Notification[]
  submission: CordSubmission | null
}

export default function StudentDashboard({ profile, member, notifications, submission }: Props) {
  const [notifs, setNotifs] = useState(notifications)
  const supabase = createClient()

  const unreadCount = notifs.filter(n => !n.is_read).length

  async function markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('profile_id', profile?.id ?? '')
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const notifIcon: Record<string, React.ElementType> = {
    eligible:     CheckCircle2,
    not_eligible: XCircle,
    approved:     Award,
    rejected:     XCircle,
    info:         Bell,
  }

  const notifColor: Record<string, string> = {
    eligible:     'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    not_eligible: 'text-red-400 bg-red-400/10 border-red-400/20',
    approved:     'text-sky-400 bg-sky-400/10 border-sky-400/20',
    rejected:     'text-slate-400 bg-slate-400/10 border-slate-400/20',
    info:         'text-amber-400 bg-amber-400/10 border-amber-400/20',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="font-serif text-3xl text-foreground">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          South Asian Student Association — Student Portal
        </p>
      </div>

      {/* No member record linked */}
      {!member && (
        <div className="glass-card p-6 border-amber-400/20">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap size={20} className="text-amber-400" />
            <h2 className="font-serif text-lg">Account Not Yet Linked</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Your account hasn't been linked to a member record yet. Please contact your SASA board to have your profile connected.
          </p>
        </div>
      )}

      {/* Member status card */}
      {member && (
        <div className="glass-card p-6 glow-saffron">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-serif text-xl">{member.full_name}</h2>
              <p className="text-sm text-muted-foreground">Class of {member.graduation_year}</p>
              {member.major && <p className="text-sm text-muted-foreground">{member.major}</p>}
            </div>
            <EligibilityBadge status={member.eligibility_status} />
          </div>

          {/* Activity summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Semesters',    value: member.total_semesters, icon: Calendar },
              { label: 'Events',       value: member.total_events,    icon: GraduationCap },
              { label: 'Tasks',        value: member.total_tasks,     icon: CheckCircle2 },
              { label: 'Vol. Hours',   value: member.volunteer_hours, icon: Award },
            ].map(stat => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="bg-secondary/40 rounded-lg p-3 border border-border">
                  <Icon size={14} className="text-amber-400 mb-2" />
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              )
            })}
          </div>

          {/* Semester breakdown */}
          {(member.member_semesters ?? []).length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Semester History
              </p>
              <div className="space-y-2">
                {member.member_semesters.map(sem => (
                  <div key={sem.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{sem.semester?.name ?? sem.semester_id}</span>
                    <div className="flex items-center gap-3 text-muted-foreground text-xs">
                      <span>{sem.meetings_attended}/{sem.meetings_total} meetings</span>
                      <span>{sem.events_attended} events</span>
                      {sem.held_leadership && (
                        <span className="text-amber-400">{sem.leadership_role ?? 'Leader'}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active submission status */}
      {submission && (
        <div className="glass-card p-5 border border-sky-400/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Cord Request Status
          </p>
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-sky-400" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Request submitted {formatDate(submission.submitted_at)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Status: <span className="capitalize text-sky-400">{submission.status.replace('_', ' ')}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl">Notifications</h2>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold bg-amber-400/20 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-muted-foreground hover:text-amber-400 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {notifs.length === 0 ? (
          <div className="glass-card p-8 flex flex-col items-center gap-3 text-center">
            <Bell size={24} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {notifs.map((notif, i) => {
                const Icon = notifIcon[notif.type] ?? Bell
                const colorClass = notifColor[notif.type] ?? notifColor.info
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => !notif.is_read && markRead(notif.id)}
                    className={`glass-card p-4 cursor-pointer transition-all ${
                      notif.is_read ? 'opacity-60' : 'hover:border-amber-400/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-1.5 rounded-lg border ${colorClass}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{notif.title}</p>
                          {!notif.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground/50 mt-1.5">
                          {timeAgo(notif.created_at)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
