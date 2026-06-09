// ═══════════════════════════════════════════════════════════════════════════
// SASA CORDS — Global TypeScript Types
// ═══════════════════════════════════════════════════════════════════════════

import type { EligibilityStatus, SubmissionStatus } from '@/lib/eligibility.config'

// ─────────────────────────────────────────────────────────────────────────
// AUTH / USER
// ─────────────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'student'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────────────────────────────────
// SEMESTERS
// ─────────────────────────────────────────────────────────────────────────
export type SemesterTerm = 'Fall' | 'Spring' | 'Summer'

export interface Semester {
  id: string
  name: string
  term: SemesterTerm
  year: number
  is_active: boolean
  created_at: string
}

// ─────────────────────────────────────────────────────────────────────────
// MEMBERS
// ─────────────────────────────────────────────────────────────────────────
export interface Member {
  id: string
  profile_id: string | null
  full_name: string
  email: string
  graduation_year: number
  major: string | null
  is_active: boolean

  // Aggregated stats (maintained by DB trigger)
  total_semesters: number
  total_events: number
  total_tasks: number
  volunteer_hours: number
  has_leadership: boolean

  // Eligibility
  eligibility_status: EligibilityStatus
  admin_override: boolean
  admin_notes: string | null

  created_at: string
  updated_at: string
}

export interface MemberWithSemesters extends Member {
  member_semesters: MemberSemester[]
}

// ─────────────────────────────────────────────────────────────────────────
// MEMBER SEMESTERS (per-semester activity)
// ─────────────────────────────────────────────────────────────────────────
export interface MemberSemester {
  id: string
  member_id: string
  semester_id: string
  meetings_attended: number
  meetings_total: number
  events_attended: number
  tasks_completed: number
  volunteer_hours: number
  held_leadership: boolean
  leadership_role: string | null
  notes: string | null
  created_at: string
  updated_at: string

  // Joined
  semester?: Semester
}

// ─────────────────────────────────────────────────────────────────────────
// CORD SUBMISSIONS
// ─────────────────────────────────────────────────────────────────────────
export interface CordSubmission {
  id: string
  member_id: string | null
  submitted_name: string
  submitted_email: string
  graduation_year: number | null
  comments: string | null
  form_response_id: string | null
  status: SubmissionStatus
  reviewed_by: string | null
  reviewed_at: string | null
  reviewer_notes: string | null
  auto_eligible: boolean | null
  submitted_at: string
  updated_at: string

  // Joined
  member?: Member
  reviewer?: Profile
}

// ─────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────
export type NotificationType = 'eligible' | 'not_eligible' | 'approved' | 'rejected' | 'info'

export interface Notification {
  id: string
  profile_id: string
  member_id: string | null
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  created_at: string
}

// ─────────────────────────────────────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string
  actor_id: string | null
  action: string
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown> | null
  created_at: string

  // Joined
  actor?: Profile
}

// ─────────────────────────────────────────────────────────────────────────
// API RESPONSE HELPERS
// ─────────────────────────────────────────────────────────────────────────
export interface ApiSuccess<T = unknown> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: string
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

// ─────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────
export interface AnalyticsStats {
  totalMembers: number
  eligibleMembers: number
  pendingSubmissions: number
  approvedCords: number
  eligibilityRate: number
  submissionsThisMonth: number
}
