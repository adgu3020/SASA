'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Instagram } from 'lucide-react'
import { BOARD_MEMBERS } from '@/lib/board.config'
import { getInitials } from '@/lib/utils'

export default function BoardPage() {
  return (
    <div className="overflow-hidden">

      {/* Header */}
      <section className="relative h-52 flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-orange-800 to-red-900" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: 'url(/images/hero.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-8 pb-10">
          <p className="text-amber-300 text-xs font-semibold tracking-[0.2em] uppercase mb-2">
            2025 – 2026
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white">Meet the Board</h1>
        </div>
      </section>

      {/* Board Members List */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16">
        <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto">
          The dedicated students who make SASA happen every semester.
        </p>

        <div className="space-y-0">
          {BOARD_MEMBERS.map((member, i) => (
            <motion.div
              key={member.name + member.role}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              {/* Divider (not before first) */}
              {i > 0 && (
                <div className="h-px bg-border my-12" />
              )}

              <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 items-start">

                {/* Photo */}
                <div className="w-full sm:w-48 shrink-0">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-amber-50 border border-amber-100 shadow-md">
                    {member.image ? (
                      <div
                        className="w-full h-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${member.image})`,
                          backgroundPosition: member.imagePosition || 'center',
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                        <span className="font-serif text-5xl text-amber-500">
                          {getInitials(member.name)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 pt-1">
                  {/* Role */}
                  <p className="text-amber-600 text-sm font-semibold tracking-[0.15em] uppercase mb-2">
                    {member.role}
                  </p>

                  {/* Name */}
                  <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-4 leading-tight">
                    {member.name}
                  </h2>

                  {/* Accent line */}
                  <div className="w-10 h-0.5 bg-amber-400 rounded-full mb-5" />

                  {/* Bio */}
                  {member.bio && (
                    <p className="text-muted-foreground leading-relaxed mb-6 max-w-lg">
                      {member.bio}
                    </p>
                  )}

                  {/* Instagram */}
                  {member.instagram && (
                    <a
                      href={member.instagramUrl ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 hover:border-amber-300 transition-all"
                    >
                      <Instagram size={15} />
                      {member.instagram}
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 pt-12 border-t border-border text-center"
        >
          <p className="text-muted-foreground text-sm">
            Want to get involved or reach out to the board?
          </p>
          <a
            href="mailto:sasa@colorado.edu"
            className="inline-block mt-3 text-amber-600 font-semibold text-sm hover:text-amber-700 transition-colors"
          >
            sasa@colorado.edu →
          </a>
        </motion.div>
      </div>
    </div>
  )
}