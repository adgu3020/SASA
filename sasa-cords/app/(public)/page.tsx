'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Users, Calendar, Heart } from 'lucide-react'

const fadeUp = {
  initial:   { opacity: 0, y: 24 },
  animate:   { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center justify-center text-center px-4">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-amber-400/10 blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto relative"
        >
          {/* Logo */}
          <div className="w-24 h-24 rounded-full border-2 border-amber-200 overflow-hidden bg-white mx-auto mb-8 flex items-center justify-center shadow-lg">
            <img
              src="/images/SASALogo.svg"
              alt="SASA"
              style={{ width: '175px', height: '175px', marginTop: '21px', maxWidth: 'none' }}
            />
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-foreground leading-tight mb-4">
            South Asian<br />Student Association
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Celebrating South Asian culture, community, and identity at the University of Colorado Boulder.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/about"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-400 text-white font-semibold hover:bg-amber-500 transition-all shadow-md hover:shadow-lg"
            >
              Learn More
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/meetings"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-amber-200 text-amber-700 font-semibold hover:bg-amber-50 transition-all"
            >
              <Calendar size={16} />
              Upcoming Meetings
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── What We Do ────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-3">What We Do</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              SASA is a space for South Asian students to connect, celebrate, and thrive.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon:  Users,
                title: 'Community',
                desc:  'A welcoming space for South Asian students and allies to connect, share, and support one another throughout the year.',
              },
              {
                icon:  Heart,
                title: 'Culture',
                desc:  'From Garba nights to Diwali celebrations, we bring South Asian traditions and culture to campus in a vibrant way.',
              },
              {
                icon:  Calendar,
                title: 'Events',
                desc:  'Regular general body meetings, cultural showcases, volunteering opportunities, and social events throughout the semester.',
              },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="glass-card p-6 text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                    <Icon size={22} className="text-amber-600" />
                  </div>
                  <h3 className="font-serif text-xl text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">
              Ready to get involved?
            </h2>
            <p className="text-muted-foreground mb-8">
              Come to one of our meetings, follow us on Instagram, or sign up for our newsletter.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/meetings"
                className="px-6 py-3 rounded-xl bg-amber-400 text-white font-semibold hover:bg-amber-500 transition-all"
              >
                See Upcoming Meetings
              </Link>
              <Link
                href="/newsletter"
                className="px-6 py-3 rounded-xl border-2 border-amber-200 text-amber-700 font-semibold hover:bg-amber-50 transition-all"
              >
                Subscribe to Newsletter
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}