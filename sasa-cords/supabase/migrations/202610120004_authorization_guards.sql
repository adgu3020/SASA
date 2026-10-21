BEGIN;
-- Restrictive guards enforce intended access even if a deployed database has an older broad permissive policy.
CREATE POLICY "Guard profile updates" ON public.profiles AS RESTRICTIVE FOR UPDATE TO authenticated USING(id=auth.uid()) WITH CHECK(id=auth.uid());
CREATE POLICY "Guard linking review visibility" ON public.account_link_reviews AS RESTRICTIVE FOR SELECT TO authenticated USING(public.is_admin());
CREATE POLICY "Guard board hidden visibility" ON public.board_members AS RESTRICTIVE FOR SELECT TO authenticated USING(is_visible OR public.is_admin());
CREATE POLICY "Guard board anonymous visibility" ON public.board_members AS RESTRICTIVE FOR SELECT TO anon USING(is_visible);
CREATE POLICY "Guard board inserts" ON public.board_members AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(public.is_admin());
CREATE POLICY "Guard board updates" ON public.board_members AS RESTRICTIVE FOR UPDATE TO authenticated USING(public.is_admin()) WITH CHECK(public.is_admin());
CREATE POLICY "Guard board deletes" ON public.board_members AS RESTRICTIVE FOR DELETE TO authenticated USING(public.is_admin());
CREATE POLICY "Guard profile visibility" ON public.profiles AS RESTRICTIVE FOR SELECT TO authenticated USING(id=auth.uid() OR public.is_admin());
CREATE POLICY "Guard student directory visibility" ON public.members AS RESTRICTIVE FOR SELECT TO authenticated USING(profile_id=auth.uid() OR public.is_admin());
CREATE POLICY "Guard attendance visibility" ON public.attendance AS RESTRICTIVE FOR SELECT TO authenticated USING(public.is_admin() OR EXISTS(SELECT 1 FROM public.members m WHERE m.id=member_id AND m.profile_id=auth.uid()));
CREATE POLICY "Guard semester record visibility" ON public.member_semesters AS RESTRICTIVE FOR SELECT TO authenticated USING(public.is_admin() OR EXISTS(SELECT 1 FROM public.members m WHERE m.id=member_id AND m.profile_id=auth.uid()));
CREATE POLICY "Guard submission visibility" ON public.cord_submissions AS RESTRICTIVE FOR SELECT TO authenticated USING(public.is_admin() OR EXISTS(SELECT 1 FROM public.members m WHERE m.id=member_id AND m.profile_id=auth.uid()));
CREATE POLICY "Guard notification visibility" ON public.notifications AS RESTRICTIVE FOR SELECT TO authenticated USING(profile_id=auth.uid() OR public.is_admin());
CREATE POLICY "Guard notification updates" ON public.notifications AS RESTRICTIVE FOR UPDATE TO authenticated USING(profile_id=auth.uid() OR public.is_admin()) WITH CHECK(profile_id=auth.uid() OR public.is_admin());
CREATE POLICY "Guard audit visibility" ON public.audit_logs AS RESTRICTIVE FOR SELECT TO authenticated USING(public.is_admin());
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['members','member_semesters','attendance','meetings','semesters','cord_submissions'] LOOP
  EXECUTE format('CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(public.is_admin())','Guard admin inserts',t);
  EXECUTE format('CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING(public.is_admin()) WITH CHECK(public.is_admin())','Guard admin updates',t);
  EXECUTE format('CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING(public.is_admin())','Guard admin deletes',t);
 END LOOP;
END $$;
-- New student records have an unknown graduation year until supplied; no year is inferred from their name or email.
-- Protect normalized email consistency for manual admin changes too.
CREATE OR REPLACE FUNCTION public.normalize_member_email() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN NEW.email:=lower(btrim(NEW.email)); RETURN NEW; END $$;
CREATE TRIGGER normalize_member_email BEFORE INSERT OR UPDATE OF email ON public.members FOR EACH ROW EXECUTE FUNCTION public.normalize_member_email();
REVOKE ALL ON FUNCTION public.normalize_member_email(),public.recalculate_member_stats(),public.handle_updated_at() FROM PUBLIC,anon,authenticated;
COMMIT;
