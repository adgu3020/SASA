'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, CheckSquare, Square, Loader2, Users, Check } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api-client'

interface Member { id: string; full_name: string; email: string }
interface Meeting {
  id: string; title: string; date: string;
  description: string | null; semester?: { name: string } | null
}

interface Props {
  meeting: Meeting | null
  members: Member[]
  onClose: () => void
  onSaved: (meetingId: string, count: number) => void
}

export default function MeetingAttendanceSheet({ meeting, members, onClose, onSaved }: Props) {
  const [attended, setAttended]   = useState<Set<string>>(new Set())
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)

  // Load existing attendance when meeting changes
  useEffect(() => {
    if (!meeting) return
    setSearch('')
    setSaved(false)
    setLoading(true)

    apiFetch(`/api/meetings/${meeting.id}/attendance`)
      .then(r => r.json())
      .then(({ data }) => {
        const ids = new Set<string>((data ?? []).map((a: any) => a.member_id))
        setAttended(ids)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [meeting?.id])

  const filteredMembers = useMemo(() =>
    members.filter(m =>
      !search ||
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    ),
    [members, search]
  )

  function toggle(id: string) {
    setAttended(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setSaved(false)
  }

  function selectAll() {
    setAttended(new Set(filteredMembers.map(m => m.id)))
    setSaved(false)
  }

  function clearAll() {
    setAttended(new Set())
    setSaved(false)
  }

  async function handleSave() {
    if (!meeting) return
    setSaving(true)
    setSaved(false)

    const res = await apiFetch(`/api/meetings/${meeting.id}/attendance`, {
      method: 'POST',
      body: JSON.stringify({ member_ids: [...attended] }),
    })

    setSaving(false)
    if (res.ok) {
      setSaved(true)
      onSaved(meeting.id, attended.size)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <AnimatePresence>
      {meeting && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-serif text-xl">{meeting.title}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {new Date(meeting.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </p>
                {meeting.semester && (
                  <p className="text-xs text-amber-600 mt-0.5">{meeting.semester.name}</p>
                )}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Stats bar */}
            <div className="flex items-center justify-between px-6 py-3 bg-amber-50 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">
                  {attended.size} / {members.length} present
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-amber-700 hover:text-amber-900 font-medium transition-colors"
                >
                  Select all
                </button>
                <span className="text-amber-300">|</span>
                <button
                  onClick={clearAll}
                  className="text-xs text-amber-700 hover:text-amber-900 font-medium transition-colors"
                >
                  Clear all
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-border">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search members…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input-field pl-9"
                />
              </div>
            </div>

            {/* Member list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-muted-foreground" />
                </div>
              ) : filteredMembers.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-12">No members found</p>
              ) : (
                <div className="divide-y divide-border">
                  {filteredMembers.map(member => {
                    const isPresent = attended.has(member.id)
                    return (
                      <button
                        key={member.id}
                        onClick={() => toggle(member.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors',
                          isPresent ? 'bg-emerald-50 hover:bg-emerald-100' : 'hover:bg-secondary/40'
                        )}
                      >
                        <div className={cn(
                          'w-5 h-5 rounded flex items-center justify-center border-2 transition-all shrink-0',
                          isPresent
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-gray-300 bg-white'
                        )}>
                          {isPresent && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                        <div className="min-w-0">
                          <p className={cn(
                            'text-sm font-medium truncate',
                            isPresent ? 'text-emerald-800' : 'text-foreground'
                          )}>
                            {member.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                        {isPresent && (
                          <span className="ml-auto text-xs text-emerald-600 font-semibold shrink-0">
                            Present
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Save footer */}
            <div className="px-6 py-4 border-t border-border bg-white">
              <button
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  'w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all',
                  saved
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-400 text-white hover:bg-amber-500 disabled:opacity-60'
                )}
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                {saved && <Check size={15} />}
                {saving ? 'Saving…' : saved ? 'Saved!' : `Save Attendance (${attended.size} present)`}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
