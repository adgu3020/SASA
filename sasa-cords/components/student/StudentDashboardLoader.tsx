'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import StudentDashboard from './StudentDashboard'

export default function StudentDashboardLoader() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/api/student/me')
      .then(r => r.json())
      .then(({ data, error }) => {
        if (error) setError(error)
        else setData(data)
      })
      .catch(() => setError('Failed to load your dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-amber-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-6 text-center text-red-500">{error}</div>
      </div>
    )
  }

  return <StudentDashboard data={data} onDataRefresh={() => {
    setLoading(true)
    apiFetch('/api/student/me')
      .then(r => r.json())
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false))
  }} />
}