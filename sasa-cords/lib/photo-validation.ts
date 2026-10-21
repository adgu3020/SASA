export function photoExtension(type: string, size: number, bytes: Uint8Array): string {
  if (size <= 0 || size > 5 * 1024 * 1024) throw new Error('Photos must be under 5 MB')
  const png = bytes[0]===137 && bytes[1]===80 && bytes[2]===78 && bytes[3]===71 && bytes[4]===13 && bytes[5]===10 && bytes[6]===26 && bytes[7]===10
  const jpg = bytes[0]===255 && bytes[1]===216 && bytes[2]===255
  const webp = new TextDecoder().decode(bytes.slice(0,4))==='RIFF' && new TextDecoder().decode(bytes.slice(8,12))==='WEBP'
  if (type==='image/png' && png) return 'png'
  if (type==='image/jpeg' && jpg) return 'jpg'
  if (type==='image/webp' && webp) return 'webp'
  throw new Error('Upload a JPEG, PNG, or WebP image')
}
