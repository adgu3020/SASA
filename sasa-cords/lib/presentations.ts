export interface Presentation { url: string; embedUrl: string; title: string }
// Exact provider origins and paths only; HTML, scripts, credentials, and custom ports are rejected.
export function presentationFromUrl(value: string): Presentation {
  if (typeof value !== 'string' || value.length > 2048) throw new Error('Invalid presentation URL')
  let u: URL
  try { u = new URL(value.trim()) } catch { throw new Error('Enter a full HTTPS presentation URL') }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) throw new Error('Use a trusted HTTPS presentation URL')
  if (u.hostname === 'docs.google.com') {
    const match = u.pathname.match(/^\/presentation\/d\/(e\/)?([A-Za-z0-9_-]+)(?:\/(?:edit|view|preview|embed|pub))?\/?$/)
    if (!match) throw new Error('Enter a Google Slides presentation link')
    const path = `/presentation/d/${match[1] ?? ''}${match[2]}`
    return { url: `https://docs.google.com${path}/${match[1] ? 'pub' : 'edit'}`, embedUrl: `https://docs.google.com${path}/${match[1] ? 'embed' : 'preview'}`, title: 'Google Slides' }
  }
  if (u.hostname === 'www.canva.com') {
    const match = u.pathname.match(/^\/design\/([A-Za-z0-9_-]+)(?:\/([A-Za-z0-9_-]+))?\/view\/?$/)
    if (match) {
      const url = `https://www.canva.com${u.pathname.replace(/\/$/, '')}`
      return { url, embedUrl: `${url}?embed`, title: 'Canva presentation' }
    }
  }
  throw new Error('Supported providers: Google Slides and Canva view links')
}
export function parsePresentations(values: unknown): Presentation[] {
  if (!Array.isArray(values) || values.length > 5) throw new Error('Add at most five presentation URLs')
  return values.map(v => presentationFromUrl(typeof v === 'string' ? v : v?.url))
}
