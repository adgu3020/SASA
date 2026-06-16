import Link from 'next/link'
import { Instagram } from 'lucide-react'
import { SASA_INFO } from '@/lib/board.config'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-white/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="font-serif text-lg text-foreground">SASA</p>
            <p className="text-sm text-muted-foreground mt-0.5">{SASA_INFO.fullName}</p>
            <p className="text-sm text-muted-foreground">{SASA_INFO.university}</p>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-3">
            <div className="flex items-center gap-4">
              <Link
                href={SASA_INFO.instagram}
                target="_blank"
                className="text-muted-foreground hover:text-amber-600 transition-colors"
              >
                <Instagram size={18} />
              </Link>
            </div>
            <a
              href={`mailto:${SASA_INFO.email}`}
              className="text-sm text-muted-foreground hover:text-amber-600 transition-colors"
            >
              {SASA_INFO.email}
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} South Asian Student Association. All rights reserved.
          </p>
          <Link
            href="/login"
            className="text-xs text-muted-foreground hover:text-amber-600 transition-colors"
          >
            Member Login
          </Link>
        </div>
      </div>
    </footer>
  )
}