import { parsePresentations } from './presentations'
export function meetingInput(body: any) {
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  if (!title || title.length > 200) throw new Error('Enter a meeting title (up to 200 characters)')
  if (typeof body.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.date) || !Number.isFinite(Date.parse(body.date)) || new Date(body.date).toISOString().slice(0,10) !== body.date) throw new Error('Enter a valid date')
  if (body.time && !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(body.time)) throw new Error('Enter a valid meeting time')
  if (body.semester_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.semester_id)) throw new Error('Invalid semester')
  for (const [key,max] of [['description',5000],['location',300]] as const) {
    if (body[key] != null && (typeof body[key] !== 'string' || body[key].length > max)) throw new Error(`Invalid ${key}`)
  }
  return { title, date: body.date, description: body.description?.trim() || null,
    semester_id: body.semester_id || null, time: body.time || null, location: body.location?.trim() || null,
    presentations: parsePresentations(body.presentations ?? []) }
}
