'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MemberWithSemesters, Semester, MemberSemester } from '@/types'
import { apiFetch } from '@/lib/api-client'

interface Props {
  open: boolean
  member: MemberWithSemesters | null
  semesters: Semester[]
  onClose: () => void
  onSaved: (member: MemberWithSemesters) => void
}

type FormData = {
  full_name: string
  email: string
  graduation_year: string
  major: string
  is_active: boolean
  admin_notes: string
  admin_override: boolean
  eligibility_status: string
}

export default function MemberFormDialog({ open, member, semesters, onClose, onSaved }: Props) {
  const isEdit = !!member

  const [form, setForm] = useState<FormData>({
    full_name: '',
    email: '',
    graduation_year: String(new Date().getFullYear() + 1),
    major: '',
    is_active: true,
    admin_notes: '',
    admin_override: false,
    eligibility_status: 'pending',
  })

  const [semesterRecords, setSemesterRecords] = useState<
    { semester_id: string; meetings_attended: string; meetings_total: string; events_attended: string; tasks_completed: string; volunteer_hours: string; held_leadership: boolean; leadership_role: string }[]
  >([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addSemesterId, setAddSemesterId] = useState('')

  useEffect(() => {
    if (member) {
      setForm({
        full_name: member.full_name,
        email: member.email,
        graduation_year: String(member.graduation_year),
        major: member.major ?? '',
        is_active: member.is_active,
        admin_notes: member.admin_notes ?? '',
        admin_override: member.admin_override,
        eligibility_status: member.eligibility_status,
      })
      setSemesterRecords(
        (member.member_semesters ?? []).map(s => ({
          semester_id: s.semester_id,
          meetings_attended: String(s.meetings_attended),
          meetings_total: String(s.meetings_total),
          events_attended: String(s.events_attended),
          tasks_completed: String(s.tasks_completed),
          volunteer_hours: String(s.volunteer_hours),
          held_leadership: s.held_leadership,
          leadership_role: s.leadership_role ?? '',
        }))
      )
    } else {
      setForm({
        full_name: '', email: '', graduation_year: String(new Date().getFullYear() + 1),
        major: '', is_active: true, admin_notes: '', admin_override: false, eligibility_status: 'pending',
      })
      setSemesterRecords([])
    }
    setError(null)
  }, [member, open])

  function addSemester() {
    if (!addSemesterId) return
    if (semesterRecords.find(s => s.semester_id === addSemesterId)) return
    setSemesterRecords(prev => [...prev, {
      semester_id: addSemesterId,
      meetings_attended: '0', meetings_total: '0',
      events_attended: '0', tasks_completed: '0',
      volunteer_hours: '0', held_leadership: false, leadership_role: '',
    }])
    setAddSemesterId('')
  }

  function updateSemesterRecord(idx: number, field: string, value: string | boolean) {
    setSemesterRecords(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  function removeSemester(idx: number) {
    setSemesterRecords(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const payload = {
      ...form,
      graduation_year: Number(form.graduation_year),
      semester_records: semesterRecords.map(s => ({
        ...s,
        meetings_attended: Number(s.meetings_attended),
        meetings_total: Number(s.meetings_total),
        events_attended: Number(s.events_attended),
        tasks_completed: Number(s.tasks_completed),
        volunteer_hours: Number(s.volunteer_hours),
      })),
    }

    const res = await apiFetch(
      isEdit ? `/api/members/${member!.id}` : '/api/members',
      {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      }
    )

    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Something went wrong')
      setSaving(false)
      return
    }

    onSaved(json.data)
    setSaving(false)
  }

  const getSemesterName = (id: string) =>
    semesters.find(s => s.id === id)?.name ?? id

  const availableSemesters = semesters.filter(
    s => !semesterRecords.find(r => r.semester_id === s.id)
  )

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card glow-saffron">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                <h2 className="font-serif text-xl">
                  {isEdit ? 'Edit Member' : 'Add New Member'}
                </h2>
                <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <section>
                  <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Full Name" required>
                      <input
                        type="text"
                        value={form.full_name}
                        onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                        required
                        className="input-field"
                        placeholder="Jane Doe"
                      />
                    </Field>
                    <Field label="Email" required>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        required
                        className="input-field"
                        placeholder="jane@university.edu"
                      />
                    </Field>
                    <Field label="Graduation Year" required>
                      <input
                        type="number"
                        value={form.graduation_year}
                        onChange={e => setForm(f => ({ ...f, graduation_year: e.target.value }))}
                        required
                        min={2020}
                        max={2035}
                        className="input-field"
                      />
                    </Field>
                    <Field label="Major">
                      <input
                        type="text"
                        value={form.major}
                        onChange={e => setForm(f => ({ ...f, major: e.target.value }))}
                        className="input-field"
                        placeholder="Computer Science"
                      />
                    </Field>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={form.is_active}
                      onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <label htmlFor="is_active" className="text-sm text-muted-foreground">Active member</label>
                  </div>
                </section>

                {/* Semester Activity */}
                <section>
                  <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
                    Semester Activity
                  </h3>

                  {semesterRecords.length === 0 && (
                    <p className="text-sm text-muted-foreground mb-3">No semesters added yet.</p>
                  )}

                  <div className="space-y-4">
                    {semesterRecords.map((record, idx) => (
                      <div key={record.semester_id} className="bg-secondary/40 rounded-lg p-4 border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-foreground">
                            {getSemesterName(record.semester_id)}
                          </p>
                          <button type="button" onClick={() => removeSemester(idx)} className="text-muted-foreground hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { label: 'Meetings Attended', field: 'meetings_attended' },
                            { label: 'Total Meetings', field: 'meetings_total' },
                            { label: 'Events Attended', field: 'events_attended' },
                            { label: 'Tasks Completed', field: 'tasks_completed' },
                            { label: 'Volunteer Hours', field: 'volunteer_hours' },
                          ].map(({ label, field }) => (
                            <Field key={field} label={label}>
                              <input
                                type="number"
                                min={0}
                                step={field === 'volunteer_hours' ? '0.5' : '1'}
                                value={(record as any)[field]}
                                onChange={e => updateSemesterRecord(idx, field, e.target.value)}
                                className="input-field"
                              />
                            </Field>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`leadership-${idx}`}
                            checked={record.held_leadership}
                            onChange={e => updateSemesterRecord(idx, 'held_leadership', e.target.checked)}
                          />
                          <label htmlFor={`leadership-${idx}`} className="text-sm text-muted-foreground">
                            Held leadership
                          </label>
                          {record.held_leadership && (
                            <input
                              type="text"
                              value={record.leadership_role}
                              onChange={e => updateSemesterRecord(idx, 'leadership_role', e.target.value)}
                              placeholder="Role (e.g. President)"
                              className="input-field ml-2 flex-1"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add semester */}
                  {availableSemesters.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      <select
                        value={addSemesterId}
                        onChange={e => setAddSemesterId(e.target.value)}
                        className="input-field flex-1"
                      >
                        <option value="">Select semester to add…</option>
                        {availableSemesters.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={addSemester}
                        disabled={!addSemesterId}
                        className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all"
                      >
                        <Plus size={14} />
                        Add
                      </button>
                    </div>
                  )}
                </section>

                {/* Admin Override */}
                <section>
                  <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
                    Admin Controls
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="admin_override"
                        checked={form.admin_override}
                        onChange={e => setForm(f => ({ ...f, admin_override: e.target.checked }))}
                      />
                      <label htmlFor="admin_override" className="text-sm text-muted-foreground">
                        Manual eligibility override
                      </label>
                    </div>

                    {form.admin_override && (
                      <Field label="Override Status">
                        <select
                          value={form.eligibility_status}
                          onChange={e => setForm(f => ({ ...f, eligibility_status: e.target.value }))}
                          className="input-field"
                        >
                          <option value="pending">Pending</option>
                          <option value="eligible">Eligible</option>
                          <option value="not_eligible">Not Eligible</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </Field>
                    )}

                    <Field label="Admin Notes">
                      <textarea
                        value={form.admin_notes}
                        onChange={e => setForm(f => ({ ...f, admin_notes: e.target.value }))}
                        rows={2}
                        className="input-field resize-none"
                        placeholder="Internal notes (not visible to student)"
                      />
                    </Field>
                  </div>
                </section>

                {error && (
                  <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground transition-all">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 text-sm rounded-lg bg-amber-400 text-navy-900 font-semibold hover:bg-amber-300 disabled:opacity-60 transition-all"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Member'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-muted-foreground">
        {label}{required && <span className="text-amber-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
