// ═══════════════════════════════════════════════════════════════════════════
// SASA CORD ELIGIBILITY CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
//
// ┌─────────────────────────────────────────────────────────────────────┐
// │  THIS IS THE ONLY FILE YOU NEED TO EDIT TO CHANGE REQUIREMENTS      │
// │  File: lib/eligibility.config.ts                                    │
// └─────────────────────────────────────────────────────────────────────┘
//
// HOW TO MODIFY REQUIREMENTS:
//   1. Edit the values in `ELIGIBILITY_REQUIREMENTS` below
//   2. Save the file
//   3. Redeploy to Vercel (or it recalculates automatically on next check)
//
// HOW TO DISABLE A REQUIREMENT:
//   Set the value to 0 (numeric) or false (boolean)
//   Example: minVolunteerHours: 0  ← disables volunteer hours requirement
//
// HOW TO ADD A NEW REQUIREMENT:
//   1. Add the field here in ELIGIBILITY_REQUIREMENTS
//   2. Add the check in lib/eligibility.ts → checkEligibility()
//   3. Add the field to your database if it's a new data point
//
// ═══════════════════════════════════════════════════════════════════════════

export const ELIGIBILITY_REQUIREMENTS = {
  // ─────────────────────────────────────────────────────────────
  // SEMESTERS
  // How many semesters of participation are required?
  // ─────────────────────────────────────────────────────────────
  minSemesters: 2,

  // ─────────────────────────────────────────────────────────────
  // MEETING ATTENDANCE
  // Minimum attendance RATE (0.0 to 1.0) per semester.
  // Example: 0.5 means student must attend 50% of meetings each semester.
  // Set to 0 to disable this requirement.
  // ─────────────────────────────────────────────────────────────
  minAttendanceRate: 0.5,

  // ─────────────────────────────────────────────────────────────
  // EVENTS
  // Minimum total events attended across all semesters.
  // Set to 0 to disable.
  // ─────────────────────────────────────────────────────────────
  minTotalEvents: 3,

  // ─────────────────────────────────────────────────────────────
  // TASKS
  // Minimum total tasks completed across all semesters.
  // Set to 0 to disable.
  // ─────────────────────────────────────────────────────────────
  minTotalTasks: 0,

  // ─────────────────────────────────────────────────────────────
  // VOLUNTEER HOURS
  // Minimum total volunteer hours.
  // Set to 0 to disable.
  // ─────────────────────────────────────────────────────────────
  minVolunteerHours: 0,

  // ─────────────────────────────────────────────────────────────
  // LEADERSHIP
  // Does the student need to have held a leadership position?
  // Set to false to disable.
  // ─────────────────────────────────────────────────────────────
  requireLeadership: false,
} as const

// ─────────────────────────────────────────────────────────────────────────
// ELIGIBILITY STATUS LABELS
// Human-readable labels shown in the UI for each status.
// You can customize these strings — they appear on badges and notifications.
// ─────────────────────────────────────────────────────────────────────────
export const ELIGIBILITY_STATUS_LABELS: Record<string, string> = {
  pending:      'Pending Review',
  eligible:     'Eligible',
  not_eligible: 'Not Eligible',
  approved:     'Approved',
  rejected:     'Rejected',
}

// ─────────────────────────────────────────────────────────────────────────
// STUDENT-FACING NOTIFICATION MESSAGES
// These are what students see on their dashboard.
// Do NOT reveal specific missing requirements here.
// ─────────────────────────────────────────────────────────────────────────
export const STUDENT_NOTIFICATIONS = {
  eligible:     'You are eligible for a SASA graduation cord! SASA will reach out to you soon with next steps.',
  not_eligible: 'Based on your current activity records, you do not yet meet the requirements for a graduation cord. SASA will reach out with more information.',
  approved:     'Congratulations! Your cord eligibility has been approved. SASA will be in touch regarding pickup details.',
  rejected:     'After review, your cord request was not approved at this time. SASA will reach out with more information.',
  pending:      'Your cord request has been received and is currently under review. We will update you soon.',
}

// ─────────────────────────────────────────────────────────────────────────
// ADMIN EMAIL NOTIFICATION SUBJECTS
// These are the email subjects sent ONLY to the SASA org email.
// ─────────────────────────────────────────────────────────────────────────
export const ADMIN_EMAIL_SUBJECTS = {
  newSubmission:   '[SASA Cords] New cord request submitted',
  markedEligible:  '[SASA Cords] Student marked as eligible',
  markedRejected:  '[SASA Cords] Cord request rejected',
  pendingReminder: '[SASA Cords] Pending cord requests need review',
}

// ─────────────────────────────────────────────────────────────────────────
// TYPE EXPORT — used throughout the app for type safety
// ─────────────────────────────────────────────────────────────────────────
export type EligibilityStatus = 'pending' | 'eligible' | 'not_eligible' | 'approved' | 'rejected'
export type SubmissionStatus  = 'pending' | 'under_review' | 'approved' | 'rejected'
