'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Users, Calendar, CheckSquare, ChevronRight, Trash2, Loader2 } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import CreateMeetingDialog from './CreateMeetingDialog'
import MeetingAttendanceSheet from './MeetingAttendanceSheet'
import { apiFetch } from '@/lib/api-client'

interface Meeting {
  id: string
  title: string
  date: string
  description: string | null
  semester_id: string | null
  semester?: { name: string } | null
  attendance?: { count: number }[]
  created_at: string
}

interface Member {
  id: string
  full_name: string
  email: string
}

interface Semester {
  id: string
  name: string
  term: string
  year: number
  is_active: boolean
}

interface Props {
  initialMeetings: Meeting[]
  members: Member[]
  semesters: Semester[]
}

export default function AttendanceClient({ initialMeetings, members, semesters }: Props) {
  const [meetings, setMeetings]           = useState(initialMeetings)
  const [search, setSearch]               = useState('')
  const [showCreate, setShowCreate]       = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [deleting, setDeleting]           = useState<string | null>(null)
  const [semesterFilter, setSemesterFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    return meetings.filter(m => {
      const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase())
      const matchSemester = semesterFilter === 'all' || m.semester_id === semesterFilter
      return matchSearch && matchSemester
    })
  }, [meetings, search, semesterFilter])

  function getAttendanceCount(meeting: Meeting): number {
    if (!meeting.attendance) return 0
    const first = meeting.attendance[0] as any
    if (typeof first === 'object' && 'count' in first) return Number(first.count)
    return meeting.attendance.length
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this meeting and all its attendance records?')) return
    setDeleting(id)
    const res = await apiFetch(`/api/meetings/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setMeetings(prev => prev.filter(m => m.id !== id))
    } else {
      alert('Failed to delete meeting. Please try again.')
    }
    setDeleting(null)
  }

  function onMeetingCreated(meeting: Meeting) {
    setMeetings(prev => [meeting, ...prev])
    setShowCreate(false)
  }

  function onAttendanceSaved(meetingId: string, count: number) {
    setMeetings(prev => prev.map(m =>
      m.id === meetingId
        ? { ...m, attendance: [{ count }] }
        : m
    ))
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search meetings…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>

        <select
          value={semesterFilter}
          onChange={e => setSemesterFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="all">All Semesters</option>
          {semesters.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <button
          onClick={() => setShowCreate(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-amber-400 text-white font-semibold hover:bg-amber-500 transition-all"
        >
          <Plus size={14} />
          New Meeting
        </button>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} meeting{filtered.length !== 1 ? 's' : ''}</p>

      {/* Meetings list */}
      <div className="glass-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Calendar size={32} className="text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No meetings yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              Create your first meeting →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((meeting, i) => (
              <motion.div
                key={meeting.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between px-5 py-4 hover:bg-secondary/40 transition-colors group"
              >
                <div
                  className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                  onClick={() => setSelectedMeeting(meeting)}
                >
                  {/* Date badge */}
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center shrink-0">
                    <p className="text-xs font-bold text-amber-700 leading-none">
                      {new Date(meeting.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className="text-lg font-bold text-amber-900 leading-none">
                      {new Date(meeting.date + 'T00:00:00').getDate()}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{meeting.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {meeting.semester && (
                        <span className="text-xs text-muted-foreground">{meeting.semester.name}</span>
                      )}
                      {meeting.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {meeting.description}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Attendance count */}
                  <div
                    className="flex items-center gap-1.5 text-sm cursor-pointer"
                    onClick={() => setSelectedMeeting(meeting)}
                  >
                    <Users size={14} className="text-muted-foreground" />
                    <span className={cn(
                      'font-semibold',
                      getAttendanceCount(meeting) > 0 ? 'text-emerald-600' : 'text-muted-foreground'
                    )}>
                      {getAttendanceCount(meeting)}
                    </span>
                    <span className="text-xs text-muted-foreground">/ {members.length}</span>
                  </div>

                  <button
                    onClick={() => setSelectedMeeting(meeting)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-all"
                  >
                    <CheckSquare size={12} />
                    Take Attendance
                  </button>

                  <button
                    onClick={() => handleDelete(meeting.id)}
                    disabled={deleting === meeting.id}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    {deleting === meeting.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <CreateMeetingDialog
        open={showCreate}
        semesters={semesters}
        onClose={() => setShowCreate(false)}
        onCreated={onMeetingCreated}
      />

      <MeetingAttendanceSheet
        meeting={selectedMeeting}
        members={members}
        onClose={() => setSelectedMeeting(null)}
        onSaved={onAttendanceSaved}
      />
    </>
  )
}
