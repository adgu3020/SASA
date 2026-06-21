'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, CheckCircle2, XCircle, Eye, StickyNote } from 'lucide-react'
import { SubmissionBadge, EligibilityBadge } from '@/components/shared/EligibilityBadge'
import { formatDateTime, cn } from '@/lib/utils'
import type { CordSubmission } from '@/types'
import type { SubmissionStatus } from '@/lib/eligibility.config'
import { apiFetch } from '@/lib/api-client'

interface Props {
  initialSubmissions: CordSubmission[]
}

export default function SubmissionsClient({ initialSubmissions }: Props) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all')
  const [selected, setSelected]       = useState<CordSubmission | null>(null)
  const [noteText, setNoteText]       = useState('')
  const [processing, setProcessing]   = useState<string | null>(null)

  const filtered = useMemo(() => {
    return submissions.filter(s => {
      const matchSearch =
        !search ||
        s.submitted_name.toLowerCase().includes(search.toLowerCase()) ||
        s.submitted_email.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || s.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [submissions, search, statusFilter])

  async function updateStatus(id: string, status: SubmissionStatus, notes?: string) {
    setProcessing(id)
    const res = await apiFetch(`/api/submissions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reviewer_notes: notes }),
    })

    if (res.ok) {
      const { data } = await res.json()
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
      if (selected?.id === id) setSelected(s => s ? { ...s, ...data } : null)
    } else {
      alert('Failed to update submission. Please try again.')
    }
    setProcessing(null)
  }

  const FILTERS: { label: string; value: SubmissionStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Under Review', value: 'under_review' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-160px)]">
      {/* Left: list */}
      <div className="flex flex-col gap-4 flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search submissions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-all"
            />
          </div>
          <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value as SubmissionStatus | 'all')}
                className={cn(
                  'px-3 py-1 text-xs rounded-md transition-all font-medium',
                  statusFilter === f.value
                    ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {filtered.length} submission{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Submissions list */}
        <div className="glass-card overflow-hidden flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No submissions found
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(sub => (
                <div
                  key={sub.id}
                  onClick={() => { setSelected(sub); setNoteText(sub.reviewer_notes ?? '') }}
                  className={cn(
                    'flex items-center justify-between px-5 py-4 cursor-pointer transition-colors hover:bg-secondary/40',
                    selected?.id === sub.id && 'bg-amber-400/5 border-l-2 border-l-amber-400'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {sub.submitted_name}
                      </p>
                      {sub.auto_eligible === true && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded-full shrink-0">
                          Auto ✓
                        </span>
                      )}
                      {sub.auto_eligible === false && (
                        <span className="text-[10px] text-red-400 bg-red-400/10 border border-red-400/20 px-1.5 py-0.5 rounded-full shrink-0">
                          Auto ✗
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{sub.submitted_email}</p>
                    <p className="text-xs text-muted-foreground/50 mt-0.5">
                      {formatDateTime(sub.submitted_at)}
                    </p>
                  </div>
                  <SubmissionBadge status={sub.status} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: detail panel */}
      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2 }}
            className="w-80 shrink-0 glass-card p-5 overflow-y-auto flex flex-col gap-5"
          >
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-serif text-lg">{selected.submitted_name}</h3>
                <SubmissionBadge status={selected.status} size="sm" />
              </div>
              <p className="text-sm text-muted-foreground">{selected.submitted_email}</p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                Submitted {formatDateTime(selected.submitted_at)}
              </p>
            </div>

            {/* Info */}
            <div className="space-y-2 text-sm">
              {selected.graduation_year && (
                <Row label="Graduation Year" value={selected.graduation_year} />
              )}
              {selected.comments && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Student Comments</p>
                  <p className="text-sm text-foreground bg-secondary/40 rounded-lg p-3 border border-border">
                    {selected.comments}
                  </p>
                </div>
              )}
            </div>

            {/* Linked member */}
            {selected.member && (
              <div className="bg-secondary/40 rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                  Matched Member Record
                </p>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">{selected.member.full_name}</p>
                  <EligibilityBadge status={selected.member.eligibility_status} size="sm" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <span>{selected.member.total_semesters} sem</span>
                  <span>{selected.member.total_events} events</span>
                  <span>{selected.member.has_leadership ? 'Leader' : 'No leader'}</span>
                </div>
              </div>
            )}

            {!selected.member && (
              <div className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
                ⚠ No matching member record found for this email.
              </div>
            )}

            {/* Reviewer notes */}
            <div>
              <label className="block text-xs text-muted-foreground font-medium mb-1.5">
                Reviewer Notes
              </label>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                rows={3}
                placeholder="Add internal notes…"
                className="w-full px-3 py-2 text-sm rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-amber-400/30 resize-none transition-all"
              />
            </div>

            {/* Actions */}
            {selected.status === 'pending' || selected.status === 'under_review' ? (
              <div className="flex flex-col gap-2 mt-auto">
                {selected.status === 'pending' && (
                  <button
                    onClick={() => updateStatus(selected.id, 'under_review', noteText)}
                    disabled={!!processing}
                    className="w-full py-2 text-sm rounded-lg border border-sky-400/30 text-sky-400 hover:bg-sky-400/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Eye size={14} />
                    Mark Under Review
                  </button>
                )}
                <button
                  onClick={() => updateStatus(selected.id, 'approved', noteText)}
                  disabled={!!processing}
                  className="w-full py-2 text-sm rounded-lg bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                  <CheckCircle2 size={14} />
                  Approve
                </button>
                <button
                  onClick={() => updateStatus(selected.id, 'rejected', noteText)}
                  disabled={!!processing}
                  className="w-full py-2 text-sm rounded-lg bg-red-400/10 border border-red-400/30 text-red-400 hover:bg-red-400/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle size={14} />
                  Reject
                </button>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground bg-secondary/40 rounded-lg p-3 border border-border mt-auto">
                Reviewed {selected.reviewed_at ? formatDateTime(selected.reviewed_at) : ''}
                {selected.reviewer_notes && (
                  <p className="mt-1 text-foreground">{selected.reviewer_notes}</p>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-80 shrink-0 glass-card flex items-center justify-center text-muted-foreground text-sm"
          >
            Select a submission to review
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
