BEGIN;
ALTER TABLE public.meetings ADD COLUMN time time, ADD COLUMN location text,
 ADD COLUMN presentations jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.meetings ADD CONSTRAINT meeting_presentations_array CHECK(jsonb_typeof(presentations)='array' AND jsonb_array_length(presentations)<=5);
-- Preserve historical/manual counts not backed by recorded meetings.
ALTER TABLE public.member_semesters ADD COLUMN legacy_meetings_attended integer NOT NULL DEFAULT 0,
 ADD COLUMN legacy_meetings_total integer NOT NULL DEFAULT 0;
UPDATE public.member_semesters ms SET
 legacy_meetings_attended=greatest(0,ms.meetings_attended-(SELECT count(*) FROM public.attendance a JOIN public.meetings mt ON mt.id=a.meeting_id WHERE a.member_id=ms.member_id AND mt.semester_id=ms.semester_id AND a.attended)),
 legacy_meetings_total=greatest(0,ms.meetings_total-(SELECT count(*) FROM public.meetings mt WHERE mt.semester_id=ms.semester_id));
CREATE OR REPLACE FUNCTION public.refresh_meeting_counts(p_semester uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF p_semester IS NULL THEN RETURN; END IF;
 INSERT INTO public.member_semesters(member_id,semester_id)
 SELECT DISTINCT a.member_id,p_semester FROM public.attendance a JOIN public.meetings mt ON mt.id=a.meeting_id
 WHERE mt.semester_id=p_semester AND a.attended ON CONFLICT(member_id,semester_id) DO NOTHING;
 UPDATE public.member_semesters ms SET
 meetings_attended=ms.legacy_meetings_attended+(SELECT count(*) FROM public.attendance a JOIN public.meetings mt ON mt.id=a.meeting_id WHERE a.member_id=ms.member_id AND mt.semester_id=p_semester AND a.attended),
 meetings_total=ms.legacy_meetings_total+(SELECT count(*) FROM public.meetings mt WHERE mt.semester_id=p_semester)
 WHERE ms.semester_id=p_semester;
END $$;
CREATE OR REPLACE FUNCTION public.meeting_counts_changed() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF TG_TABLE_NAME='meetings' THEN
  IF TG_OP<>'INSERT' THEN PERFORM public.refresh_meeting_counts(OLD.semester_id); END IF;
  IF TG_OP<>'DELETE' THEN PERFORM public.refresh_meeting_counts(NEW.semester_id); END IF;
 ELSE
  IF TG_OP<>'INSERT' THEN PERFORM public.refresh_meeting_counts((SELECT semester_id FROM public.meetings WHERE id=OLD.meeting_id)); END IF;
  IF TG_OP<>'DELETE' THEN PERFORM public.refresh_meeting_counts((SELECT semester_id FROM public.meetings WHERE id=NEW.meeting_id)); END IF;
 END IF;
 RETURN coalesce(NEW,OLD);
END $$;
CREATE TRIGGER meeting_counts_sync AFTER INSERT OR UPDATE OF semester_id OR DELETE ON public.meetings
 FOR EACH ROW EXECUTE FUNCTION public.meeting_counts_changed();
CREATE TRIGGER attendance_counts_sync AFTER INSERT OR UPDATE OR DELETE ON public.attendance
 FOR EACH ROW EXECUTE FUNCTION public.meeting_counts_changed();
-- A transaction replaces the selected attendance set, preserving IDs and marker metadata for unchanged check-ins.
CREATE OR REPLACE FUNCTION public.save_meeting_attendance(p_meeting uuid,p_members uuid[],p_actor uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_actor AND role='admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 PERFORM 1 FROM public.meetings WHERE id=p_meeting FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Meeting not found'; END IF;
 IF p_members IS NULL OR EXISTS(SELECT 1 FROM unnest(p_members) x WHERE x IS NULL OR NOT EXISTS(SELECT 1 FROM public.members m WHERE m.id=x AND (m.is_active OR EXISTS(SELECT 1 FROM public.attendance a WHERE a.member_id=x AND a.meeting_id=p_meeting AND a.attended)))) THEN RAISE EXCEPTION 'Invalid student selection'; END IF;
 UPDATE public.attendance SET attended=false,marked_by=p_actor,marked_at=now()
 WHERE meeting_id=p_meeting AND attended AND NOT(member_id=ANY(p_members));
 INSERT INTO public.attendance(meeting_id,member_id,attended,marked_by)
 SELECT p_meeting,x,true,p_actor FROM (SELECT DISTINCT unnest(p_members) AS x) selected
 ON CONFLICT(meeting_id,member_id) DO UPDATE SET attended=true,marked_by=p_actor,marked_at=now()
 WHERE NOT public.attendance.attended;
 RETURN (SELECT count(DISTINCT x) FROM unnest(p_members) x);
END $$;
REVOKE ALL ON FUNCTION public.refresh_meeting_counts(uuid),public.meeting_counts_changed(),public.save_meeting_attendance(uuid,uuid[],uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_meeting_attendance(uuid,uuid[],uuid) TO service_role;
REVOKE ALL ON public.meetings,public.semesters FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.semesters TO authenticated,service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.meetings,public.attendance TO authenticated,service_role;
-- Empty aggregate must be false, not NULL (e.g. when the last semester is removed).
CREATE OR REPLACE FUNCTION public.recalculate_member_stats() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE v_member_id uuid; BEGIN
 v_member_id:=coalesce(NEW.member_id,OLD.member_id);
 UPDATE public.members SET
 total_semesters=(SELECT count(*) FROM public.member_semesters WHERE member_id=v_member_id),
 total_events=(SELECT coalesce(sum(events_attended),0) FROM public.member_semesters WHERE member_id=v_member_id),
 total_tasks=(SELECT coalesce(sum(tasks_completed),0) FROM public.member_semesters WHERE member_id=v_member_id),
 volunteer_hours=(SELECT coalesce(sum(volunteer_hours),0) FROM public.member_semesters WHERE member_id=v_member_id),
 has_leadership=(SELECT coalesce(bool_or(held_leadership),false) FROM public.member_semesters WHERE member_id=v_member_id)
 WHERE id=v_member_id;
 RETURN coalesce(NEW,OLD);
END $$;
COMMIT;
