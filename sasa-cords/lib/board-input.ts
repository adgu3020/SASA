export function instagramHandle(value: string): string | null {
  const v = value.trim()
  if (!v) return null
  let handle = v.replace(/^@/, '')
  if (/^https?:/i.test(v)) {
    let u: URL
    try { u = new URL(v) } catch { throw new Error('Invalid Instagram profile') }
    if (u.protocol !== 'https:' || !['instagram.com','www.instagram.com'].includes(u.hostname) || u.username || u.password || u.port || u.search || u.hash) throw new Error('Use an Instagram username or HTTPS profile link')
    const match = u.pathname.match(/^\/([A-Za-z0-9._]+)\/?$/)
    if (!match) throw new Error('Enter a profile link, not an Instagram post')
    handle = match[1]
  }
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle) || ['p','reel','reels','stories','explore','accounts','direct'].includes(handle.toLowerCase())) throw new Error('Invalid Instagram username')
  return handle.toLowerCase()
}
export function boardInput(body: any) {
  for (const key of ['name','role']) {
    if (typeof body?.[key] !== 'string' || !body[key].trim() || body[key].length > 150) throw new Error(`Enter a valid ${key}`)
  }
  if (body.bio != null && (typeof body.bio !== 'string' || body.bio.length > 5000)) throw new Error('Description is too long')
  if (!Number.isInteger(body.display_order) || body.display_order < 0 || body.display_order > 10000) throw new Error('Enter a display order from 0 to 10000')
  if (body.photo_path && !/^uploads\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(body.photo_path)) throw new Error('Invalid photo')
  return { name: body.name.trim(), role: body.role.trim(), bio: body.bio?.trim() || null,
    instagram: instagramHandle(body.instagram ?? ''), display_order: body.display_order,
    is_visible: body.is_visible !== false, ...(Object.prototype.hasOwnProperty.call(body,'photo_path') && { photo_path: body.photo_path || null }) }
}
