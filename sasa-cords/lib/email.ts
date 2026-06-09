import { Resend } from 'resend'
import { ADMIN_EMAIL_SUBJECTS } from './eligibility.config'

const resend = new Resend(process.env.RESEND_API_KEY)
const SASA_EMAIL = process.env.SASA_ORG_EMAIL!
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@sasa-cords.com'

// ─────────────────────────────────────────────────────────────────────────
// SEND ADMIN EMAIL — only sends to the SASA org email
// ─────────────────────────────────────────────────────────────────────────
async function sendAdminEmail(subject: string, html: string): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: SASA_EMAIL,
      subject,
      html,
    })
  } catch (err) {
    // Don't throw — email failures shouldn't break the main flow
    console.error('[Email] Failed to send admin email:', err)
  }
}

// ─────────────────────────────────────────────────────────────────────────
// EMAIL TEMPLATES
// ─────────────────────────────────────────────────────────────────────────
function baseTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #0a0b1e; color: #e2e8f0; margin: 0; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #111827; border: 1px solid rgba(251,191,36,0.15); border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #111827, #1e1b4b); padding: 32px; border-bottom: 1px solid rgba(251,191,36,0.15); }
        .header h1 { margin: 0; font-size: 20px; color: #fbbf24; font-weight: 700; }
        .header p { margin: 4px 0 0; color: #94a3b8; font-size: 14px; }
        .body { padding: 32px; }
        .body p { color: #cbd5e1; line-height: 1.6; margin: 0 0 16px; }
        .tag { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .tag-amber { background: rgba(251,191,36,0.1); color: #fbbf24; border: 1px solid rgba(251,191,36,0.2); }
        .tag-green { background: rgba(52,211,153,0.1); color: #34d399; border: 1px solid rgba(52,211,153,0.2); }
        .tag-red { background: rgba(248,113,113,0.1); color: #f87171; border: 1px solid rgba(248,113,113,0.2); }
        .divider { border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 24px 0; }
        .footer { padding: 20px 32px; background: #0d1117; border-top: 1px solid rgba(255,255,255,0.05); }
        .footer p { color: #475569; font-size: 12px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 SASA Cord Eligibility</h1>
          <p>South Asian Student Association — Admin Notification</p>
        </div>
        <div class="body">${content}</div>
        <div class="footer">
          <p>This email was sent automatically by the SASA Cords platform. Do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// ── New submission received ───────────────────────────────────────────────
export async function emailNewSubmission(opts: {
  studentName: string
  studentEmail: string
  graduationYear: number | null
  autoEligible: boolean | null
  comments?: string | null
}): Promise<void> {
  const statusTag = opts.autoEligible
    ? `<span class="tag tag-green">Auto: Eligible</span>`
    : opts.autoEligible === false
    ? `<span class="tag tag-red">Auto: Not Eligible</span>`
    : `<span class="tag tag-amber">Auto: Unknown</span>`

  const html = baseTemplate(`
    <p><strong>A new cord eligibility request has been submitted.</strong></p>
    <hr class="divider" />
    <p><strong>Name:</strong> ${opts.studentName}</p>
    <p><strong>Email:</strong> ${opts.studentEmail}</p>
    <p><strong>Graduation Year:</strong> ${opts.graduationYear ?? 'Not specified'}</p>
    <p><strong>Auto-Eligibility:</strong> ${statusTag}</p>
    ${opts.comments ? `<p><strong>Student Comments:</strong> ${opts.comments}</p>` : ''}
    <hr class="divider" />
    <p>Log into the SASA admin dashboard to review this request.</p>
  `)

  await sendAdminEmail(ADMIN_EMAIL_SUBJECTS.newSubmission, html)
}

// ── Student marked eligible ───────────────────────────────────────────────
export async function emailStudentMarkedEligible(opts: {
  studentName: string
  studentEmail: string
  adminName?: string
}): Promise<void> {
  const html = baseTemplate(`
    <p><strong>${opts.studentName}</strong> has been marked as <span class="tag tag-green">Eligible</span> for a graduation cord.</p>
    <hr class="divider" />
    <p><strong>Student Email:</strong> ${opts.studentEmail}</p>
    ${opts.adminName ? `<p><strong>Marked by:</strong> ${opts.adminName}</p>` : ''}
    <hr class="divider" />
    <p>A notification has been sent to the student's dashboard.</p>
  `)

  await sendAdminEmail(ADMIN_EMAIL_SUBJECTS.markedEligible, html)
}

// ── Submission rejected ───────────────────────────────────────────────────
export async function emailSubmissionRejected(opts: {
  studentName: string
  studentEmail: string
  notes?: string | null
}): Promise<void> {
  const html = baseTemplate(`
    <p>The cord request from <strong>${opts.studentName}</strong> has been <span class="tag tag-red">Rejected</span>.</p>
    <hr class="divider" />
    <p><strong>Student Email:</strong> ${opts.studentEmail}</p>
    ${opts.notes ? `<p><strong>Admin Notes:</strong> ${opts.notes}</p>` : ''}
  `)

  await sendAdminEmail(ADMIN_EMAIL_SUBJECTS.markedRejected, html)
}
