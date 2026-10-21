'use client'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
const empty = { name:'', role:'', bio:'', instagram:'', display_order:0, is_visible:true }
export default function BoardManager() {
  const [members,setMembers] = useState<any[]>([])
  const [editing,setEditing] = useState<any>(null)
  const [form,setForm] = useState(empty)
  const [file,setFile] = useState<File | null>(null)
  const [removePhoto,setRemovePhoto] = useState(false)
  const [busy,setBusy] = useState(false)
  const [notice,setNotice] = useState('')
  const [error,setError] = useState('')
  const [open,setOpen] = useState(false)
  async function load() {
    const res = await apiFetch('/api/board'); const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Unable to load board members')
    setMembers(json.data)
  }
  useEffect(() => { load().catch(e => setError(e.message)) }, [])
  function edit(member: any) {
    setEditing(member); setForm(member ? { ...member, instagram: member.instagram ?? '', bio: member.bio ?? '' } : empty)
    setFile(null); setRemovePhoto(false); setError(''); setOpen(true)
  }
  async function cleanup(path: string) {
    const res = await apiFetch('/api/board/photos',{ method:'DELETE',body:JSON.stringify({path}) })
    if (!res.ok) setNotice('Member saved. An unused photo could not be removed. Retry cleanup later in Storage.')
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('')
    let uploaded: string | null = null
    let committed = false
    try {
      let photo: { photo_path?: string | null } = removePhoto ? { photo_path:null } : {}
      if (file) {
        if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5*1024*1024) throw new Error('Choose a JPEG, PNG, or WebP photo under 5 MB')
        const fd = new FormData(); fd.set('file',file)
        const res = await apiFetch('/api/board/photos',{method:'POST',body:fd})
        const json = await res.json(); if (!res.ok) throw new Error(json.error)
        uploaded = json.data.path; photo = { photo_path:uploaded }
      }
      const res = await apiFetch(editing ? `/api/board/${editing.id}` : '/api/board',{
        method:editing ? 'PUT':'POST',body:JSON.stringify({...form,...photo}),
      })
      const json = await res.json(); if (!res.ok) throw new Error(json.error)
      committed = true
      setNotice('Board member saved.'); setOpen(false)
      if ((uploaded || removePhoto) && editing?.photo_path) await cleanup(editing.photo_path)
      await load()
    } catch(e) {
      setError((e as Error).message)
      if (uploaded && !committed) await cleanup(uploaded).catch(() => {})
    } finally { setBusy(false) }
  }
  async function hide(id: string) {
    if (!confirm('Hide this person from the public board page?')) return
    setBusy(true); setError('')
    try {
      const res = await apiFetch(`/api/board/${id}`,{method:'DELETE'})
      const json = await res.json(); if (!res.ok) throw new Error(json.error)
      await load(); setNotice('Board member hidden. You can restore them by editing their visibility.')
    } catch(e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <div className="space-y-4">
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
    <button disabled={busy} onClick={() => edit(null)} className="px-4 py-2 rounded-lg bg-amber-400 text-white">Add Board Member</button>
    <div className="glass-card divide-y divide-border">{members.map(m => <div key={m.id} className="p-4 flex flex-wrap items-center gap-3">
      <div className="flex-1"><p className="font-semibold">{m.name}</p><p className="text-sm text-muted-foreground">{m.role} · Order {m.display_order} · {m.is_visible ? 'Visible':'Hidden'}</p></div>
      <button disabled={busy} onClick={() => edit(m)} className="text-amber-700">Edit</button>
      {m.is_visible && <button disabled={busy} onClick={() => hide(m.id)} className="text-red-600">Hide</button>}
    </div>)}</div>
    {open && <form onSubmit={save} className="glass-card p-6 space-y-4">
      <h2 className="font-serif text-xl">{editing ? 'Edit':'Add'} Board Member</h2>
      {(['name','role','instagram'] as const).map(key => <label key={key} className="block text-sm capitalize">{key}
        <input required={key!=='instagram'} maxLength={key==='instagram'?200:150} value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})} className="input-field mt-1" />
      </label>)}
      <p className="text-xs text-muted-foreground">Instagram accepts a username, @handle, or HTTPS profile link.</p>
      <label className="block text-sm">Description<textarea rows={4} maxLength={5000} className="input-field mt-1" value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} /></label>
      <label className="block text-sm">Display order (lower numbers first)<input type="number" required min={0} max={10000} className="input-field mt-1" value={form.display_order} onChange={e=>setForm({...form,display_order:Number(e.target.value)})} /></label>
      <label className="block text-sm"><input type="checkbox" checked={form.is_visible} onChange={e=>setForm({...form,is_visible:e.target.checked})} /> Show on the public board page</label>
      <label className="block text-sm">Photo (JPEG, PNG, WebP, up to 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" className="block mt-2 text-sm" onChange={e=>setFile(e.target.files?.[0] ?? null)} /></label>
      {editing && <label className="block text-sm"><input type="checkbox" checked={removePhoto} onChange={e=>setRemovePhoto(e.target.checked)} /> Remove current photo</label>}
      <div className="flex gap-3"><button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-amber-400 text-white disabled:opacity-50">{busy?'Saving…':'Save Member'}</button><button type="button" disabled={busy} onClick={()=>setOpen(false)}>Cancel</button></div>
    </form>}
  </div>
}
