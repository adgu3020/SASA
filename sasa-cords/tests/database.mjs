import assert from 'node:assert/strict'
import fs from 'node:fs'
// Install only in disposable tooling: npm install --prefix /tmp/sasa-test @electric-sql/pglite
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite')
const db = new PGlite()
let tests=0
function check(value,message){assert.ok(value,message);tests++;console.log('PASS',message)}
const rows=async(sql)=> (await db.query(sql)).rows
const foundation = `CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
 CREATE SCHEMA auth; CREATE SCHEMA storage;
 CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb DEFAULT '{}');
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 CREATE FUNCTION public.uuid_generate_v4() RETURNS uuid LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;
 CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bucket_id text,name text);
 ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
 GRANT USAGE ON SCHEMA public,auth,storage TO anon,authenticated,service_role;
 GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO anon,authenticated,service_role;`
await db.exec(foundation)
await db.exec(fs.readFileSync('supabase/schema.sql','utf8').replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',''))
await db.exec(fs.readFileSync('supabase/attendance-schema.sql','utf8'))
const admin='00000000-0000-0000-0000-000000000001',rahul='00000000-0000-0000-0000-000000000002',newUser='00000000-0000-0000-0000-000000000003',other='00000000-0000-0000-0000-000000000004'
await db.exec(`INSERT INTO auth.users(id,email,email_confirmed_at) VALUES('${admin}','admin@test.edu',now()),('${other}','existing@test.edu',now());
 UPDATE public.profiles SET role='admin' WHERE id='${admin}';
 INSERT INTO public.members(id,email,full_name,graduation_year) VALUES('${rahul}',' Rahul@Test.edu ','Rahul',2028);
 INSERT INTO public.semesters(id,name,term,year) VALUES('${admin}','Fall Test','Fall',2026),('${other}','Spring Test','Spring',2027);
 INSERT INTO public.meetings(id,title,date,semester_id) VALUES('${admin}','Original meeting','2026-10-10','${admin}');
 INSERT INTO public.attendance(id,meeting_id,member_id) VALUES('${admin}','${admin}','${rahul}');
 INSERT INTO public.member_semesters(member_id,semester_id,meetings_attended,meetings_total,events_attended,tasks_completed,held_leadership) VALUES('${rahul}','${admin}',3,4,2,5,true);`)
for(const file of fs.readdirSync('supabase/migrations').sort()){
 await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8').replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',''))
 console.log('APPLIED',file)
}
check((await rows(`SELECT role FROM public.profiles WHERE id='${admin}'`))[0].role==='admin','Existing admin role preserved')
check((await rows(`SELECT count(*)::int n FROM public.members WHERE profile_id='${other}'`))[0].n===1,'Existing verified user safely backfilled')
check((await rows(`SELECT count(*)::int n FROM public.board_members`))[0].n===5,'All five original board members seeded')
await db.exec(`INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES('${rahul}','rahul@test.edu','{"full_name":"Rahul","role":"admin"}');`)
check((await rows(`SELECT profile_id FROM public.members WHERE id='${rahul}'`))[0].profile_id===null,'Unverified signup cannot claim existing student history')
check((await rows(`SELECT role FROM public.profiles WHERE id='${rahul}'`))[0].role==='student','Signup metadata cannot assign administrator role')
await db.exec(`UPDATE auth.users SET email_confirmed_at=now() WHERE id='${rahul}';`)
check((await rows(`SELECT id FROM public.members WHERE profile_id='${rahul}'`))[0].id===rahul,'Verified normalized email links original member ID')
await db.exec(`SELECT public.ensure_student_member('${rahul}'); SELECT public.ensure_student_member('${rahul}');`)
check((await rows(`SELECT count(*)::int n FROM public.members WHERE lower(email)='rahul@test.edu'`))[0].n===1,'Repeated account-linking events create no duplicates')
check((await rows(`SELECT count(*)::int n FROM public.attendance WHERE member_id='${rahul}' AND attended`))[0].n===1,'Account linking preserves check-ins')
await db.exec(`INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES('${newUser}','new@test.edu',now(),'{"full_name":"New Student"}');`)
const newMember=(await rows(`SELECT id FROM public.members WHERE profile_id='${newUser}'`))[0].id
check(!!newMember,'Verified new signup automatically creates attendance student')
await db.exec(`SELECT public.save_meeting_attendance('${admin}',ARRAY['${rahul}','${newMember}']::uuid[],'${admin}');`)
check((await rows(`SELECT id FROM public.attendance WHERE member_id='${rahul}'`))[0].id===admin,'Saving check-ins preserves unchanged attendance row ID')
const snapshot=await rows(`SELECT * FROM public.attendance ORDER BY member_id`)
await db.exec(`UPDATE public.meetings SET title='Edited meeting',date='2026-10-12',time='18:00',location='UMC',presentations='[{"url":"https://docs.google.com/presentation/d/test/edit"}]' WHERE id='${admin}';`)
check(JSON.stringify(snapshot)===JSON.stringify(await rows(`SELECT * FROM public.attendance ORDER BY member_id`)),'Meeting editing leaves all attendance records unchanged')
check((await rows(`SELECT meetings_attended,meetings_total FROM public.member_semesters WHERE member_id='${rahul}' AND semester_id='${admin}'`))[0].meetings_attended===3,'Historical manual attendance remains in totals')
await db.exec(`INSERT INTO public.meetings(title,date,semester_id) VALUES('Second meeting','2026-10-20','${admin}');`)
check((await rows(`SELECT meetings_total FROM public.member_semesters WHERE member_id='${rahul}' AND semester_id='${admin}'`))[0].meetings_total===5,'Creating a meeting refreshes semester denominator')
await db.exec(`UPDATE public.meetings SET semester_id='${other}' WHERE id='${admin}';`)
check((await rows(`SELECT meetings_attended FROM public.member_semesters WHERE member_id='${rahul}' AND semester_id='${admin}'`))[0].meetings_attended===2,'Moving meeting updates old semester while keeping legacy count')
check((await rows(`SELECT meetings_attended FROM public.member_semesters WHERE member_id='${rahul}' AND semester_id='${other}'`))[0].meetings_attended===1,'Moving meeting updates new semester statistics')
const before=await rows(`SELECT * FROM public.attendance ORDER BY member_id`)
await assert.rejects(db.exec(`SELECT public.save_meeting_attendance('${admin}',ARRAY['11111111-1111-1111-1111-111111111111']::uuid[],'${admin}');`))
check(JSON.stringify(before)===JSON.stringify(await rows(`SELECT * FROM public.attendance ORDER BY member_id`)),'Invalid attendance save leaves previous check-ins intact')
await db.exec(`SELECT public.save_meeting_attendance('${admin}',ARRAY['${rahul}']::uuid[],'${admin}');`)
check(!(await rows(`SELECT attended FROM public.attendance WHERE member_id='${newMember}'`))[0].attended,'Removing check-in retains record marked absent')
await db.exec(`SELECT public.save_meeting_attendance('${admin}',ARRAY['${rahul}','${newMember}']::uuid[],'${admin}');`)
// Direct authenticated requests use actual Postgres privileges and RLS.
async function asRole(role,id,sql){
 await db.exec(`SET ROLE ${role}; SELECT set_config('request.jwt.claim.sub','${id ?? ''}',false);`)
 try { return await db.query(sql) } finally { await db.exec('RESET ROLE') }
}
const own=await asRole('authenticated',newUser,`SELECT member_id FROM public.attendance`)
check(own.rows.length===1 && own.rows[0].member_id===newMember,'Student RLS only exposes own attendance')
const studentMembers=await asRole('authenticated',newUser,`SELECT id FROM public.members`)
check(studentMembers.rows.length===1 && studentMembers.rows[0].id===newMember,'Student RLS only exposes own member record')
check((await asRole('authenticated',admin,'SELECT id FROM public.attendance')).rows.length===2,'Administrator RLS reads attendance directory')
check((await asRole('authenticated',newUser,`UPDATE public.meetings SET title='Hacked' WHERE id='${admin}' RETURNING id`)).rows.length===0,'Student cannot update meetings through Data API')
await assert.rejects(asRole('authenticated',newUser,`UPDATE public.profiles SET role='admin' WHERE id='${newUser}'`));check(true,'Column grants reject self-promotion')
await assert.rejects(asRole('authenticated',newUser,`SELECT public.ensure_student_member('${rahul}')`));check(true,'Account linking RPC unavailable to students')
await assert.rejects(asRole('authenticated',newUser,`INSERT INTO public.attendance(meeting_id,member_id) VALUES('${other}','${newMember}')`));check(true,'Student cannot insert attendance')
await assert.rejects(asRole('anon',null,`SELECT * FROM public.members`));check(true,'Anonymous requests cannot read private student directory')
const board=(await rows('SELECT id FROM public.board_members ORDER BY display_order'))[0].id
await asRole('authenticated',admin,`UPDATE public.board_members SET name='Edited Officer',instagram='new.handle',display_order=9 WHERE id='${board}'`)
check((await asRole('anon',null,`SELECT name FROM public.board_members WHERE id='${board}'`)).rows[0].name==='Edited Officer','Public board reflects persistent admin edits')
await asRole('authenticated',admin,`UPDATE public.board_members SET is_visible=false WHERE id='${board}'`)
check((await asRole('anon',null,`SELECT id FROM public.board_members WHERE id='${board}'`)).rows.length===0,'Hidden board members excluded from public Data API')
await assert.rejects(asRole('authenticated',newUser,`INSERT INTO public.board_members(name,role) VALUES('Hacker','President')`));check(true,'Students cannot create board members')
// Simulate an unrelated broad legacy policy to test the restrictive bucket guard.
await db.exec(`CREATE POLICY broad_storage ON storage.objects FOR ALL TO anon,authenticated USING(true) WITH CHECK(true);`)
await assert.rejects(asRole('authenticated',newUser,`INSERT INTO storage.objects(bucket_id,name) VALUES('board-photos','bad.png')`));check(true,'Students cannot upload photos despite unrelated permissive policy')
await assert.rejects(asRole('anon',null,`INSERT INTO storage.objects(bucket_id,name) VALUES('board-photos','bad.png')`));check(true,'Anonymous photo uploads denied')
await asRole('authenticated',admin,`INSERT INTO storage.objects(bucket_id,name) VALUES('board-photos','good.png')`);check(true,'Admins can upload to board photo bucket')
const conflict='00000000-0000-0000-0000-000000000005'
await db.exec(`INSERT INTO auth.users(id,email,email_confirmed_at) VALUES('${conflict}','rahul@test.edu',now());`)
check((await rows(`SELECT count(*)::int n FROM public.account_link_reviews WHERE profile_id='${conflict}'`))[0].n===1,'Conflicting verified identity is flagged for administrator review')
check((await rows(`SELECT profile_id FROM public.members WHERE id='${rahul}'`))[0].profile_id===rahul,'Conflicting identity never reassigns original member')
await assert.rejects(db.exec(`INSERT INTO public.members(email,full_name) VALUES('RAHUL@test.edu','Duplicate')`));check(true,'Normalized unique constraint rejects duplicate member emails')
await db.exec(`DELETE FROM public.member_semesters WHERE member_id='${newMember}';`)
check((await rows(`SELECT has_leadership FROM public.members WHERE id='${newMember}'`))[0].has_leadership===false,'Removing final semester safely computes empty aggregates')
await db.exec(`UPDATE public.member_semesters SET meetings_attended=7,meetings_total=8 WHERE member_id='${rahul}' AND semester_id='${other}';
 SELECT public.save_meeting_attendance('${admin}',ARRAY['${rahul}','${newMember}']::uuid[],'${admin}');`)
check((await rows(`SELECT meetings_attended FROM public.member_semesters WHERE member_id='${rahul}' AND semester_id='${other}'`))[0].meetings_attended===7,'Editing historical attendance totals survives subsequent check-in saves')
await db.exec(`CREATE POLICY broad_members ON public.members FOR ALL TO authenticated USING(true) WITH CHECK(true);
 CREATE POLICY broad_board ON public.board_members FOR ALL TO anon,authenticated USING(true) WITH CHECK(true);`)
check((await asRole('authenticated',newUser,`SELECT id FROM public.members`)).rows.length===1,'Restrictive visibility blocks broad legacy student-directory policies')
check((await asRole('authenticated',newUser,`UPDATE public.members SET full_name='Changed' WHERE profile_id='${rahul}' RETURNING id`)).rows.length===0,'Restrictive writes block broad legacy admin-data policies')
check((await asRole('anon',null,`SELECT id FROM public.board_members WHERE id='${board}'`)).rows.length===0,'Hidden board remains private despite a broad legacy policy')
await assert.rejects(asRole('authenticated',newUser,`INSERT INTO public.board_members(name,role) VALUES('Hacker','President')`));check(true,'Broad legacy board policy cannot grant student writes')
const fresh = new PGlite()
await fresh.exec(foundation)
for(const file of fs.readdirSync('supabase/migrations').sort()) await fresh.exec(fs.readFileSync('supabase/migrations/'+file,'utf8').replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',''))
check((await fresh.query('SELECT count(*)::int n FROM public.board_members')).rows[0].n===5,'Clean database bootstraps complete schema and board seed from migrations only')
check((await fresh.query("SELECT has_table_privilege('service_role','public.members','INSERT') allowed")).rows[0].allowed,'Clean database has explicit service-role Data API grants')
check((await fresh.query("SELECT has_table_privilege('anon','public.members','SELECT') allowed")).rows[0].allowed===false,'Clean database denies anonymous private-data grants')
await fresh.close()
await db.close();console.log(`${tests} database checks passed`)
