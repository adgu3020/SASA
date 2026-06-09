import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'SASA Cords — Eligibility Portal',
  description: 'South Asian Student Association Graduation Cord Eligibility Platform',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="grain min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
