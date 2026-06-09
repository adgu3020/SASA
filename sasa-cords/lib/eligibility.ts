// ═══════════════════════════════════════════════════════════════════════════
// ELIGIBILITY CALCULATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════
//
// This file reads from lib/eligibility.config.ts and computes whether
// a member meets the requirements. You generally don't need to edit this
// file unless you are adding a BRAND NEW type of requirement.
//
// ═══════════════════════════════════════════════════════════════════════════

import { ELIGIBILITY_REQUIREMENTS, type EligibilityStatus } from './eligibility.config'
import type { Member, MemberSemester } from '@/types'

// ─────────────────────────────────────────────────────────────────────────
// REQUIREMENT CHECK RESULT
// Each requirement returns one of these so the UI can show granular info
// to admins (not to students).
// ─────────────────────────────────────────────────────────────────────────
export interface RequirementCheck {
  key: string
  label: string
  required: string | number | boolean
  actual: string | number | boolean
  met: boolean
  weight?: number // for future weighted scoring
}

export interface EligibilityResult {
  status: EligibilityStatus
  allMet: boolean
  checks: RequirementCheck[]
  score: number       // 0–100 percentage of requirements met
  metCount: number
  totalCount: number
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN ELIGIBILITY FUNCTION
// Pass in a member + their semester records.
// Returns a full breakdown of which requirements are/aren't met.
// ─────────────────────────────────────────────────────────────────────────
export function checkEligibility(
  member: Member,
  semesters: MemberSemester[]
): EligibilityResult {
  const req = ELIGIBILITY_REQUIREMENTS
  const checks: RequirementCheck[] = []

  // ── 1. Semesters ──────────────────────────────────────────────────────
  if (req.minSemesters > 0) {
    const semesterCount = semesters.length
    checks.push({
      key: 'semesters',
      label: 'Semesters of Participation',
      required: req.minSemesters,
      actual: semesterCount,
      met: semesterCount >= req.minSemesters,
    })
  }

  // ── 2. Meeting Attendance Rate ─────────────────────────────────────────
  if (req.minAttendanceRate > 0) {
    // A student meets attendance if their AVERAGE rate across all semesters
    // is >= the minimum, OR every individual semester meets it.
    // Current logic: average across semesters with any meetings recorded.
    const semestersWithMeetings = semesters.filter(s => s.meetings_total > 0)

    if (semestersWithMeetings.length > 0) {
      const avgRate =
        semestersWithMeetings.reduce(
          (sum, s) => sum + s.meetings_attended / s.meetings_total,
          0
        ) / semestersWithMeetings.length

      checks.push({
        key: 'attendance',
        label: 'Meeting Attendance Rate',
        required: `${Math.round(req.minAttendanceRate * 100)}%`,
        actual: `${Math.round(avgRate * 100)}%`,
        met: avgRate >= req.minAttendanceRate,
      })
    } else {
      // No meeting data recorded — treat as not met
      checks.push({
        key: 'attendance',
        label: 'Meeting Attendance Rate',
        required: `${Math.round(req.minAttendanceRate * 100)}%`,
        actual: 'No data',
        met: false,
      })
    }
  }

  // ── 3. Total Events ────────────────────────────────────────────────────
  if (req.minTotalEvents > 0) {
    const totalEvents = semesters.reduce((sum, s) => sum + s.events_attended, 0)
    checks.push({
      key: 'events',
      label: 'Total Events Attended',
      required: req.minTotalEvents,
      actual: totalEvents,
      met: totalEvents >= req.minTotalEvents,
    })
  }

  // ── 4. Total Tasks ─────────────────────────────────────────────────────
  if (req.minTotalTasks > 0) {
    const totalTasks = semesters.reduce((sum, s) => sum + s.tasks_completed, 0)
    checks.push({
      key: 'tasks',
      label: 'Tasks Completed',
      required: req.minTotalTasks,
      actual: totalTasks,
      met: totalTasks >= req.minTotalTasks,
    })
  }

  // ── 5. Volunteer Hours ─────────────────────────────────────────────────
  if (req.minVolunteerHours > 0) {
    const totalHours = semesters.reduce((sum, s) => sum + (s.volunteer_hours || 0), 0)
    checks.push({
      key: 'volunteer',
      label: 'Volunteer Hours',
      required: `${req.minVolunteerHours} hrs`,
      actual: `${totalHours} hrs`,
      met: totalHours >= req.minVolunteerHours,
    })
  }

  // ── 6. Leadership ──────────────────────────────────────────────────────
  if (req.requireLeadership) {
    const hasLeadership = semesters.some(s => s.held_leadership)
    checks.push({
      key: 'leadership',
      label: 'Leadership Position',
      required: 'Yes',
      actual: hasLeadership ? 'Yes' : 'No',
      met: hasLeadership,
    })
  }

  // ── Compute result ─────────────────────────────────────────────────────
  const metCount = checks.filter(c => c.met).length
  const totalCount = checks.length
  const allMet = totalCount > 0 && metCount === totalCount
  const score = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 0

  // If admin has manually overridden, respect that override
  // (handled at the DB layer — this function reflects raw data)
  const status: EligibilityStatus = allMet ? 'eligible' : 'not_eligible'

  return { status, allMet, checks, score, metCount, totalCount }
}

// ─────────────────────────────────────────────────────────────────────────
// QUICK CHECK — just returns boolean, used in webhook handler
// ─────────────────────────────────────────────────────────────────────────
export function isEligible(member: Member, semesters: MemberSemester[]): boolean {
  return checkEligibility(member, semesters).allMet
}
