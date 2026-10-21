# SASA implementation review

## Result and limits

The existing Next.js application has been extended. Its navigation, pages, visual styling, current officers, and attendance/member data model remain in place. No replacement application or second student-profile system was created.

The source changes and six migrations are implemented. Local validation passed: eight automated input/API test groups, 43 PostgreSQL checks, seven browser component checks, TypeScript, lint with five pre-existing image warnings, and a production build on Next.js 14.2.35. The database checks ran both an existing-data fixture and a clean database.

No live Supabase schema or production data was queried or changed. The uploaded SQL files are the schema reference, not proof of the current production configuration. Real Supabase Auth delivery, cookie renewal, hosted Storage, and third-party presentation access need the staging checks in `DEPLOYMENT.md`. Browser component tests mock Auth session recovery and backend responses; they are not a live end-to-end Supabase test.

## What the existing project had

The project uses Next.js 14, React, Tailwind, Supabase Auth, and server-side service-role API routes. `profiles` extends Auth users and stores roles. `members` is the student attendance/cord record, connected to `profiles` by `profile_id`. `member_semesters` holds semester activity and cached eligibility inputs. `attendance` connects member IDs to meeting IDs and has a unique meeting/member constraint.

Meeting create/update/delete endpoints already existed. The dashboard exposed creation and attendance but no meeting edit form. Public meetings were already database-backed. The board page used `lib/board.config.ts`, with five hardcoded officers and bundled photos. The student dashboard used a server API to fetch a profile, member, meetings, check-ins, notifications, and cord requests.

Registration created a profile, but only attempted to attach an already-existing member by email. It did not create a member for a new student. Some linking paths accepted client-supplied identity data or returned records by email without sufficient ownership checks.

## Changes

### Meetings and presentations

The existing create dialog now also edits a meeting, loads its current values, and saves through PUT to the same meeting ID. Title, description, date, semester, time, location, and presentation links are editable. Required fields and formats are validated server-side. Successful saves preserve the in-memory attendance display and show a success message; errors are visible.

Meeting updates change only the meeting row. They never delete or recreate check-ins. Changing a semester refreshes both semesters' cached meeting statistics without changing attendance IDs.

Meetings can have up to five presentation URLs. Google Slides shared, published, and embed links are converted into canonical trusted viewer URLs. Canva public view links are also supported. Provider origins and paths are checked, unsafe schemes/credentials/ports are rejected, and supplied HTML is never rendered. Student/public viewers validate URLs again before building an iframe. The viewer is responsive, expandable, and includes an external fallback link. Meetings without presentations have no viewer section.

Publication or viewer access is explained in the form. An iframe cannot reliably tell the parent page whether a provider's internal access screen blocked a presentation, so the interface always gives the student an external option. Private presentations must be checked with a real viewer account in staging.

### Public board management

A Board entry in the admin sidebar opens a separate management page. The attendance directory remains the existing Members section. Admins can add/edit officers, change biographies and roles, set display order, set visibility, and upload/replace/remove photos. Removal from public display hides the officer instead of deleting their record. Hidden officers can be restored through editing.

The public board keeps its existing layout and reads visible rows from Supabase on each request. The migration seeds Ria Kashikar, Aditya Gupta, Asmitha Muthukumar, Neil Sury, and Aditi Patel, preserving every existing biography, role, photo path, image positioning value, Instagram handle, and original order. The old configuration remains as a reference but no longer controls the public board rendering.

Instagram usernames and HTTPS profile URLs are normalized to a handle. The public link is constructed from the handle, not arbitrary submitted HTML or a custom origin. Unsupported profile/post URLs are rejected.

Photo uploads use the `board-photos` Storage bucket. The API checks administrator identity, size, MIME type, and the JPEG/PNG/WebP signature. The bucket applies a 5 MB limit and MIME allowlist. SVG/HTML uploads are excluded. No-photo profiles retain the existing initials placeholder. Original bundled photos are not deleted by replacement cleanup.

Old uploaded photos are removed after the member save, with a reference check first. Failed cleanup leaves an unused file and a visible notice. An interrupted or canceled process can leave an unused upload; periodic Storage cleanup remains an operational task. Restrictive Storage policies protect this bucket even if an unrelated older policy permits broader writes.

### Registration and linking

The unsafe signup endpoint no longer accepts a user ID or email as authority. It verifies the bearer token and uses the authenticated user ID. The function that associates members reads the email and confirmation state from `auth.users`, not a form field or user-controlled metadata.

A verified new account creates a member if no matching member exists. A verified account with one unlinked normalized email match attaches to that member and retains its original ID and history. An existing linked member is reused. A conflicting member already attached to a different account is kept unchanged and a review record is created. The student sees a linking problem instead of another person's statistics or a silently empty dashboard.

New account insertion and email confirmation both trigger this process. Callback/dashboard checks retry it safely. Email-based advisory locking, normalized-email uniqueness, and one-member-per-profile uniqueness prevent duplicate linking records. No name-based matching is used.

The migration backfills verified existing accounts, inserts missing profiles without changing existing roles, and stops before modifying ambiguous legacy email/profile links. New members' graduation year is nullable because the signup form never collected it; no graduation year is invented. Admin/student displays handle the missing value.

Enable email confirmation in Supabase Auth. With confirmation disabled, Supabase automatically marks addresses confirmed, so a database timestamp alone cannot establish that the person actually received a verification email. The deployment guide explicitly requires enabling confirmation before relying on email-based history claiming.

### Attendance and statistics

Attendance saves now call one restricted server RPC in one transaction. It validates meeting, actor, and student IDs before modifying records, locks the meeting during the save, preserves unchanged attendance rows, and marks removed check-ins absent. A failed save leaves previous records intact.

Historical counts not backed by recorded meetings are retained in baseline columns. Database triggers maintain current meeting counts after check-in changes and meeting creation, removal, or semester moves. The existing member form can still adjust historical totals; baseline capture prevents the next check-in from erasing those adjustments. Empty aggregate leadership now evaluates to false instead of violating the not-null constraint.

The attendance directory continues to list active members. Existing recorded attendance for a member subsequently made inactive can remain selected and saved without erasing their history. The check-in sheet blocks saving when initial attendance could not be loaded and displays save failures. It no longer treats a failed load as an empty list.

The student API queries its linked member by profile ID only and rejects linking conflicts. It reads that member's attendance and submissions and reports failed queries instead of silently turning them into zero statistics. It does not claim a member through an email fallback.

### Authorization and other health fixes

The uploaded code contained these specific security problems, now addressed in the implementation and migrations:

- An unauthenticated service-role signup endpoint could write arbitrary profile/member links.
- Profile self-update privileges allowed changes to the role column.
- The original signup trigger used a user-editable metadata role.
- Meeting detail and attendance endpoints allowed ordinary signed-in users to read other members' names/emails/check-ins through a service client.
- Cord submission identity came from submitted email rather than the authenticated linked member.

Authenticated profile writes are now limited to `full_name`; notifications expose only `is_read` updates. Administrator roles are managed through a trusted administrative process. Existing administrator roles are preserved, but production administrators still need to review their current administrator list for legitimacy because the previous implementation was vulnerable.

All protected server-rendered admin pages explicitly check a verified Auth user and role before service-role reads. Student/admin layouts use `getUser`, and middleware refreshes cookie-backed sessions. API access remains independently checked. New restrictive RLS guards prevent broad older permissive policies from granting ordinary students administrative writes or cross-student reads. RLS remains enabled.

Grants are explicit for all application tables created by the migration sequence. Anonymous access is limited to visible public board records; public meetings are rendered server-side. Authenticated users receive table operations needed by admin workflows, with RLS limiting students to their own records and read-only meeting/semester access. Service-role routes retain their required server privileges. Account-linking and atomic attendance RPCs cannot be called by students or anonymous clients.

The existing Next.js 14.2.3 was updated within the same release line to 14.2.35, with matching eslint-config-next and lockfile changes. The official advisory identifies 14.2.35 as the fix for the documented 14.x App Router denial-of-service issue: https://nextjs.org/blog/security-update-2025-12-11. This is not a claim that every future dependency advisory is resolved.

Resend initialization is now deferred until email sending. Missing optional email settings no longer crash a build. Existing visible text was preserved while escaping JSX apostrophes needed for lint. No application dependency was added for the features or test harness.

## Migrations

| File | Purpose |
| --- | --- |
| `202610110000_bootstrap_if_empty.sql` | Initialize a clean database from the original schema with explicit grants; skip existing project tables. |
| `202610120001_secure_registration.sql` | Secure profile privileges, normalize unique identities, verified member linking, review queue, safe backfill, service/client grants. |
| `202610120002_meetings_attendance.sql` | Time/location/presentations, historical baselines, count-refresh triggers, atomic attendance RPC, empty aggregate fix. |
| `202610120003_board_members.sql` | Dynamic board, original officer seed, grants, RLS, photo bucket, Storage policies. |
| `202610120004_authorization_guards.sql` | Restrictive guards on private/admin data, hidden board visibility, normalized member email writes. |
| `202610120005_manual_attendance_baselines.sql` | Preserve edits to historical semester totals and schema usage grants. |

## Verification matrix

| Requested scenario | Local evidence | Remaining staging check |
| --- | --- | --- |
| Create/edit meeting | PostgreSQL operations, API update-ID assertions, browser edit form | Real admin session and refresh through hosted API. |
| Preserve attendance after edit | Full attendance-row snapshots unchanged after meeting update | Compare actual migrated attendance history with backup. |
| Add Slides presentation | URL tests, database persistence, browser iframe source | Published/shared presentation actually loads for a student. |
| Replace/remove presentation | Browser form submission and validation tests | Hosted student view after refresh. |
| Add officer with photo/bio/Instagram | Browser form and multipart request, photo/type tests, Storage RLS tests | Actual Storage upload and image download. |
| Public officer display | Public board RLS read and unchanged display component | Hosted public page after real upload. |
| Edit officer, refresh | Browser state backed by mocked persistent API, PostgreSQL edit/read | Actual hosted public/admin refresh. |
| New registration creates student | Auth-table trigger test after verification | Confirmation-email delivery through real Supabase Auth. |
| New student check-in | PostgreSQL atomic attendance RPC test | Hosted check-in screen. |
| Manual student registers | Normalized verified email attaches original member ID | Controlled real account with a known manual record. |
| Keep original statistics | Linking snapshot plus preserved historical-count tests | Compare migrated live/staging totals with backup. |
| Duplicate events/registration | Repeated linking, unique constraints, conflicting identity review | Auth retry/duplicate-signup UI messages. |
| Student/anonymous API restrictions | Actual PostgreSQL roles/RLS plus route guard tests | Real JWT Data API and Storage requests. |
| Existing login/access | Role preservation, server checks, compilation | Existing user login/logout, cookie renewal, password reset if used. |
| Explicit new-table grants | Clean database initialized from migrations with privilege assertions | Staging Data API access after migration deployment. |

Database tests use actual PostgreSQL semantics through PGlite with minimal fake `auth.users` and Storage metadata tables. They do not test PostgREST, Auth email delivery, or the Storage service implementation. UI tests use the actual form components and `apiFetch`, with mocked Auth session recovery and API responses. No destructive tests were run on production.

## Files

The complete modified/created file list is below. `next-env.d.ts` was regenerated by Next.js. Original photos and the original board configuration were retained. `DEPLOYMENT.md` provides the backup, preflight, migration, staging, and recovery steps; secret configuration must remain private.

```text
MODIFIED
app/(public)/about/page.tsx
app/(public)/board/page.tsx
app/(public)/meetings/page.tsx
app/(public)/newsletter/page.tsx
app/(public)/page.tsx
app/admin/analytics/page.tsx
app/admin/attendance/page.tsx
app/admin/layout.tsx
app/admin/members/page.tsx
app/admin/page.tsx
app/admin/submissions/page.tsx
app/api/auth/signup/route.ts
app/api/meetings/[id]/attendance/route.ts
app/api/meetings/[id]/route.ts
app/api/meetings/route.ts
app/api/members/[id]/route.ts
app/api/members/route.ts
app/api/student/me/route.ts
app/api/submissions/route.ts
app/auth/callback/route.ts
app/login/page.tsx
app/signup/page.tsx
app/student/layout.tsx
components/admin/AttendanceClient.tsx
components/admin/CreateMeetingDialog.tsx
components/admin/MeetingAttendanceSheet.tsx
components/admin/MemberFormDialog.tsx
components/admin/MembersClient.tsx
components/public/MeetingsClient.tsx
components/shared/Sidebar.tsx
components/student/StudentDashboard.tsx
components/student/StudentDashboardLoader.tsx
lib/api-client.ts
lib/email.ts
lib/supabase/server.ts
middleware.ts
next-env.d.ts
package-lock.json
package.json
supabase/attendance-schema.sql
supabase/schema.sql
types/index.ts
CREATED
.env.example
.eslintrc.json
DEPLOYMENT.md
app/admin/board/page.tsx
app/api/board/[id]/route.ts
app/api/board/photos/route.ts
app/api/board/route.ts
components/admin/BoardManager.tsx
components/public/BoardClient.tsx
components/public/PresentationViewer.tsx
lib/board-input.ts
lib/meeting-input.ts
lib/photo-validation.ts
lib/presentations.ts
lib/student-link.ts
scripts/run-ui-tests.cjs
supabase/migrations/202610110000_bootstrap_if_empty.sql
supabase/migrations/202610120001_secure_registration.sql
supabase/migrations/202610120002_meetings_attendance.sql
supabase/migrations/202610120003_board_members.sql
supabase/migrations/202610120004_authorization_guards.sql
supabase/migrations/202610120005_manual_attendance_baselines.sql
supabase/preflight.sql
tests/database.mjs
tests/ui-harness.tsx
tests/ui.cjs
tests/unit.cjs
IMPLEMENTATION_REPORT.md (created)
```
