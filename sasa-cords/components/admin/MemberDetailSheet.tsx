'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Pencil, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { EligibilityBadge } from '@/components/shared/EligibilityBadge'
import { checkEligibility } from '@/lib/eligibility'
import { formatDate } from '@/lib/utils'
import type { MemberWithSemesters } from '@/types'

interface Props {
  member: MemberWithSemesters | null
  onClose: () => void
  onEdit: (m: MemberWithSemesters) => void
}

export default function MemberDetailSheet({ member, onClose, onEdit }: Props) {
  if (!member) return null

  const eligibilityResult = checkEligibility(member, member.member_semesters ?? [])

  return (
    <AnimatePresence>
      {member && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md glass-card border-l border-border z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card/95 backdrop-blur-sm">
              <h2 className="font-serif text-xl">Member Details</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(member)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-400 hover:bg-sky-400/10 transition-all"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Identity */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                  <span className="font-serif text-lg text-amber-400">
                    {member.full_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{member.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  <p className="text-sm text-muted-foreground">Class of {member.graduation_year}</p>
                  {member.major && <p className="text-sm text-muted-foreground">{member.major}</p>}
                </div>
              </div>

              {/* Eligibility status */}
              <div className="bg-secondary/40 rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-muted-foreground">Eligibility Status</p>
                  <EligibilityBadge status={member.eligibility_status} />
                </div>

                {member.admin_override && (
                  <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 rounded-lg px-3 py-2 mb-3">
                    <AlertCircle size={12} />
                    Admin override active
                  </div>
                )}

                {/* Requirements breakdown */}
                <div className="space-y-2">
                  {eligibilityResult.checks.map(check => (
                    <div key={check.key} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {check.met
                          ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                          : <XCircle size={14} className="text-red-400 shrink-0" />
                        }
                        <span className="text-muted-foreground">{check.label}</span>
                      </div>
                      <span className={check.met ? 'text-emerald-400' : 'text-red-400'}>
                        {String(check.actual)} / {String(check.required)}
                      </span>
                    </div>
                  ))}

                  {eligibilityResult.checks.length === 0 && (
                    <p className="text-xs text-muted-foreground">No requirements configured yet.</p>
                  )}
                </div>

                {/* Score */}
                {eligibilityResult.totalCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Requirements met</span>
                      <span>{eligibilityResult.metCount} / {eligibilityResult.totalCount}</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all"
                        style={{ width: `${eligibilityResult.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Activity stats */}
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3">Activity Summary</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Semesters', value: member.total_semesters },
                    { label: 'Events', value: member.total_events },
                    { label: 'Tasks', value: member.total_tasks },
                    { label: 'Vol. Hours', value: member.volunteer_hours },
                  ].map(stat => (
                    <div key={stat.label} className="bg-secondary/40 rounded-lg p-3 border border-border">
                      <p className="text-xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Semester history */}
              {(member.member_semesters ?? []).length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-3">Semester History</p>
                  <div className="space-y-2">
                    {member.member_semesters.map(sem => (
                      <div key={sem.id} className="bg-secondary/40 rounded-lg p-3 border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-foreground">
                            {sem.semester?.name ?? sem.semester_id}
                          </p>
                          {sem.held_leadership && (
                            <span className="text-xs text-amber-400">{sem.leadership_role ?? 'Leader'}</span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <span>Mtgs: {sem.meetings_attended}/{sem.meetings_total}</span>
                          <span>Events: {sem.events_attended}</span>
                          <span>Tasks: {sem.tasks_completed}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin notes */}
              {member.admin_notes && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Admin Notes</p>
                  <p className="text-sm text-muted-foreground bg-secondary/40 rounded-lg p-3 border border-border">
                    {member.admin_notes}
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Added {formatDate(member.created_at)} · Updated {formatDate(member.updated_at)}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
