BEGIN;
-- Editing historical semester totals in the existing member form must not be overwritten by the next check-in.
CREATE OR REPLACE FUNCTION public.capture_manual_meeting_baseline() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
DECLARE tracked_attended integer; tracked_total integer; BEGIN
 IF current_setting('sasa.refreshing_counts',true)='on' THEN RETURN NEW; END IF;
 SELECT count(*) INTO tracked_attended FROM public.attendance a JOIN public.meetings mt ON mt.id=a.meeting_id
  WHERE a.member_id=NEW.member_id AND mt.semester_id=NEW.semester_id AND a.attended;
 SELECT count(*) INTO tracked_total FROM public.meetings WHERE semester_id=NEW.semester_id;
 NEW.legacy_meetings_attended:=greatest(0,NEW.meetings_attended-tracked_attended);
 NEW.legacy_meetings_total:=greatest(0,NEW.meetings_total-tracked_total);
 NEW.meetings_attended:=NEW.legacy_meetings_attended+tracked_attended;
 NEW.meetings_total:=NEW.legacy_meetings_total+tracked_total;
 RETURN NEW;
END $$;
CREATE TRIGGER capture_manual_meeting_baseline BEFORE INSERT OR UPDATE OF meetings_attended,meetings_total ON public.member_semesters
 FOR EACH ROW EXECUTE FUNCTION public.capture_manual_meeting_baseline();
CREATE OR REPLACE FUNCTION public.refresh_meeting_counts(p_semester uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE previous_flag text; BEGIN
 IF p_semester IS NULL THEN RETURN; END IF;
 previous_flag:=coalesce(current_setting('sasa.refreshing_counts',true),'off');
 PERFORM set_config('sasa.refreshing_counts','on',true);
 INSERT INTO public.member_semesters(member_id,semester_id)
 SELECT DISTINCT a.member_id,p_semester FROM public.attendance a JOIN public.meetings mt ON mt.id=a.meeting_id
 WHERE mt.semester_id=p_semester AND a.attended ON CONFLICT(member_id,semester_id) DO NOTHING;
 UPDATE public.member_semesters ms SET
 meetings_attended=ms.legacy_meetings_attended+(SELECT count(*) FROM public.attendance a JOIN public.meetings mt ON mt.id=a.meeting_id WHERE a.member_id=ms.member_id AND mt.semester_id=p_semester AND a.attended),
 meetings_total=ms.legacy_meetings_total+(SELECT count(*) FROM public.meetings mt WHERE mt.semester_id=p_semester)
 WHERE ms.semester_id=p_semester;
 PERFORM set_config('sasa.refreshing_counts',previous_flag,true);
END $$;
REVOKE ALL ON FUNCTION public.capture_manual_meeting_baseline(),public.refresh_meeting_counts(uuid) FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role;
COMMIT;
