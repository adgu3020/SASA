export const ELIGIBILITY_REQUIREMENTS = {
  minSemesters: 0,
  minAttendanceRate: 0.75,
  minTotalEvents: 2,
  minTotalTasks: 0,
  minVolunteerHours: 0,
  requireLeadership: false,
} as const

export const ELIGIBILITY_STATUS_LABELS: Record<string, string> = {
  pending:      'Pending Review',
  eligible:     'Eligible',
  not_eligible: 'Not Eligible',
  approved:     'Approved',
  rejected:     'Rejected',
}

export const STUDENT_NOTIFICATIONS = {
  eligible:     'You are eligible for a SASA graduation cord! SASA will reach out to you soon with next steps.',
  not_eligible: 'Based on your current activity records, you do not yet meet the requirements for a graduation cord. SASA will reach out with more information.',
  approved:     'Congratulations! Your cord eligibility has been approved. SASA will be in touch regarding pickup details.',
  rejected:     'After review, your cord request was not approved at this time. SASA will reach out with more information.',
  pending:      'Your cord request has been received and is currently under review. We will update you soon.',
}

export const ADMIN_EMAIL_SUBJECTS = {
  newSubmission:   '[SASA Cords] New cord request submitted',
  markedEligible:  '[SASA Cords] Student marked as eligible',
  markedRejected:  '[SASA Cords] Cord request rejected',
  pendingReminder: '[SASA Cords] Pending cord requests need review',
}

export type EligibilityStatus = 'pending' | 'eligible' | 'not_eligible' | 'approved' | 'rejected'
export type SubmissionStatus  = 'pending' | 'under_review' | 'approved' | 'rejected'