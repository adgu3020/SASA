'use client'
import { presentationFromUrl } from '@/lib/presentations'
export default function PresentationViewer({ presentations }: { presentations?: { url: string }[] }) {
  if (!presentations?.length) return null
  return <div className="space-y-4 mt-4 w-full">{presentations.map((p, i) => {
    let safe
    try { safe = presentationFromUrl(p.url) } catch { return <p key={i} className="text-sm text-muted-foreground">This presentation link is unavailable. Please contact SASA.</p> }
    return <details key={`${safe.url}-${i}`} className="rounded-xl border border-amber-200 p-3">
      <summary className="cursor-pointer text-sm text-amber-700">{safe.title} {presentations.length > 1 ? i+1 : ''}</summary>
      <iframe src={safe.embedUrl} title={`${safe.title} ${i+1}`} loading="lazy" className="w-full aspect-video rounded-lg mt-3 border-0" sandbox="allow-scripts allow-same-origin allow-presentation" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      <p className="text-xs text-muted-foreground mt-2">If the viewer is blocked or asks for access, <a className="text-amber-700 underline" href={safe.url} target="_blank" rel="noopener noreferrer">open the presentation in a new tab</a>.</p>
    </details>
  })}</div>
}
