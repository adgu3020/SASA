import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { EligibilityStatus, SubmissionStatus } from './eligibility.config'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Date helpers ──────────────────────────────────────────────────────────
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ── Status color helpers ──────────────────────────────────────────────────
export function eligibilityStatusColor(status: EligibilityStatus): string {
  const map: Record<EligibilityStatus, string> = {
    pending:      'text-amber-400 bg-amber-400/10 border-amber-400/20',
    eligible:     'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    not_eligible: 'text-red-400 bg-red-400/10 border-red-400/20',
    approved:     'text-sky-400 bg-sky-400/10 border-sky-400/20',
    rejected:     'text-slate-400 bg-slate-400/10 border-slate-400/20',
  }
  return map[status] ?? map.pending
}

export function submissionStatusColor(status: SubmissionStatus): string {
  const map: Record<SubmissionStatus, string> = {
    pending:      'text-amber-400 bg-amber-400/10 border-amber-400/20',
    under_review: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
    approved:     'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    rejected:     'text-slate-400 bg-slate-400/10 border-slate-400/20',
  }
  return map[status] ?? map.pending
}

// ── Misc ──────────────────────────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateWebhookSecret(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
