-- READ ONLY. Run before migrations and keep results private.
SELECT lower(btrim(email)) AS normalized_email,array_agg(id) AS member_ids
 FROM public.members GROUP BY 1 HAVING count(*)>1;
SELECT profile_id,array_agg(id) AS member_ids FROM public.members WHERE profile_id IS NOT NULL GROUP BY 1 HAVING count(*)>1;
SELECT m.id,m.profile_id,m.email,u.email AS account_email,u.email_confirmed_at
 FROM public.members m LEFT JOIN auth.users u ON u.id=m.profile_id
 WHERE m.profile_id IS NOT NULL AND (u.email_confirmed_at IS NULL OR lower(btrim(m.email))<>lower(btrim(u.email)));
SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname IN ('public','storage');
SELECT grantee,table_name,privilege_type FROM information_schema.role_table_grants WHERE table_schema='public';
SELECT id,email FROM auth.users WHERE email_confirmed_at IS NULL;
