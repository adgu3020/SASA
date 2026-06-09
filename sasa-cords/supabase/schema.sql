-- ═══════════════════════════════════════════════════════════════
-- SASA CORD ELIGIBILITY PLATFORM — Database Schema
-- Run this entire file in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────────────────────
-- 1. PROFILES
--    Extends Supabase auth.users with role and display info
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 2. SEMESTERS
--    E.g. "Fall 2024", "Spring 2025"
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.semesters (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,           -- "Fall 2024"
  term        TEXT NOT NULL CHECK (term IN ('Fall', 'Spring', 'Summer')),
  year        INTEGER NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT FALSE, -- marks the current semester
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 3. MEMBERS
--    Core member record — one per student
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.members (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name         TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  graduation_year   INTEGER NOT NULL,
  major             TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,

  -- Eligibility fields (aggregated / cached)
  total_semesters   INTEGER NOT NULL DEFAULT 0,
  total_events      INTEGER NOT NULL DEFAULT 0,
  total_tasks       INTEGER NOT NULL DEFAULT 0,
  volunteer_hours   NUMERIC(5,1) NOT NULL DEFAULT 0,
  has_leadership    BOOLEAN NOT NULL DEFAULT FALSE,

  -- Eligibility status
  -- 'pending' | 'eligible' | 'not_eligible' | 'approved' | 'rejected'
  eligibility_status  TEXT NOT NULL DEFAULT 'pending'
    CHECK (eligibility_status IN ('pending', 'eligible', 'not_eligible', 'approved', 'rejected')),
  admin_override      BOOLEAN NOT NULL DEFAULT FALSE,
  admin_notes         TEXT,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 4. MEMBER_SEMESTERS
--    Per-semester activity records for each member
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.member_semesters (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id       UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  semester_id     UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,

  -- Activity data for this semester
  meetings_attended   INTEGER NOT NULL DEFAULT 0,
  meetings_total      INTEGER NOT NULL DEFAULT 0,
  events_attended     INTEGER NOT NULL DEFAULT 0,
  tasks_completed     INTEGER NOT NULL DEFAULT 0,
  volunteer_hours     NUMERIC(5,1) NOT NULL DEFAULT 0,
  held_leadership     BOOLEAN NOT NULL DEFAULT FALSE,
  leadership_role     TEXT,              -- e.g. "President", "Events Chair"
  notes               TEXT,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(member_id, semester_id)
);

-- ───────────────────────────────────────────────────────────────
-- 5. CORD_SUBMISSIONS
--    Google Form submissions requesting cord eligibility review
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cord_submissions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id           UUID REFERENCES public.members(id) ON DELETE SET NULL,

  -- Data from Google Form
  submitted_name      TEXT NOT NULL,
  submitted_email     TEXT NOT NULL,
  graduation_year     INTEGER,
  comments            TEXT,
  form_response_id    TEXT UNIQUE,       -- Google Form response ID to prevent duplicates

  -- Review state
  -- 'pending' | 'under_review' | 'approved' | 'rejected'
  status              TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  reviewed_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMPTZ,
  reviewer_notes      TEXT,

  -- Auto-computed at submission time
  auto_eligible       BOOLEAN,           -- TRUE if member met requirements at time of submission

  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 6. NOTIFICATIONS
--    In-app notifications shown to students on their dashboard
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_id   UUID REFERENCES public.members(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,            -- 'eligible' | 'not_eligible' | 'approved' | 'rejected' | 'info'
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- 7. AUDIT_LOGS
--    Every admin action is recorded here
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,            -- 'member.create' | 'submission.approve' | etc.
  target_type TEXT,                     -- 'member' | 'submission' | 'semester'
  target_id   UUID,
  details     JSONB,                    -- arbitrary action metadata
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS — auto-update updated_at timestamps
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER member_semesters_updated_at
  BEFORE UPDATE ON public.member_semesters
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER cord_submissions_updated_at
  BEFORE UPDATE ON public.cord_submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- TRIGGER — auto-create profile when user signs up
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- TRIGGER — recalculate member aggregate stats when a
--           member_semester row is inserted/updated
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.recalculate_member_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_member_id UUID;
BEGIN
  v_member_id := COALESCE(NEW.member_id, OLD.member_id);

  UPDATE public.members SET
    total_semesters = (
      SELECT COUNT(*) FROM public.member_semesters WHERE member_id = v_member_id
    ),
    total_events = (
      SELECT COALESCE(SUM(events_attended), 0) FROM public.member_semesters WHERE member_id = v_member_id
    ),
    total_tasks = (
      SELECT COALESCE(SUM(tasks_completed), 0) FROM public.member_semesters WHERE member_id = v_member_id
    ),
    volunteer_hours = (
      SELECT COALESCE(SUM(volunteer_hours), 0) FROM public.member_semesters WHERE member_id = v_member_id
    ),
    has_leadership = (
      SELECT BOOL_OR(held_leadership) FROM public.member_semesters WHERE member_id = v_member_id
    )
  WHERE id = v_member_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER member_semesters_recalculate
  AFTER INSERT OR UPDATE OR DELETE ON public.member_semesters
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_member_stats();

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_semesters  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cord_submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs        ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── profiles ──
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- ── semesters ──
CREATE POLICY "Anyone authenticated can read semesters"
  ON public.semesters FOR SELECT
  TO authenticated USING (TRUE);

CREATE POLICY "Admins can manage semesters"
  ON public.semesters FOR ALL
  USING (public.is_admin());

-- ── members ──
CREATE POLICY "Admins can do anything with members"
  ON public.members FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students can read own member record"
  ON public.members FOR SELECT
  USING (profile_id = auth.uid());

-- ── member_semesters ──
CREATE POLICY "Admins can manage member_semesters"
  ON public.member_semesters FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students can read own member_semesters"
  ON public.member_semesters FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE profile_id = auth.uid()
    )
  );

-- ── cord_submissions ──
CREATE POLICY "Admins can manage all submissions"
  ON public.cord_submissions FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students can read own submissions"
  ON public.cord_submissions FOR SELECT
  USING (submitted_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- ── notifications ──
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can mark own notifications read"
  ON public.notifications FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage all notifications"
  ON public.notifications FOR ALL
  USING (public.is_admin());

-- ── audit_logs ──
CREATE POLICY "Admins can read audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

-- Service role bypass (for API routes using service key)
-- This is handled automatically by using the service_role key in API routes

-- ═══════════════════════════════════════════════════════════════
-- INDEXES for performance
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);
CREATE INDEX IF NOT EXISTS idx_members_graduation_year ON public.members(graduation_year);
CREATE INDEX IF NOT EXISTS idx_members_eligibility_status ON public.members(eligibility_status);
CREATE INDEX IF NOT EXISTS idx_member_semesters_member_id ON public.member_semesters(member_id);
CREATE INDEX IF NOT EXISTS idx_cord_submissions_email ON public.cord_submissions(submitted_email);
CREATE INDEX IF NOT EXISTS idx_cord_submissions_status ON public.cord_submissions(status);
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON public.notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
