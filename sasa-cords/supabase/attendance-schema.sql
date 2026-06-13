-- ═══════════════════════════════════════════════════════════════
-- ATTENDANCE TRACKING — Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── meetings ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meetings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  date        DATE NOT NULL,
  description TEXT,
  semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── attendance ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id  UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  attended    BOOLEAN NOT NULL DEFAULT TRUE,
  marked_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  marked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(meeting_id, member_id)
);

-- ── updated_at trigger ─────────────────────────────────────────
CREATE TRIGGER meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.meetings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage meetings"
  ON public.meetings FOR ALL USING (public.is_admin());

CREATE POLICY "Authenticated users read meetings"
  ON public.meetings FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admins manage attendance"
  ON public.attendance FOR ALL USING (public.is_admin());

CREATE POLICY "Members read own attendance"
  ON public.attendance FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE profile_id = auth.uid()
    )
  );

-- ── indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_meetings_date        ON public.meetings(date DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_semester    ON public.meetings(semester_id);
CREATE INDEX IF NOT EXISTS idx_attendance_meeting   ON public.attendance(meeting_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member    ON public.attendance(member_id);

-- ═══════════════════════════════════════════════════════════════
-- FEATURE SET 2: Make profile_id fully optional on members
-- (Already nullable in original schema — this just confirms it)
-- ═══════════════════════════════════════════════════════════════

-- Auto-link member when a profile is created with matching email
CREATE OR REPLACE FUNCTION public.handle_member_linking()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new profile is created, check if a member with same email exists
  UPDATE public.members
  SET profile_id = NEW.id
  WHERE email = NEW.email
    AND profile_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_link_member
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_member_linking();
