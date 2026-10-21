'use client'
import AttendanceClient from '@/components/admin/AttendanceClient'
import BoardManager from '@/components/admin/BoardManager'
import PresentationViewer from '@/components/public/PresentationViewer'
const semester={id:'00000000-0000-0000-0000-000000000001',name:'Fall 2026',term:'Fall',year:2026,is_active:true}
const meeting={id:'00000000-0000-0000-0000-000000000002',title:'Original Meeting',date:'2026-10-12',description:'Original description',time:'18:00',location:'UMC',semester_id:semester.id,semester,attendance:[{member_id:'student-1'}],presentations:[{url:'https://docs.google.com/presentation/d/test/edit'}],created_at:'2026-10-12'}
export default function QA(){return <main className="p-6 space-y-8"><AttendanceClient initialMeetings={[meeting]} semesters={[semester]} members={[{id:'student-1',full_name:'Rahul',email:'rahul@test.edu'}]} /><BoardManager /><PresentationViewer presentations={meeting.presentations}/></main>}
