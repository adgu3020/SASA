BEGIN;
CREATE TABLE public.board_members (
 id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 150),
 role text NOT NULL CHECK(length(btrim(role)) BETWEEN 1 AND 150),
 bio text,
 instagram text CHECK(instagram IS NULL OR instagram ~ '^[a-zA-Z0-9._]{1,30}$'),
 local_image text CHECK(local_image IS NULL OR local_image ~ '^/images/board/[a-zA-Z0-9_-]+\.(jpg|png|webp)$'),
 photo_path text CHECK(photo_path IS NULL OR photo_path ~ '^uploads/[0-9a-f-]{36}\.(jpg|png|webp)$'),
 image_position text NOT NULL DEFAULT 'center top',
 display_order integer NOT NULL DEFAULT 0 CHECK(display_order BETWEEN 0 AND 10000),
 is_visible boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX board_members_order ON public.board_members(display_order,id);
CREATE TRIGGER board_members_updated_at BEFORE UPDATE ON public.board_members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public visible board" ON public.board_members FOR SELECT TO anon,authenticated USING(is_visible);
CREATE POLICY "Admins manage board" ON public.board_members FOR ALL TO authenticated USING(public.is_admin()) WITH CHECK(public.is_admin());
REVOKE ALL ON public.board_members FROM anon,authenticated;
GRANT SELECT ON public.board_members TO anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.board_members TO authenticated,service_role;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 VALUES('board-photos','board-photos',true,5242880,ARRAY['image/jpeg','image/png','image/webp'])
 ON CONFLICT(id) DO UPDATE SET public=true,file_size_limit=5242880,allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp'];
-- Restrictive policies prevent an unrelated pre-existing permissive storage policy from allowing board-photo mutations.
CREATE POLICY "Guard board photo writes" ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
 USING(bucket_id<>'board-photos' OR public.is_admin()) WITH CHECK(bucket_id<>'board-photos' OR public.is_admin());
CREATE POLICY "Guard anonymous board photo writes" ON storage.objects AS RESTRICTIVE FOR ALL TO anon
 USING(bucket_id<>'board-photos') WITH CHECK(bucket_id<>'board-photos');
-- Public URLs are intentional. Only admins may mutate this bucket, including via direct Storage calls.
CREATE POLICY "Admins insert board photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='board-photos' AND public.is_admin());
CREATE POLICY "Admins update board photos" ON storage.objects FOR UPDATE TO authenticated USING(bucket_id='board-photos' AND public.is_admin()) WITH CHECK(bucket_id='board-photos' AND public.is_admin());
CREATE POLICY "Admins delete board photos" ON storage.objects FOR DELETE TO authenticated USING(bucket_id='board-photos' AND public.is_admin());
CREATE POLICY "Admins inspect board photos" ON storage.objects FOR SELECT TO authenticated USING(bucket_id='board-photos' AND public.is_admin());

-- Preserve every existing officer, biography, photo, and Instagram handle.
INSERT INTO public.board_members(name,role,bio,instagram,local_image,image_position,display_order) VALUES('Ria Kashikar','President','Hi y''all!! My name is Ria and I''m from Centennial, Colorado! I am going into my final year at Boulder and am majoring in Statistics and Data Science with a minor in MCDB. I grew up playing Just Dance 4 and so I''ve memorized the routines for Beauty and the Beat, On the Floor, and Living La Vida Loca!! ','ria.kash','/images/board/president.jpg','center top',0);
INSERT INTO public.board_members(name,role,bio,instagram,local_image,image_position,display_order) VALUES('Aditya Gupta','Treasurer','Hey! I''m Aditya, a sophomore at CU majoring in Computer Science and minoring in Business. I''m from Aurora, Colorado and I love to play video games, watch movies, and listen to music in my free time!','g_aditya3','/images/board/treasurer.jpg','center top',1);
INSERT INTO public.board_members(name,role,bio,instagram,local_image,image_position,display_order) VALUES('Asmitha Muthukumar','Marketing Chair','Hey! I''m Asmitha and I''m a senior this year at CU with a major in Creative Technology and Design! I love art, fashion, and playing games!','asmitha_m_','/images/board/marketing.jpg','center top',2);
INSERT INTO public.board_members(name,role,bio,instagram,local_image,image_position,display_order) VALUES('Neil Sury','Outreach Chair','Hi I''m Neil, I''m a 4th year studying Aerospace engineering and economics. I love playing tennis and cooking in my free time and enjoy reading as well. I am looking forward to another great year at SASA!','neilsury','/images/board/outreach.jpg','center top',3);
INSERT INTO public.board_members(name,role,bio,instagram,local_image,image_position,display_order) VALUES('Aditi Patel','Head of Events','Hi, I''m Aditi, a second year pre-med student at CU studying Integrative Physiology and minoring in Biochemistry and Chemistry! In my free time, I like to crochet, hike, make mixes on Spotify, and go shopping. I''m so excited for another amazing year of SASA!!!','aditiiipatelll_','/images/board/events.jpg','center top',4);
COMMIT;
