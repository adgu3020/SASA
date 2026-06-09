import { cn, eligibilityStatusColor, submissionStatusColor } from '@/lib/utils'
import { ELIGIBILITY_STATUS_LABELS } from '@/lib/eligibility.config'
import type { EligibilityStatus, SubmissionStatus } from '@/lib/eligibility.config'
import { CheckCircle2, XCircle, Clock, ThumbsUp, ThumbsDown } from 'lucide-react'

const ICONS: Record<EligibilityStatus, React.ElementType> = {
  pending:      Clock,
  eligible:     CheckCircle2,
  not_eligible: XCircle,
  approved:     ThumbsUp,
  rejected:     ThumbsDown,
}

interface EligibilityBadgeProps {
  status: EligibilityStatus
  size?: 'sm' | 'md'
}

export function EligibilityBadge({ status, size = 'md' }: EligibilityBadgeProps) {
  const Icon = ICONS[status] ?? Clock
  return (
    <span className={cn(
      'status-badge',
      eligibilityStatusColor(status),
      size === 'sm' && 'text-[11px] px-2 py-0.5'
    )}>
      <Icon size={size === 'sm' ? 10 : 12} />
      {ELIGIBILITY_STATUS_LABELS[status] ?? status}
    </span>
  )
}

interface SubmissionBadgeProps {
  status: SubmissionStatus
  size?: 'sm' | 'md'
}

const SUBMISSION_LABELS: Record<SubmissionStatus, string> = {
  pending:      'Pending',
  under_review: 'Under Review',
  approved:     'Approved',
  rejected:     'Rejected',
}

const SUBMISSION_ICONS: Record<SubmissionStatus, React.ElementType> = {
  pending:      Clock,
  under_review: Clock,
  approved:     ThumbsUp,
  rejected:     ThumbsDown,
}

export function SubmissionBadge({ status, size = 'md' }: SubmissionBadgeProps) {
  const Icon = SUBMISSION_ICONS[status] ?? Clock
  return (
    <span className={cn(
      'status-badge',
      submissionStatusColor(status),
      size === 'sm' && 'text-[11px] px-2 py-0.5'
    )}>
      <Icon size={size === 'sm' ? 10 : 12} />
      {SUBMISSION_LABELS[status] ?? status}
    </span>
  )
}
