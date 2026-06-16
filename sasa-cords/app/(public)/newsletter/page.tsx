'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ExternalLink, CheckCircle2, Loader2, Newspaper } from 'lucide-react'
import { SASA_INFO } from '@/lib/board.config'

interface Campaign {
  id: string
  title: string
  subject: string
  sendTime: string
  archiveUrl: string
  previewText: string
}

export default function NewsletterPage() {
  const [email, setEmail]     = useState('')
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const [campaigns, setCampaigns]       = useState<Campaign[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)

  useEffect(() => {
    fetch('/api/newsletter/campaigns')
      .then(r => r.json())
      .then(({ data }) => setCampaigns(data ?? []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoadingCampaigns(false))
  }, [])

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    const res = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const json = await res.json()

    if (res.ok) {
      setStatus('success')
      setMessage('You\'re subscribed! Welcome to the SASA community.')
      setEmail('')
    } else {
      setStatus('error')
      setMessage(json.error ?? 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="font-serif text-5xl text-foreground mb-4">Newsletter</h1>
        <p className="text-muted-foreground leading-relaxed">
          Stay up to date with SASA events, announcements, and community news.
        </p>
      </motion.div>

      {/* Subscribe form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-8 mb-10"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Mail size={18} className="text-amber-600" />
          </div>
          <h2 className="font-serif text-xl text-foreground">Subscribe</h2>
        </div>

        {status === 'success' ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <p className="text-sm font-medium text-emerald-800">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@colorado.edu"
                className="input-field"
              />
            </div>

            {status === 'error' && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-400 text-white font-semibold text-sm hover:bg-amber-500 disabled:opacity-60 transition-all"
            >
              {status === 'loading' && <Loader2 size={14} className="animate-spin" />}
              {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}
      </motion.div>

      {/* Past newsletters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Newspaper size={18} className="text-amber-600" />
          </div>
          <h2 className="font-serif text-xl text-foreground">Past Newsletters</h2>
        </div>

        {loadingCampaigns ? (
          <div className="flex justify-center py-12">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              No newsletters published yet, or newsletter integration isn't set up.
            </p>
            {SASA_INFO.mailchimp && (
              <a
                href={SASA_INFO.mailchimp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-amber-200 text-amber-700 font-semibold text-sm hover:bg-amber-50 transition-all"
              >
                <ExternalLink size={14} />
                View Newsletter Archive
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign, i) => (
              <motion.a
                key={campaign.id}
                href={campaign.archiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 flex items-center justify-between gap-4 hover:shadow-md hover:border-amber-200 transition-all group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-amber-700 transition-colors">
                    {campaign.subject || campaign.title}
                  </p>
                  {campaign.previewText && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {campaign.previewText}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground/60 mt-1.5">
                    {new Date(campaign.sendTime).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                </div>
                <ExternalLink size={16} className="text-muted-foreground group-hover:text-amber-600 transition-colors shrink-0" />
              </motion.a>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}