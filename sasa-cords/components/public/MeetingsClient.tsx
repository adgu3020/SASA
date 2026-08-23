'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock } from 'lucide-react'

interface Meeting {
  id: string
  title: string
  date: string
  description?: string | null
  semester?: { name: string } | null
}

interface Props {
  upcoming: Meeting[]
  past: Meeting[]
}

export default function MeetingsClient({ upcoming, past }: Props) {
  return (
    <div className="overflow-hidden">

      {/* Header */}
      <section className="relative h-56 flex items-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/events/community.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 to-orange-900 opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="relative z-10 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-amber-300 text-xs font-semibold tracking-[0.2em] uppercase mb-2"
          >
            Join Us
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl text-white"
          >
            Meetings
          </motion.h1>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <p className="text-muted-foreground text-center mb-12">
          Come hang out with us! All meetings are open to everyone.
        </p>

        {/* Upcoming */}
        <section className="mb-14">
          <h2 className="font-serif text-2xl text-foreground mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-amber-500" />
            Upcoming
          </h2>

          {upcoming.length === 0 ? (
            <div className="glass-card p-10 text-center text-muted-foreground text-sm">
              No upcoming meetings scheduled yet. Check back soon!
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((meeting, i) => (
                <motion.div
                  key={meeting.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="glass-card p-5 border-l-4 border-l-amber-400 flex items-start gap-4 hover:shadow-md transition-all"
                >
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
                </motion.div>
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
    </div>
  )
}