'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { BOARD_MEMBERS } from '@/lib/board.config'
import { getInitials } from '@/lib/utils'

export default function BoardPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="font-serif text-5xl text-foreground mb-4">Meet the Board</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          The dedicated students who make SASA happen every semester.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {BOARD_MEMBERS.map((member, i) => (
          <motion.div
            key={member.name + member.role}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card p-6 text-center hover:shadow-md hover:border-amber-200 transition-all"
          >
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden border-2 border-amber-200 bg-amber-50 flex items-center justify-center">
              {member.image ? (
                <Image
                  src={member.image}
                  alt={member.name}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                <span className="font-serif text-2xl text-amber-600">
                  {getInitials(member.name)}
                </span>
              )}
            </div>

            <h3 className="font-serif text-xl text-foreground">{member.name}</h3>
            <p className="text-sm font-semibold text-amber-600 mt-0.5 mb-2">{member.role}</p>
            {member.bio && (
              <p className="text-xs text-muted-foreground leading-relaxed">{member.bio}</p>
            )}
            {member.email && (
              <a
                href={`mailto:${member.email}`}
                className="text-xs text-amber-600 hover:text-amber-700 mt-3 inline-block transition-colors"
              >
                {member.email}
              </a>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}