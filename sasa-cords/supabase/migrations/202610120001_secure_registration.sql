BEGIN;
-- Stop safely on ambiguous legacy identities. Resolve using preflight.sql, never merge by name.
DO $$ BEGIN
 IF EXISTS (SELECT lower(btrim(email)) FROM public.members GROUP BY 1 HAVING count(*) > 1)
 OR EXISTS (SELECT profile_id FROM public.members WHERE profile_id IS NOT NULL GROUP BY 1 HAVING count(*) > 1)
 OR EXISTS (SELECT 1 FROM public.members m LEFT JOIN auth.users u ON u.id=m.profile_id WHERE m.profile_id IS NOT NULL AND (u.email_confirmed_at IS NULL OR lower(btrim(m.email))<>lower(btrim(u.email))))
 THEN RAISE EXCEPTION 'Ambiguous member emails/profile links. Run preflight.sql and resolve manually before migration.'; END IF;
END $$;
UPDATE public.members SET email = lower(btrim(email));
CREATE UNIQUE INDEX members_normalized_email ON public.members (lower(btrim(email)));
CREATE UNIQUE INDEX members_one_profile ON public.members(profile_id) WHERE profile_id IS NOT NULL;
ALTER TABLE public.members ALTER COLUMN graduation_year DROP NOT NULL;

-- User-controlled metadata never supplies an authorization role.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 INSERT INTO public.profiles(id,email,full_name,role)
 VALUES(NEW.id,lower(btrim(NEW.email)),coalesce(NEW.raw_user_meta_data->>'full_name',''),'student');
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='admin');
$$;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE(full_name) ON public.profiles TO authenticated;
CREATE POLICY "Users edit display name" ON public.profiles FOR UPDATE TO authenticated
 USING(id=auth.uid()) WITH CHECK(id=auth.uid());
-- Do not grant role/email/id updates. Admin roles are changed only through trusted server/SQL.

CREATE TABLE public.account_link_reviews (
 profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 reason text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.account_link_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read linking reviews" ON public.account_link_reviews FOR SELECT TO authenticated USING(public.is_admin());
REVOKE ALL ON public.account_link_reviews FROM anon, authenticated;
GRANT SELECT ON public.account_link_reviews TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.account_link_reviews TO service_role;

DROP TRIGGER IF EXISTS on_profile_created_link_member ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_member_linking();
CREATE OR REPLACE FUNCTION public.ensure_student_member(p_user_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE u auth.users%ROWTYPE; m public.members%ROWTYPE; v_email text; v_id uuid;
BEGIN
 SELECT * INTO u FROM auth.users WHERE id=p_user_id;
 IF NOT FOUND OR u.email_confirmed_at IS NULL THEN RETURN NULL; END IF;
 v_email := lower(btrim(u.email));
 IF v_email IS NULL OR v_email='' THEN RETURN NULL; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(v_email,0));
 INSERT INTO public.profiles(id,email,full_name,role)
 VALUES(u.id,v_email,coalesce(u.raw_user_meta_data->>'full_name',''),'student') ON CONFLICT(id) DO NOTHING;
 SELECT * INTO m FROM public.members WHERE profile_id=u.id;
 IF FOUND THEN RETURN m.id; END IF;
 SELECT * INTO m FROM public.members WHERE lower(btrim(email))=v_email FOR UPDATE;
 IF FOUND THEN
  IF m.profile_id IS NOT NULL AND m.profile_id<>u.id THEN
   INSERT INTO public.account_link_reviews(profile_id,reason) VALUES(u.id,'Email belongs to a member linked to another account')
    ON CONFLICT(profile_id) DO UPDATE SET reason=excluded.reason;
   RETURN NULL;
  END IF;
  UPDATE public.members SET profile_id=u.id WHERE id=m.id;
  v_id:=m.id;
 ELSE
  INSERT INTO public.members(profile_id,email,full_name,graduation_year)
  VALUES(u.id,v_email,coalesce(nullif(btrim(u.raw_user_meta_data->>'full_name'),''),v_email),NULL)
  RETURNING id INTO v_id;
 END IF;
 DELETE FROM public.account_link_reviews WHERE profile_id=u.id;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.ensure_student_member(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_student_member(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.sync_verified_student() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 PERFORM public.ensure_student_member(NEW.id);
 RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_verified_member AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
 FOR EACH ROW EXECUTE FUNCTION public.sync_verified_student();
-- Existing verified accounts only. Missing profiles are inserted without overwriting any role.
DO $$ DECLARE u record; BEGIN
 FOR u IN SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL LOOP
  PERFORM public.ensure_student_member(u.id);
 END LOOP;
END $$;

-- Notification ownership does not imply permission to change its content or recipient.
REVOKE ALL ON public.notifications FROM anon, authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE(is_read) ON public.notifications TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.profiles,public.semesters,public.members,
 public.member_semesters,public.cord_submissions,public.notifications,public.audit_logs,
 public.meetings,public.attendance TO service_role;
REVOKE ALL ON public.members,public.member_semesters,public.cord_submissions,public.audit_logs,public.attendance FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.members,public.member_semesters,public.cord_submissions,
 public.semesters,public.meetings,public.attendance TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user(),public.sync_verified_student() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
COMMIT;
