'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, CheckCircle2, XCircle, Clock, GraduationCap,
  Calendar, Award, Users, Check, X, Loader2, Send
} from 'lucide-react'
import { EligibilityBadge } from '@/components/shared/EligibilityBadge'
import { checkEligibility } from '@/lib/eligibility'
import { formatDate, timeAgo, cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api-client'

interface Props {
  data: {
    profile: any
    member: any
    meetings: any[]
    attendedMeetingIds: string[]
    submissions: any[]
    notifications: any[]
  }
  onDataRefresh: () => void
}

export default function StudentDashboard({ data, onDataRefresh }: Props) {
  const { profile, member, meetings, attendedMeetingIds, submissions, notifications } = data

  const [notifs, setNotifs]         = useState(notifications)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    full_name:       member?.full_name ?? profile?.full_name ?? '',
    email:           profile?.email ?? '',
    graduation_year: member?.graduation_year?.toString() ?? '',
    comments:        '',
  })

  const unreadCount = notifs.filter((n: any) => !n.is_read).length
  const activeSubmission = submissions.find((s: any) =>
    ['pending', 'under_review', 'approved'].includes(s.status)
  )

  // Eligibility calculation
  const eligibilityResult = member
    ? checkEligibility(member, member.member_semesters ?? [])
    : null

  // Meetings attended count
  const meetingsAttended = meetings.filter(m => attendedMeetingIds.includes(m.id)).length

  async function markRead(id: string) {
    await apiFetch('/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ id }),
    })
    setNotifs((prev: any[]) => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    await apiFetch('/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ all: true }),
    })
    setNotifs((prev: any[]) => prev.map(n => ({ ...n, is_read: true })))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    setSubmitting(true)

    const res = await apiFetch('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(formData),
    })
    const json = await res.json()

    if (!res.ok) {
      setSubmitError(json.error ?? 'Something went wrong')
      setSubmitting(false)
      return
    }

    setSubmitSuccess(true)
    setSubmitting(false)
    onDataRefresh()
  }

  const notifIcon: Record<string, React.ElementType> = {
    eligible: CheckCircle2, not_eligible: XCircle,
    approved: Award, rejected: XCircle, info: Bell,
  }
  const notifColor: Record<string, string> = {
    eligible:     'text-emerald-600 bg-emerald-50 border-emerald-200',
    not_eligible: 'text-red-500 bg-red-50 border-red-200',
    approved:     'text-sky-600 bg-sky-50 border-sky-200',
    rejected:     'text-slate-500 bg-slate-50 border-slate-200',
    info:         'text-amber-600 bg-amber-50 border-amber-200',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl text-foreground">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          South Asian Student Association — Student Portal
        </p>
      </div>

      {/* No member record */}
      {!member && (
        <div className="glass-card p-6 border-l-4 border-l-amber-400">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap size={20} className="text-amber-500" />
            <h2 className="font-semibold text-foreground">Account Not Yet Linked</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Your account hasn't been linked to a member record yet. Contact your SASA board to have your profile connected.
          </p>
        </div>
      )}

      {member && (
        <>
          {/* ── Eligibility Status ──────────────────────────────── */}
          <div className="glass-card p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-serif text-xl text-foreground">Cord Eligibility</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {member.full_name} · Class of {member.graduation_year}
                </p>
              </div>
              <EligibilityBadge status={member.eligibility_status} />
            </div>

            {/* Requirements breakdown */}
            {eligibilityResult && eligibilityResult.checks.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Requirements
                </p>
                {eligibilityResult.checks.map(check => (
                  <div key={check.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                        check.met ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
                      )}>
                        {check.met
                          ? <Check size={11} strokeWidth={3} />
                          : <X size={11} strokeWidth={3} />
                        }
                      </div>
                      <span className="text-sm text-foreground">{check.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={check.met ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
                        {String(check.actual)}
                      </span>
                      <span className="text-muted-foreground">/ {String(check.required)}</span>
                    </div>
                  </div>
                ))}

                {/* Progress bar */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>{eligibilityResult.metCount} of {eligibilityResult.totalCount} requirements met</span>
                    <span>{eligibilityResult.score}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        eligibilityResult.allMet ? 'bg-emerald-500' : 'bg-amber-400'
                      )}
                      style={{ width: `${eligibilityResult.score}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Activity Stats ───────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Meetings Attended', value: `${meetingsAttended}/${meetings.length}`, icon: Calendar },
              { label: 'Events Attended',   value: member.total_events,    icon: Award },
              { label: 'Tasks Completed',   value: member.total_tasks,     icon: CheckCircle2 },
              { label: 'Vol. Hours',        value: member.volunteer_hours, icon: Users },
            ].map(stat => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="glass-card p-4">
                  <Icon size={16} className="text-amber-500 mb-2" />
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              )
            })}
          </div>

          {/* ── Attendance History ───────────────────────────────── */}
          {meetings.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="font-serif text-xl text-foreground mb-4">Meeting History</h2>
              <div className="divide-y divide-border">
                {meetings.map(meeting => {
                  const attended = attendedMeetingIds.includes(meeting.id)
                  return (
                    <div key={meeting.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                          attended ? 'bg-emerald-100' : 'bg-red-50'
                        )}>
                          {attended
                            ? <Check size={13} className="text-emerald-600" strokeWidth={3} />
                            : <X size={13} className="text-red-400" strokeWidth={3} />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{meeting.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(meeting.date + 'T00:00:00').toLocaleDateString('en-US', {
                              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                            })}
                            {meeting.semester && ` · ${meeting.semester.name}`}
                          </p>
                        </div>
                      </div>
                      <span className={cn(
                        'text-xs font-semibold shrink-0 ml-3',
                        attended ? 'text-emerald-600' : 'text-red-400'
                      )}>
                        {attended ? 'Attended' : 'Missed'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Cord Request ─────────────────────────────────────────── */}
      <div className="glass-card p-6">
        <h2 className="font-serif text-xl text-foreground mb-1">Graduation Cord Request</h2>

        {/* Already submitted */}
        {activeSubmission ? (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              You have already submitted a cord request.
            </p>
            <div className={cn(
              'flex items-center gap-3 p-4 rounded-xl border',
              activeSubmission.status === 'approved'
                ? 'bg-emerald-50 border-emerald-200'
                : activeSubmission.status === 'rejected'
                ? 'bg-red-50 border-red-200'
                : 'bg-amber-50 border-amber-200'
            )}>
              <Clock size={18} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Submitted {formatDate(activeSubmission.submitted_at)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                  Status: <span className="font-medium">
                    {activeSubmission.status.replace('_', ' ')}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ) : submitSuccess ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <p className="text-sm font-medium text-emerald-800">
              Your request has been submitted! The SASA board will review it soon.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-5">
              Believe you've met the requirements? Submit a request for the board to review.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Full Name <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={e => setFormData(f => ({ ...f, full_name: e.target.value }))}
                    required
                    className="input-field"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Email <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                    required
                    className="input-field"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Graduation Year
                </label>
                <input
                  type="number"
                  value={formData.graduation_year}
                  onChange={e => setFormData(f => ({ ...f, graduation_year: e.target.value }))}
                  min={2024}
                  max={2035}
                  className="input-field"
                  placeholder="2027"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Additional Comments (optional)
                </label>
                <textarea
                  value={formData.comments}
                  onChange={e => setFormData(f => ({ ...f, comments: e.target.value }))}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Anything you'd like the board to know…"
                />
              </div>

              {submitError && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-400 text-white font-semibold text-sm hover:bg-amber-500 disabled:opacity-60 transition-all"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {submitting ? 'Submitting…' : 'Submit Cord Request'}
              </button>
            </form>
          </>
        )}
      </div>

      {/* ── Notifications ─────────────────────────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl text-foreground">Notifications</h2>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-muted-foreground hover:text-amber-600 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {notifs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Bell size={24} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifs.map((notif: any, i: number) => {
              const Icon = notifIcon[notif.type] ?? Bell
              const colorClass = notifColor[notif.type] ?? notifColor.info
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => !notif.is_read && markRead(notif.id)}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all',
                    notif.is_read ? 'opacity-60 bg-secondary/20 border-border' : 'bg-white border-border hover:border-amber-200 hover:shadow-sm'
                  )}
                >
                  <div className={cn('mt-0.5 p-1.5 rounded-lg border shrink-0', colorClass)}>
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
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}