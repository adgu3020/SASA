'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'

interface Semester { id: string; name: string }
interface Props {
  open: boolean
  semesters: Semester[]
  onClose: () => void
  onCreated: (meeting: any) => void
}

export default function CreateMeetingDialog({ open, semesters, onClose, onCreated }: Props) {
  const [title, setTitle]             = useState('')
  const [date, setDate]               = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [semesterId, setSemesterId]   = useState(semesters.find(s => s.id)?.id ?? '')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const res = await apiFetch('/api/meetings', {
      method: 'POST',
      body: JSON.stringify({ title, date, description: description || null, semester_id: semesterId || null }),
    })

    const json = await res.json()
    if (!res.ok) { setError(json.error); setSaving(false); return }

    onCreated(json.data)
    setTitle(''); setDate(new Date().toISOString().split('T')[0])
    setDescription(''); setSaving(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md glass-card">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-serif text-xl">New Meeting</h2>
                <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Meeting Title <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    placeholder="e.g. General Body Meeting"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Date <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Semester
                  </label>
                  <select
                    value={semesterId}
                    onChange={e => setSemesterId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">None</option>
                    {semesters.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Optional notes about this meeting"
                    className="input-field resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground transition-all">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 text-sm rounded-lg bg-amber-400 text-white font-semibold hover:bg-amber-500 disabled:opacity-60 transition-all"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {saving ? 'Creating…' : 'Create Meeting'}
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
