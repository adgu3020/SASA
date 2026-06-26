'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Users, Calendar, Heart, Star } from 'lucide-react'
import { useRef } from 'react'

const EVENTS = [
  {
    title:    'Garba Night',
    desc:     'Annual Navratri celebration with traditional dance, music, and color.',
    image:    '/images/events/garba.jpg',
    fallback: 'from-orange-400 to-red-500',
    emoji:    '🪔',
  },
  {
    title:    'SASA Show',
    desc:     'Our flagship cultural showcase — performances, fashion, and food.',
    image:    '/images/events/sasa-show.jpg',
    fallback: 'from-pink-500 to-purple-600',
    emoji:    '🎭',
  },
  {
    title:    'Tabling',
    desc:     'Connecting with campus, spreading awareness, and welcoming new members.',
    image:    '/images/events/tabling.jpg',
    fallback: 'from-amber-400 to-orange-500',
    emoji:    '🌿',
  },
  {
    title:    'Community',
    desc:     'Hangouts, study sessions, and building friendships that last a lifetime.',
    image:    '/images/events/community.jpg',
    fallback: 'from-emerald-400 to-teal-500',
    emoji:    '🤝',
  },
]

const STATS = [
  { value: '100+', label: 'Active Members' },
  { value: '10+',  label: 'Years at CU' },
  { value: '4',    label: 'Annual Events' },
  { value: '1',    label: 'Community' },
]

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <div className="overflow-hidden">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">

        {/* Background image with parallax */}
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(/images/hero.jpg)' }}
          />
          {/* Fallback gradient shown if image doesn't load */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-orange-800 to-red-900" />
          {/* Dark overlay for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </motion.div>

        {/* Hero content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-24 h-24 rounded-full border-2 border-white/40 overflow-hidden bg-white/10 backdrop-blur-sm mx-auto mb-8 flex items-center justify-center shadow-2xl"
          >
            <img
              src="/images/SASALogo.svg"
              alt="SASA"
              style={{ width: '144px', height: '144px', marginTop: '21px', maxWidth: 'none' }}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-amber-300 text-sm font-semibold tracking-[0.25em] uppercase mb-4"
          >
            University of Colorado Boulder
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="font-serif text-5xl sm:text-6xl lg:text-8xl text-white leading-[1.05] mb-6"
          >
            South Asian<br />
            <span className="text-amber-300">Student</span><br />
            Association
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-white/80 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Celebrating culture, building community, and creating memories at CU Boulder.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/about"
              className="px-8 py-3.5 rounded-full bg-amber-400 text-black font-bold text-sm tracking-wide hover:bg-amber-300 transition-all shadow-lg hover:shadow-amber-400/30 hover:scale-105"
            >
              Discover SASA
            </Link>
            <Link
              href="/meetings"
              className="px-8 py-3.5 rounded-full bg-white/10 backdrop-blur-sm text-white font-semibold text-sm border border-white/30 hover:bg-white/20 transition-all"
            >
              Upcoming Meetings
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/50 text-xs tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-px h-10 bg-gradient-to-b from-white/50 to-transparent"
          />
        </motion.div>
      </section>

      {/* ── Stats Banner ─────────────────────────────────────────── */}
      <section className="bg-amber-400 py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <p className="font-serif text-4xl font-bold text-black">{stat.value}</p>
              <p className="text-black/70 text-sm font-medium mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Events Showcase ──────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-amber-600 text-sm font-semibold tracking-[0.2em] uppercase mb-3">What We Celebrate</p>
            <h2 className="font-serif text-4xl sm:text-5xl text-foreground">Our Events</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {EVENTS.map((event, i) => (
              <motion.div
                key={event.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
              >
                {/* Photo */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${event.image})` }}
                />
                {/* Gradient fallback */}
                <div className={`absolute inset-0 bg-gradient-to-br ${event.fallback} opacity-80`} />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <span className="text-3xl mb-2">{event.emoji}</span>
                  <h3 className="font-serif text-xl text-white font-semibold">{event.title}</h3>
                  <p className="text-white/70 text-xs mt-1 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-h-0 group-hover:max-h-20 overflow-hidden">
                    {event.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission Split ─────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-stone-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: 'url(/images/about-hero.jpg)' }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-amber-900/60 to-red-900/40 rounded-3xl" />
            </div>
            {/* Decorative card */}
            <div className="absolute -bottom-6 -right-6 bg-amber-400 rounded-2xl p-5 shadow-xl">
              <Heart size={28} className="text-black" />
              <p className="font-serif text-2xl font-bold text-black mt-1">Since 2010</p>
              <p className="text-black/70 text-xs">Building community at CU</p>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-amber-600 text-sm font-semibold tracking-[0.2em] uppercase mb-4">Who We Are</p>
            <h2 className="font-serif text-4xl sm:text-5xl text-foreground mb-6 leading-tight">
              A home away<br />from home
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              SASA is more than an organization — it's a family. We bring together South Asian students
              and allies at CU Boulder to celebrate our heritage, support one another, and create
              experiences that last a lifetime.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Whether you're deeply connected to South Asian culture or just curious to learn more,
              there's a place for you here. Come as you are.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/about"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-amber-400 text-black font-bold text-sm hover:bg-amber-500 transition-all"
              >
                Our Story <ArrowRight size={15} />
              </Link>
              <Link
                href="/board"
                className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-amber-200 text-amber-700 font-semibold text-sm hover:bg-amber-50 transition-all"
              >
                <Users size={15} /> Meet the Board
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Full-width Photo Banner ───────────────────────────────── */}
      <section className="relative h-80 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: 'url(/images/events/sasa-show.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/80 to-red-900/70" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-amber-300 text-sm font-semibold tracking-[0.2em] uppercase mb-3">Every Semester</p>
            <h2 className="font-serif text-4xl sm:text-5xl text-white mb-6">
              Something to celebrate
            </h2>
            <Link
              href="/meetings"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-amber-400 text-black font-bold text-sm hover:bg-amber-300 transition-all"
            >
              See What's Coming <ArrowRight size={15} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Newsletter CTA ───────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-6">
            <Star size={24} className="text-amber-600" />
          </div>
          <h2 className="font-serif text-4xl text-foreground mb-4">Stay in the loop</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Get updates on meetings, events, and SASA news delivered straight to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/newsletter"
              className="px-8 py-3.5 rounded-full bg-amber-400 text-black font-bold text-sm hover:bg-amber-500 transition-all"
            >
              Subscribe to Newsletter
            </Link>
            <Link
              href="/meetings"
              className="px-8 py-3.5 rounded-full border-2 border-amber-200 text-amber-700 font-semibold text-sm hover:bg-amber-50 transition-all"
            >
              View Meetings
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  )
}