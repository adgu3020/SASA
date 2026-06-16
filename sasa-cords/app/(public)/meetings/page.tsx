import { createAdminClient } from '@/lib/supabase/server'
import { Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function MeetingsPage() {
  const admin = createAdminClient()

  const { data: meetings } = await admin
    .from('meetings')
    .select('*, semester:semesters(name)')
    .order('date', { ascending: false })

  const today = new Date().toISOString().split('T')[0]
  const upcoming = (meetings ?? []).filter(m => m.date >= today)
  const past     = (meetings ?? []).filter(m => m.date < today)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="font-serif text-5xl text-foreground mb-4">Meetings</h1>
        <p className="text-muted-foreground">
          Come hang out with us! All meetings are open to everyone.
        </p>
      </div>

      {/* Upcoming */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-foreground mb-5 flex items-center gap-2">
          <Calendar size={20} className="text-amber-500" />
          Upcoming
        </h2>

        {upcoming.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground text-sm">
            No upcoming meetings scheduled yet. Check back soon!
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(meeting => (
              <div
                key={meeting.id}
                className="glass-card p-5 border-l-4 border-l-amber-400 flex items-start gap-4 hover:shadow-md transition-all"
              >
                {/* Date badge */}
                <div className="w-14 h-14 rounded-xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center shrink-0">
                  <p className="text-xs font-bold text-amber-600 leading-none">
                    {new Date(meeting.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                  </p>
                  <p className="text-xl font-bold text-amber-900 leading-none mt-0.5">
                    {new Date(meeting.date + 'T00:00:00').getDate()}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{meeting.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {new Date(meeting.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                    })}
                    {meeting.semester && ` · ${meeting.semester.name}`}
                  </p>
                  {meeting.description && (
                    <p className="text-sm text-muted-foreground mt-1">{meeting.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl text-foreground mb-5 flex items-center gap-2">
            <Clock size={20} className="text-muted-foreground" />
            Past Meetings
          </h2>
          <div className="space-y-2">
            {past.map(meeting => (
              <div
                key={meeting.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-secondary/20 opacity-70"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{meeting.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(meeting.date + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                </div>
                {meeting.semester && (
                  <span className="text-xs text-muted-foreground shrink-0 ml-4">
                    {meeting.semester.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}