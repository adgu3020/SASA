'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Filter, Download, Pencil, Trash2, RefreshCw, ChevronDown } from 'lucide-react'
import { EligibilityBadge } from '@/components/shared/EligibilityBadge'
import MemberFormDialog from './MemberFormDialog'
import MemberDetailSheet from './MemberDetailSheet'
import { cn, formatDate } from '@/lib/utils'
import type { Member, MemberWithSemesters, Semester } from '@/types'
import type { EligibilityStatus } from '@/lib/eligibility.config'

interface MembersClientProps {
  initialMembers: MemberWithSemesters[]
  semesters: Semester[]
}

const STATUS_FILTERS: { label: string; value: EligibilityStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Eligible', value: 'eligible' },
  { label: 'Not Eligible', value: 'not_eligible' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

export default function MembersClient({ initialMembers, semesters }: MembersClientProps) {
  const [members, setMembers] = useState(initialMembers)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<EligibilityStatus | 'all'>('all')
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all')
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingMember, setEditingMember] = useState<MemberWithSemesters | null>(null)
  const [detailMember, setDetailMember] = useState<MemberWithSemesters | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const graduationYears = useMemo(() =>
    [...new Set(members.map(m => m.graduation_year))].sort((a, b) => a - b),
    [members]
  )

  const filtered = useMemo(() => {
    return members.filter(m => {
      const matchSearch =
        !search ||
        m.full_name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())

      const matchStatus = statusFilter === 'all' || m.eligibility_status === statusFilter
      const matchYear = yearFilter === 'all' || m.graduation_year === yearFilter

      return matchSearch && matchStatus && matchYear
    })
  }, [members, search, statusFilter, yearFilter])

  async function handleDelete(id: string) {
    if (!confirm('Delete this member? This cannot be undone.')) return
    setDeleting(id)
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setMembers(prev => prev.filter(m => m.id !== id))
    }
    setDeleting(null)
  }

  async function handleRecalculate(member: MemberWithSemesters) {
    const res = await fetch(`/api/members/${member.id}/recalculate`, { method: 'POST' })
    if (res.ok) {
      const { data } = await res.json()
      setMembers(prev => prev.map(m => m.id === data.id ? { ...m, ...data } : m))
    }
  }

  function handleExportCSV() {
    const headers = ['Name', 'Email', 'Graduation Year', 'Semesters', 'Events', 'Tasks', 'Volunteer Hrs', 'Leadership', 'Status']
    const rows = filtered.map(m => [
      m.full_name,
      m.email,
      m.graduation_year,
      m.total_semesters,
      m.total_events,
      m.total_tasks,
      m.volunteer_hours,
      m.has_leadership ? 'Yes' : 'No',
      m.eligibility_status,
    ])

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sasa-members-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function onSaved(savedMember: MemberWithSemesters) {
    setMembers(prev => {
      const idx = prev.findIndex(m => m.id === savedMember.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = savedMember
        return updated
      }
      return [savedMember, ...prev]
    })
    setShowFormDialog(false)
    setEditingMember(null)
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search members…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/30 transition-all"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value as EligibilityStatus | 'all')}
              className={cn(
                'px-3 py-1 text-xs rounded-md transition-all font-medium',
                statusFilter === f.value
                  ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Year filter */}
        <select
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="px-3 py-2 text-sm rounded-lg bg-card border border-border text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-400/30"
        >
          <option value="all">All Years</option>
          {graduationYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <div className="ml-auto flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:border-amber-400/30 transition-all"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={() => { setEditingMember(null); setShowFormDialog(true) }}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-amber-400 text-navy-900 font-semibold hover:bg-amber-300 transition-all"
          >
            <Plus size={14} />
            Add Member
          </button>
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {members.length} members
      </p>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Name', 'Email', 'Grad Year', 'Semesters', 'Events', 'Leadership', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                      {search ? 'No members match your search.' : 'No members yet — add your first one.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((member, i) => (
                    <motion.tr
                      key={member.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setDetailMember(member)}
                      className="table-row-hover border-b border-border/50 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{member.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{member.graduation_year}</td>
                      <td className="px-4 py-3 text-muted-foreground">{member.total_semesters}</td>
                      <td className="px-4 py-3 text-muted-foreground">{member.total_events}</td>
                      <td className="px-4 py-3">
                        {member.has_leadership ? (
                          <span className="text-xs text-amber-400">Yes</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <EligibilityBadge status={member.eligibility_status} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleRecalculate(member)}
                            title="Recalculate eligibility"
                            className="p-1.5 rounded-md text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10 transition-all"
                          >
                            <RefreshCw size={13} />
                          </button>
                          <button
                            onClick={() => { setEditingMember(member); setShowFormDialog(true) }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-sky-400 hover:bg-sky-400/10 transition-all"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            disabled={deleting === member.id}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit dialog */}
      <MemberFormDialog
        open={showFormDialog}
        member={editingMember}
        semesters={semesters}
        onClose={() => { setShowFormDialog(false); setEditingMember(null) }}
        onSaved={onSaved}
      />

      {/* Detail sheet */}
      <MemberDetailSheet
        member={detailMember}
        onClose={() => setDetailMember(null)}
        onEdit={(m) => { setDetailMember(null); setEditingMember(m); setShowFormDialog(true) }}
      />
    </>
  )
}
