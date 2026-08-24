'use client'

import { motion } from 'framer-motion'
import { Heart, Star, Globe, Users } from 'lucide-react'

const CULTURE_ITEMS = [
  {
    title: 'Garba & Dance',
    desc:  'Annual Garba nights celebrating Navratri with traditional dance and music.',
    image: '/images/events/garba.jpg',
    grad:  'from-orange-500 to-red-600',
    emoji: '🪔',
  },
  {
    title: 'SASA Show',
    desc:  'Our flagship cultural showcase featuring performances from across South Asia.',
    image: '/images/events/sasa-show.jpg',
    grad:  'from-pink-500 to-purple-600',
    emoji: '🎭',
  },
  {
    title: 'Food & Festivals',
    desc:  'Celebrating cuisines and traditions from India, Pakistan, Bangladesh, Sri Lanka, and beyond.',
    image: '/images/events/community.jpg',
    grad:  'from-amber-500 to-orange-600',
    emoji: '🍛',
  },
  {
    title: 'Community Service',
    desc:  'Giving back through tabling, volunteering, and campus engagement initiatives.',
    image: '/images/events/tabling.jpg',
    grad:  'from-emerald-500 to-teal-600',
    emoji: '🌿',
  },
]

export default function AboutPage() {
  return (
    <div className="overflow-hidden">

      {/* ── Header Hero ─────────────────────────────────────────── */}
      <section className="relative h-[50vh] min-h-[360px] flex items-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/about-hero.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-orange-900 to-red-900 opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-amber-300 text-sm font-semibold tracking-[0.2em] uppercase mb-3"
          >
            Our Story
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-serif text-5xl sm:text-6xl text-white"
          >
            About SASA
          </motion.h1>
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start"
          >
            <div className="lg:col-span-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-5">
                <Star size={22} className="text-amber-600" />
              </div>
              <h2 className="font-serif text-3xl text-foreground mb-4">Our Mission</h2>
              <div className="w-12 h-1 bg-amber-400 rounded-full" />
            </div>
            <div className="lg:col-span-3">
              <p className="text-muted-foreground leading-relaxed text-lg mb-5">
                SASA exists to create an inclusive environment where South Asian students and allies
                can come together to celebrate culture, support one another, and build lasting
                friendships.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We strive to educate the broader campus community about the diversity and richness
                of South Asian traditions, food, music, and art — bringing a piece of home to CU
                Boulder for every member of our community.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Culture Grid ─────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-stone-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5">
              <Globe size={22} className="text-amber-600" />
            </div>
            <h2 className="font-serif text-4xl text-foreground mb-3">Our Culture</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From dance to food to community service — SASA is about bringing South Asian
              culture to life on campus.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {CULTURE_ITEMS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative aspect-video rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${item.image})` }}
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${item.grad} opacity-30`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                <div className="absolute inset-0 p-7 flex flex-col justify-end">
                  <span className="text-3xl mb-2">{item.emoji}</span>
                  <h3 className="font-serif text-2xl text-white mb-1">{item.title}</h3>
                  <p className="text-white/75 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Membership Banner ────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-orange-800 to-red-900" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: 'url(/images/hero.jpg)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-3xl mx-auto px-4 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
            <Heart size={26} className="text-amber-300" />
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl text-white mb-5">
            Everyone is welcome
          </h2>
          <p className="text-white/75 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            SASA is open to all CU Boulder students regardless of background. Whether you're
            South Asian, curious about the culture, or just looking for a welcoming community —
            come as you are.
          </p>
          <div className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-amber-400 text-black font-bold text-sm hover:bg-amber-300 transition-all cursor-pointer">
            <Users size={16} />
            Find Your Community
          </div>
        </motion.div>
      </section>

    </div>
  )
}