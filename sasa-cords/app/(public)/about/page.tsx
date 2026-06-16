'use client'

import { motion } from 'framer-motion'
import { Heart, Star, Globe } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="font-serif text-5xl text-foreground mb-4">About SASA</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          The South Asian Student Association at CU Boulder is a cultural and social organization
          dedicated to fostering community and celebrating South Asian heritage.
        </p>
      </motion.div>

      {/* Mission */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-8 sm:p-10"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Star size={18} className="text-amber-600" />
          </div>
          <h2 className="font-serif text-2xl text-foreground">Our Mission</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed text-base">
          SASA exists to create an inclusive environment where South Asian students and allies can
          come together to celebrate culture, support one another, and build lasting friendships.
          We strive to educate the broader campus community about the diversity and richness of
          South Asian traditions, food, music, and art.
        </p>
      </motion.section>

      {/* Culture */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Globe size={18} className="text-amber-600" />
          </div>
          <h2 className="font-serif text-2xl text-foreground">Our Culture</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: 'Garba & Dance',      desc: 'Annual Garba nights celebrating Navratri with traditional dance and music.' },
            { title: 'SASA Show',          desc: 'Our flagship cultural showcase featuring performances from across South Asia.' },
            { title: 'Food & Festivals',   desc: 'Food events celebrating cuisines from India, Pakistan, Bangladesh, Sri Lanka, and beyond.' },
            { title: 'Community Service',  desc: 'Giving back through tabling, volunteering, and campus engagement initiatives.' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="glass-card p-5"
            >
              <h3 className="font-semibold text-foreground mb-1.5">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Membership */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-8 sm:p-10 border-l-4 border-l-amber-400"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Heart size={18} className="text-amber-600" />
          </div>
          <h2 className="font-serif text-2xl text-foreground">Membership</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          SASA is open to all CU Boulder students regardless of background. Whether you're South Asian,
          curious about the culture, or just looking for a welcoming community — you're always welcome
          at our meetings. Come as you are.
        </p>
      </motion.section>
    </div>
  )
}