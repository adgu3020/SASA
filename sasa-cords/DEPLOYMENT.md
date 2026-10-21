# Apply the SASA update

The application code is implemented and locally checked. Production has not been inspected, migrated, or deployed. Use a separate Supabase staging project before changing the live site.

## 1. Keep a recoverable backup

Keep the current source revision and hosting configuration. Make a reviewed, recoverable database backup including public tables, Auth accounts, functions, grants, policies, and triggers. Keep a separate copy of Storage objects and bucket configuration. Confirm the backup can be restored into a separate project before proceeding. Do not run a reset, drop tables, or remove live data.

The updated archive contains source, assets, and migrations. It excludes node_modules, generated builds, git history, and secret environment files. Keep your existing `.env.local` privately or use the hosting environment settings. `.env.example` lists the variable names. No service-role key belongs in browser code or a NEXT_PUBLIC variable.

## 2. Inspect staging and resolve legacy identity problems

Restore a copy of the current database into staging. Run `supabase/preflight.sql` there first. Its results contain private email addresses, so keep them private.

Resolve these conditions with independently verified identities before applying migrations:

- Multiple members with the same trimmed, lowercase email.
- Multiple members connected to the same profile.
- Member/profile links with mismatched or unverified Auth email addresses.

The first security migration stops instead of merging ambiguous records or deleting their history. Name matches alone never establish ownership. Preserve original member IDs and their attendance relationships during any reviewed correction. If the deployed schema differs from the uploaded SQL files, compare it first; this package does not assume the uploaded schema is a live database dump.

Historical semester totals are retained as a baseline plus attendance backed by meeting records. Review existing manually entered totals before rollout. If an old total cannot be separated confidently from recorded meetings, resolve it in staging against the original records rather than guessing or deleting history.

## 3. Apply migrations once, in order

Use the existing migration workflow if one is already configured. For SQL Editor deployment, execute the following complete files in this order and record which succeeded:

1. `supabase/migrations/202610110000_bootstrap_if_empty.sql`
2. `supabase/migrations/202610120001_secure_registration.sql`
3. `supabase/migrations/202610120002_meetings_attendance.sql`
4. `supabase/migrations/202610120003_board_members.sql`
5. `supabase/migrations/202610120004_authorization_guards.sql`
6. `supabase/migrations/202610120005_manual_attendance_baselines.sql`

Each file is transactional. They are versioned migrations, not scripts to rerun repeatedly. The bootstrap skips existing profile and meeting schemas and allows a clean development database to initialize using only the migrations. Do not rerun the old standalone `schema.sql` or `attendance-schema.sql` against an existing project. Those files document the original schema; the migration directory contains the complete deployment sequence.

The files preserve current tables and IDs. They add meeting fields, the public board table, a linking review queue, constraints, and historical attendance baseline columns. The security migration backfills verified accounts without overwriting existing administrator roles. Check `account_link_reviews` afterward; unresolved conflicts also appear on the admin attendance page.

A migration failure leaves earlier committed files applied. Investigate the error, compare the staging schema and migration ledger, and continue only after the cause is resolved. Do not blindly rerun successful files.

## 4. Configure Supabase Auth and Storage

In Auth settings, enable email confirmation for email/password signup. Supabase reports auto-confirmed addresses as confirmed when confirmation is disabled, so database code cannot distinguish that configuration from ownership verified through email. Enabling email confirmation is required for the account-claiming protection promised by this update. Existing verified accounts continue to link; unverified accounts must confirm their address first.

Set the correct Site URL and allow `<your-site-origin>/auth/callback` in redirect URLs. Set the staging URL separately when testing. A signup becomes an attendance student after verification. Failed linking is shown to the student and retried on dashboard load; identity conflicts require administrator review. A new student's graduation year remains unknown until supplied. No year is guessed.

The board migration creates the public `board-photos` bucket with a 5 MB limit and JPEG/PNG/WebP MIME restrictions. Only admins may write. Existing bundled officer photos remain at their current local paths. Replaced uploaded photos are removed only after the member save succeeds and the old file is no longer referenced. Failed cleanup leaves an unused file rather than breaking a profile. Inspect unused objects periodically if interrupted uploads occur.

Confirm administrator roles in `public.profiles`. Role changes are deliberately unavailable to ordinary authenticated clients. Use a trusted administrative SQL process to change roles after confirming identity. The new signup trigger always assigns student role regardless of user-supplied metadata.

For a linking review, verify both Auth identities and member records. Correct only the inappropriate linkage under a reviewed transaction that preserves member IDs. Then run `SELECT public.ensure_student_member('<verified-auth-user-id>'::uuid);` as a trusted administrator in SQL Editor. This RPC is restricted to service role through the Data API. If a profile was already legitimately linked, do not move it to another user just to clear the queue.

## 5. Deploy and check staging

From `sasa-cords`:

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

Then run the application with staging environment settings. Test a real confirmation email, login, logout, refresh, session renewal, board photo upload/replacement, presentation sharing, and the complete attendance workflow. Google Slides embeds need publication or viewer access. A private presentation can display an access screen; the interface keeps an external link available. Browser iframe load events do not prove the provider permitted access.

Check students and anonymous users with direct Data API and Storage requests, not only hidden UI controls. Keep service keys on the server. Verify optional Resend/Mailchimp integrations using their existing settings. Email configuration is optional for builds; missing Resend settings no longer crash module initialization.

## 6. Production rollout and rollback

After the staging checklist passes and the backup/rollback plan has been reviewed, apply the same preflight and migration sequence to production during a controlled rollout. Keep administrative writes paused while applying the sequence. Deploy the new code only after all migrations succeed. Check the review queue, member counts, meeting IDs, attendance records, and student history against the pre-rollout snapshot.

If rollout fails, use maintenance mode and diagnose from the reviewed backup and migration ledger. Keep new tables and columns while repairing or deploying a compatible revision. Do not automatically drop them or restore an old database over newer attendance. Do not re-enable the old unauthenticated signup endpoint or self-editable role policy as a rollback shortcut. A database restore is a separately reviewed recovery action, with newer records reconciled before restoration.

## Optional isolated test tooling

Database tests use PGlite PostgreSQL and fake Auth/Storage tables, never a production URL. The fixture substitutes `gen_random_uuid()` for uuid-ossp; every application migration, function, policy, and grant is otherwise executed as written.

Install test tooling outside the application:

```bash
npm install --prefix /tmp/sasa-test-tools @electric-sql/pglite playwright
PGLITE_MODULE=/tmp/sasa-test-tools/node_modules/@electric-sql/pglite/dist/index.js npm run test:db
node /tmp/sasa-test-tools/node_modules/playwright/cli.js install chromium
PLAYWRIGHT_MODULE=/tmp/sasa-test-tools/node_modules/playwright npm run test:ui
```

The UI runner creates a disposable Next.js component harness and uses mocked API responses. It does not connect to real accounts or databases. Port 3100 must be free. Screenshots remain temporary test output. The optional CHROMIUM_MODULE and CHROMIUM_EXECUTABLE_PATH settings allow a separately provided headless browser where normal Playwright downloads are unavailable. No browser or database testing package was added as an application dependency.
