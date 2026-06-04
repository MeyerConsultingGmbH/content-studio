'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, Customer, Post, Comment } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const s: Record<string, React.CSSProperties> = {
  shell: { display: 'flex', minHeight: '100vh' },
  sidebar: { width: 220, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '20px 0' },
  main: { flex: 1, overflowY: 'auto' as const },
  topbar: { padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, background: 'var(--bg)', zIndex: 50 },
  body: { padding: '20px 24px 60px' },
  card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 },
  input: { width: '100%', background: '#0D1014', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: '.6px' },
  btnPrimary: { background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 },
  btnGhost: { background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 },
  btnYellow: { background: 'var(--yellow)', color: '#000', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  btnSm: { padding: '6px 12px', fontSize: 12, borderRadius: 7 },
  btnXs: { padding: '4px 8px', fontSize: 11, borderRadius: 6 },
  g2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  dropZone: { border: '2px dashed var(--border)', borderRadius: 12, padding: '36px 20px', textAlign: 'center' as const, cursor: 'pointer', background: '#09090B' },
  resultBlock: { background: '#0A0D10', border: '1px solid var(--border)', borderRadius: 9, padding: '12px 80px 12px 12px', fontSize: 13, lineHeight: 1.65, color: '#C8D0D8', position: 'relative' as const, whiteSpace: 'pre-wrap' as const },
}

function NavItem({ icon, label, active, badge, onClick }: any) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', cursor: 'pointer', color: active ? 'var(--accent)' : 'var(--muted)', fontSize: 13, fontWeight: 600, borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`, background: active ? 'var(--accent-dim)' : 'transparent', transition: 'all .15s' }}>
      <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
      {label}
      {badge ? <span style={{ marginLeft: 'auto', background: 'var(--accent)', color: '#000', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '1px 7px' }}>{badge}</span> : null}
    </div>
  )
}

function Badge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending: ['#6B778520', '#6B7785'], review: ['#FF900020', '#FF9000'],
    kunde: ['#FFD44720', '#FFD447'], approved: ['#3BFFA020', '#3BFFA0'], rejected: ['#FF575720', '#FF5757'],
  }
  const labels: Record<string, string> = { pending: '⏳ Entwurf', review: '👁 Prüfung', kunde: '📤 Beim Kunden', approved: '✓ Freigegeben', rejected: '✕ Abgelehnt' }
  const [bg, color] = map[status] || map.pending
  return <span style={{ background: bg, color, border: `1px solid ${color}40`, borderRadius: 20, padding: '3px 9px', fontSize: 11, fontWeight: 700 }}>{labels[status] || status}</span>
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button onClick={async () => { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1800) }}
      style={{ position: 'absolute', top: 9, right: 9, padding: '4px 9px', fontSize: 10, borderRadius: 5, background: '#1A1F25', border: '1px solid var(--border)', color: ok ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer' }}>
      {ok ? '✓' : 'Kopieren'}
    </button>
  )
}

// ── Hashtag Picker ─────────────────────────────────────────────────────────────
function HashtagPicker({ tags, selected, onChange }: { tags: string[], selected: string[], onChange: (s: string[]) => void }) {
  const toggle = (t: string) => {
    if (selected.includes(t)) onChange(selected.filter(x => x !== t))
    else if (selected.length < 15) onChange([...selected, t])
  }
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px' }}># Hashtags wählen</div>
        <div style={{ fontSize: 11, color: selected.length >= 15 ? 'var(--accent)' : 'var(--muted)', fontWeight: 600 }}>
          {selected.length}/15 gewählt
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {tags.map((t, i) => {
          const isSelected = selected.includes(t)
          const maxReached = selected.length >= 15 && !isSelected
          return (
            <button key={i} onClick={() => toggle(t)} disabled={maxReached}
              style={{
                background: isSelected ? 'var(--accent)' : '#1A1F25',
                color: isSelected ? '#000' : maxReached ? '#333' : 'var(--muted)',
                border: `1px solid ${isSelected ? 'var(--accent)' : maxReached ? '#222' : 'var(--border)'}`,
                borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
                cursor: maxReached ? 'not-allowed' : 'pointer', transition: 'all .15s'
              }}>
              #{t.replace(/^#/, '')}
            </button>
          )
        })}
      </div>
      {selected.length >= 15 && (
        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 8 }}>✓ Maximum von 15 Hashtags erreicht</div>
      )}
    </div>
  )
}

// ── Cropper ────────────────────────────────────────────────────────────────────
function Cropper({ src, onCrop, onCancel }: { src: string, onCrop: (url: string, b64: string) => void, onCancel: () => void }) {
  const RATIO = 4 / 5
  const wrapRef = useRef<HTMLDivElement>(null)
  const [disp, setDisp] = useState({ w: 1, h: 1 })
  const [nat, setNat] = useState({ w: 1, h: 1 })
  const [box, setBox] = useState({ x: 0, y: 0, w: 100, h: 125 })
  const drag = useRef<any>(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setNat({ w: img.naturalWidth, h: img.naturalHeight })
      const maxW = Math.min(img.naturalWidth, wrapRef.current?.offsetWidth || 400, 520)
      const dh = maxW * img.naturalHeight / img.naturalWidth
      setDisp({ w: maxW, h: dh })
      const bw = Math.min(maxW * 0.85, dh * RATIO), bh = bw / RATIO
      setBox({ x: (maxW - bw) / 2, y: (dh - bh) / 2, w: bw, h: bh })
    }
    img.src = src
  }, [src])

  const getXY = (e: any) => { const t = e.touches ? e.touches[0] : e; const r = wrapRef.current!.getBoundingClientRect(); return { x: t.clientX - r.left, y: t.clientY - r.top } }
  const startMove = (e: any) => { e.preventDefault(); const { x, y } = getXY(e); drag.current = { type: 'move', sx: x, sy: y, ...box } }
  const startResize = (e: any) => { e.preventDefault(); e.stopPropagation(); const { x } = getXY(e); drag.current = { type: 'resize', sx: x, ...box } }
  const onMove = useCallback((e: any) => {
    if (!drag.current) return; e.preventDefault()
    const { x, y } = getXY(e), d = drag.current
    if (d.type === 'move') setBox(b => ({ ...b, x: Math.max(0, Math.min(disp.w - d.w, d.x + (x - d.sx))), y: Math.max(0, Math.min(disp.h - d.h, d.y + (y - d.sy))) }))
    else { const nw = Math.max(50, Math.min(d.w + (x - d.sx), disp.w - d.x, disp.h * RATIO)), nh = nw / RATIO; if (d.y + nh <= disp.h) setBox(b => ({ ...b, w: nw, h: nh })) }
  }, [disp])

  const apply = () => {
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1350
    const ctx = canvas.getContext('2d')!; const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, box.x * nat.w / disp.w, box.y * nat.h / disp.h, box.w * nat.w / disp.w, box.h * nat.h / disp.h, 0, 0, 1080, 1350)
      const url = canvas.toDataURL('image/jpeg', 0.92); onCrop(url, url.split(',')[1])
    }; img.src = src
  }

  return (
    <div ref={wrapRef}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div><div style={{ fontWeight: 700 }}>Zuschneiden <span style={{ color: 'var(--accent)' }}>4:5</span></div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Box ziehen · Ecke skalieren</div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ ...s.btnGhost, ...s.btnSm }}>Abbrechen</button>
          <button onClick={apply} style={{ ...s.btnPrimary, ...s.btnSm }}>✓ Übernehmen</button>
        </div>
      </div>
      <div style={{ position: 'relative', width: disp.w, maxWidth: '100%', height: disp.h, background: '#000', borderRadius: 10, overflow: 'hidden', userSelect: 'none' }}
        onMouseMove={onMove} onMouseUp={() => drag.current = null} onMouseLeave={() => drag.current = null}
        onTouchMove={onMove} onTouchEnd={() => drag.current = null}>
        <img src={src} style={{ width: '100%', height: disp.h, objectFit: 'fill', display: 'block', pointerEvents: 'none' }} alt="" />
        {[{ left: 0, top: 0, width: box.x, height: disp.h }, { left: box.x + box.w, top: 0, width: disp.w - box.x - box.w, height: disp.h }, { left: box.x, top: 0, width: box.w, height: box.y }, { left: box.x, top: box.y + box.h, width: box.w, height: disp.h - box.y - box.h }].map((st, i) => (
          <div key={i} style={{ position: 'absolute', background: 'rgba(0,0,0,.55)', pointerEvents: 'none', ...st }} />
        ))}
        <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, border: '2px solid var(--accent)', cursor: 'move' }}
          onMouseDown={startMove} onTouchStart={startMove}>
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 11, color: 'rgba(255,255,255,.3)', pointerEvents: 'none' }}>4:5</span>
          <div style={{ position: 'absolute', width: 14, height: 14, background: 'var(--accent)', borderRadius: 3, right: -7, bottom: -7, cursor: 'se-resize' }}
            onMouseDown={startResize} onTouchStart={startResize} />
        </div>
      </div>
    </div>
  )
}

// ── PostCard ───────────────────────────────────────────────────────────────────
function PostCard({ post, customers, onUpdate, onDelete }: { post: Post, customers: Customer[], onUpdate: (patch: Partial<Post>) => void, onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [igE, setIgE] = useState(post.ig_edit || post.ig_text)
  const [fbE, setFbE] = useState(post.fb_edit || post.fb_text)
  const [comments, setComments] = useState<Comment[]>([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [showImageReplace, setShowImageReplace] = useState(false)
  const [newRawImg, setNewRawImg] = useState<string | null>(null)
  const [showCropReplace, setShowCropReplace] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [regenErr, setRegenErr] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [editTags, setEditTags] = useState<string[]>(post.hashtags || [])
  const [newTag, setNewTag] = useState('')
  const imgReplaceRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setEditTags(post.hashtags || []) }, [post.id])

  const addTag = () => {
    const t = newTag.trim().replace(/^#/, '')
    if (!t || editTags.includes(t)) return
    setEditTags(prev => [...prev, t])
    setNewTag('')
  }
  const removeTag = (t: string) => setEditTags(prev => prev.filter(x => x !== t))

  const loadComments = async () => {
    const { data } = await supabase.from('comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true })
    setComments(data || [])
  }
  const toggleComments = () => { if (!showComments) loadComments(); setShowComments(v => !v) }
  const addComment = async () => {
    if (!newComment.trim()) return
    await supabase.from('comments').insert({ post_id: post.id, author: 'admin', text: newComment.trim() })
    setNewComment(''); loadComments()
  }

  const handleReplaceFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return
    const r = new FileReader()
    r.onload = ev => { setNewRawImg(ev.target?.result as string); setShowCropReplace(true) }
    r.readAsDataURL(file)
  }

  const regenerate = async () => {
    setRegenerating(true); setRegenErr('')
    const cust = customers.find(c => c.id === post.customer_id)
    if (!cust) { setRegenErr('Kunde nicht gefunden'); setRegenerating(false); return }
    try {
      const res = await fetch(post.image_url); const blob = await res.blob()
      const imageB64 = await new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve((reader.result as string).split(',')[1]); reader.readAsDataURL(blob) })
      const r2 = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: imageB64, customer: cust }) })
      const data = await r2.json()
      if (!r2.ok) throw new Error(data.error || 'Fehler')
      await onUpdate({ ig_text: data.ig, fb_text: data.fb, ig_edit: data.ig, fb_edit: data.fb, hashtags: data.tags })
      setIgE(data.ig); setFbE(data.fb)
    } catch (e: any) { setRegenErr(e.message) }
    setRegenerating(false)
  }

  const statusButtons = [
    { s: 'approved', label: '✓ Freigeben', bg: '#3BFFA020', color: '#3BFFA0', border: '#3BFFA040' },
    { s: 'kunde', label: '📤 Zum Kunden', bg: '#FFD44720', color: '#FFD447', border: '#FFD44740' },
    { s: 'review', label: '👁 Prüfung', bg: '#FF900015', color: '#FF9000', border: '#FF900040' },
    { s: 'rejected', label: '✕ Ablehnen', bg: '#FF575715', color: '#FF5757', border: '#FF575730' },
  ].filter(b => b.s !== post.status)

  const pubDate = (post as any).publish_date
  const formattedDate = pubDate ? new Date(pubDate).toLocaleDateString('de', { day: '2-digit', month: 'short', year: 'numeric' }) : null

  return (
    <div style={{ ...s.card, padding: 0, overflow: 'hidden', marginBottom: 14 }}>
      <div style={{ display: 'flex' }}>
        <div style={{ width: 80, flexShrink: 0, position: 'relative' }}>
          {post.image_url ? <img src={post.image_url} style={{ width: 80, height: 100, objectFit: 'cover', display: 'block' }} alt="" /> : <div style={{ width: 80, height: 100, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'var(--border)' }}>📷</div>}
          <button onClick={() => { setShowImageReplace(v => !v); setShowCropReplace(false); setNewRawImg(null) }} title="Bild ersetzen"
            style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,.75)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 5, color: '#fff', fontSize: 12, padding: '3px 5px', cursor: 'pointer' }}>🔄</button>
        </div>
        <div style={{ flex: 1, padding: '12px 14px', minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{post.customer_name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(post.created_at).toLocaleDateString('de', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            {/* Publish date badge */}
            {formattedDate
              ? <span style={{ background: '#3BFFA015', color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }} onClick={() => setShowDatePicker(v => !v)}>📅 {formattedDate}</span>
              : <button onClick={() => setShowDatePicker(v => !v)} style={{ background: 'transparent', border: '1px dashed var(--border)', borderRadius: 20, padding: '2px 8px', fontSize: 10, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>📅 Datum setzen</button>
            }
          </div>
          <Badge status={post.status} />
          <div style={{ marginTop: 6, fontSize: 12, color: '#9AABB8', lineHeight: 1.4, display: expanded ? undefined : '-webkit-box', WebkitLineClamp: expanded ? undefined : 2 as any, WebkitBoxOrient: expanded ? undefined : 'vertical' as any, overflow: expanded ? undefined : 'hidden' }}>
            {post.ig_edit || post.ig_text}
          </div>
          <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 11, marginTop: 4, padding: 0 }}>
            {expanded ? '↑ Weniger' : '↓ Mehr'}
          </button>
        </div>
      </div>

      {/* Date picker panel */}
      {showDatePicker && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', background: '#0A0D10', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>📅 Veröffentlichungsdatum</div>
          <input type="date" defaultValue={pubDate ? pubDate.substring(0, 10) : ''}
            style={{ ...s.input, width: 'auto', fontSize: 13 }}
            onChange={e => onUpdate({ publish_date: e.target.value } as any)} />
          {pubDate && <button onClick={() => { onUpdate({ publish_date: null } as any); setShowDatePicker(false) }}
            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12 }}>✕ Entfernen</button>}
          <button onClick={() => setShowDatePicker(false)} style={{ ...s.btnGhost, ...s.btnXs, marginLeft: 'auto' }}>Schließen</button>
        </div>
      )}

      {/* Image replace panel */}
      {showImageReplace && (
        <div style={{ borderTop: '1px solid var(--border)', padding: 14, background: '#0A0D10' }}>
          {!showCropReplace ? (
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--accent)' }}>🔄 Bild ersetzen</div>
              <div style={{ ...s.dropZone, padding: '20px' }} onClick={() => imgReplaceRef.current?.click()}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>📷</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Neues Bild auswählen</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>JPG · PNG · WEBP</div>
              </div>
              <input ref={imgReplaceRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleReplaceFile(e.target.files![0])} />
              <button onClick={() => setShowImageReplace(false)} style={{ ...s.btnGhost, ...s.btnSm, marginTop: 8 }}>Abbrechen</button>
            </div>
          ) : newRawImg && (
            <Cropper src={newRawImg} onCrop={async (url) => { await onUpdate({ image_url: url }); setShowImageReplace(false); setNewRawImg(null); setShowCropReplace(false) }} onCancel={() => { setShowCropReplace(false); setNewRawImg(null) }} />
          )}
        </div>
      )}

      {/* Action bar */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px', display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
        {statusButtons.map(b => (
          <button key={b.s} onClick={() => onUpdate({ status: b.s as any })}
            style={{ background: b.bg, color: b.color, border: `1px solid ${b.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            {b.label}
          </button>
        ))}
        <button onClick={regenerate} disabled={regenerating}
          style={{ background: '#A78BFA20', color: '#A78BFA', border: '1px solid #A78BFA40', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: regenerating ? 'not-allowed' : 'pointer', opacity: regenerating ? 0.6 : 1 }}>
          {regenerating ? '⏳ Neu...' : '✨ Text neu'}
        </button>
        <button onClick={toggleComments} style={{ background: showComments ? '#3BFFA020' : 'transparent', color: showComments ? 'var(--accent)' : 'var(--muted)', border: `1px solid ${showComments ? 'var(--accent-border)' : 'var(--border)'}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          💬 {comments.length > 0 ? `(${comments.length})` : 'Kommentare'}
        </button>
        <button onClick={() => setEditing(e => !e)} style={{ ...s.btnGhost, ...s.btnXs, marginLeft: 'auto' }}>{editing ? 'Schließen' : '✏️'}</button>
        <button onClick={onDelete} style={{ background: '#FF575715', color: '#FF5757', border: '1px solid #FF575730', borderRadius: 6, padding: '5px 9px', fontSize: 11, cursor: 'pointer' }}>🗑</button>
      </div>

      {regenErr && <div style={{ padding: '8px 14px', background: '#FF575710', color: '#FF5757', fontSize: 12 }}>⚠️ {regenErr}</div>}

      {/* Comments */}
      {showComments && (
        <div style={{ borderTop: '1px solid var(--border)', padding: 14, background: '#0A0D10' }}>
          {comments.map(c => (
            <div key={c.id} style={{ marginBottom: 10, padding: 10, background: c.author === 'admin' ? '#1A2A1A' : '#1A1A2A', borderRadius: 8, borderLeft: `3px solid ${c.author === 'admin' ? 'var(--accent)' : '#A78BFA'}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: c.author === 'admin' ? 'var(--accent)' : '#A78BFA', marginBottom: 3 }}>
                {c.author === 'admin' ? '👤 Du' : `👥 ${c.author}`}
                <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>{new Date(c.created_at).toLocaleDateString('de')}</span>
              </div>
              <div style={{ fontSize: 13, color: '#D0D8E0' }}>{c.text}</div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} placeholder="Kommentar..." style={{ ...s.input, flex: 1, fontSize: 13 }} />
            <button onClick={addComment} style={{ ...s.btnPrimary, ...s.btnSm, flexShrink: 0 }}>Senden</button>
          </div>
        </div>
      )}

      {/* Edit panel */}
      {editing && (
        <div style={{ borderTop: '1px solid var(--border)', padding: 14, background: '#0A0D10' }}>
          <div style={{ marginBottom: 10 }}><label style={s.label}>📸 Instagram</label><textarea value={igE} onChange={e => setIgE(e.target.value)} rows={4} style={{ ...s.input, resize: 'vertical', minHeight: 80, lineHeight: 1.6 }} /></div>
          <div style={{ marginBottom: 14 }}><label style={s.label}>📘 Facebook</label><textarea value={fbE} onChange={e => setFbE(e.target.value)} rows={4} style={{ ...s.input, resize: 'vertical', minHeight: 80, lineHeight: 1.6 }} /></div>

          {/* Hashtag editor */}
          <div style={{ marginBottom: 14 }}>
            <label style={s.label}># Hashtags bearbeiten ({editTags.length})</label>
            {/* Current tags – click to remove */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {editTags.map((t, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>
                  #{t.replace(/^#/, '')}
                  <button onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0, opacity: 0.7 }}>×</button>
                </span>
              ))}
              {editTags.length === 0 && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Keine Hashtags – füge unten welche hinzu</div>}
            </div>
            {/* Add new tag */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Neuen Hashtag eingeben (ohne #) + Enter"
                style={{ ...s.input, flex: 1, fontSize: 13 }}
              />
              <button onClick={addTag} style={{ ...s.btnPrimary, ...s.btnSm, flexShrink: 0 }}>＋</button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>Auf × klicken um einen Hashtag zu entfernen</div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => { onUpdate({ ig_edit: igE, fb_edit: fbE, hashtags: editTags }); setEditing(false) }} style={{ ...s.btnPrimary, ...s.btnSm }}>Speichern</button>
            <button onClick={() => { setEditing(false); setEditTags(post.hashtags || []) }} style={{ ...s.btnGhost, ...s.btnSm }}>Abbrechen</button>
            <button onClick={() => navigator.clipboard.writeText(`INSTAGRAM:\n${igE}\n\nFACEBOOK:\n${fbE}\n\nHASHTAGS:\n${editTags.map(t => '#' + t.replace(/^#/, '')).join(' ')}`)}
              style={{ flex: 1, padding: '7px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              📋 Alles kopieren
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Admin App ─────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const [nav, setNav] = useState('generate')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [selCust, setSelCust] = useState<Customer | null>(null)
  const [rawImg, setRawImg] = useState<string | null>(null)
  const [croppedImg, setCroppedImg] = useState<string | null>(null)
  const [croppedB64, setCroppedB64] = useState<string | null>(null)
  const [showCrop, setShowCrop] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [errMsg, setErrMsg] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [publishDate, setPublishDate] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const blankC = { name: '', instagram: '', facebook: '', industry: '', tone: '', description: '', refs: [], lang: 'de', slug: '' }
  const [cForm, setCForm] = useState<any>(blankC)
  const [editCId, setEditCId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [custFilter, setCustFilter] = useState<string | null>(null)
  const [toasts, setToasts] = useState<{ id: number, msg: string, type: 'approved' | 'rejected' | 'comment' | 'info' }[]>([])

  const addToast = (msg: string, type: 'approved' | 'rejected' | 'comment' | 'info' = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5000)
  }

  useEffect(() => { if (typeof window !== 'undefined' && !localStorage.getItem('cs_admin')) router.push('/') }, [])
  useEffect(() => { loadAll() }, [])

  // ── Realtime subscriptions ──
  useEffect(() => {
    // Listen for post status changes (customer approvals/rejections)
    const postsSub = supabase
      .channel('posts-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, (payload) => {
        const updated = payload.new as any
        setPosts(ps => ps.map(p => p.id === updated.id ? { ...p, ...updated } : p))
        if (updated.status === 'approved') addToast(`✓ ${updated.customer_name} hat einen Beitrag freigegeben!`, 'approved')
        if (updated.status === 'rejected') addToast(`✕ ${updated.customer_name} hat Änderungen angefordert`, 'rejected')
      })
      .subscribe()

    // Listen for new comments
    const commentsSub = supabase
      .channel('comments-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, (payload) => {
        const c = payload.new as any
        if (c.author !== 'admin') {
          addToast(`💬 Neuer Kommentar von ${c.author}`, 'comment')
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(postsSub)
      supabase.removeChannel(commentsSub)
    }
  }, [])

  const loadAll = async () => {
    const [{ data: custs }, { data: ps }] = await Promise.all([
      supabase.from('customers').select('*').order('created_at', { ascending: true }),
      supabase.from('posts').select('*').order('publish_date', { ascending: true, nullsFirst: false })
    ])
    setCustomers(custs || [])
    setPosts(ps || [])
  }

  const handleFile = useCallback((file: File) => {
    if (!file || !file.type.startsWith('image/')) return
    const r = new FileReader()
    r.onload = ev => { setRawImg(ev.target?.result as string); setCroppedImg(null); setCroppedB64(null); setResult(null); setErrMsg(''); setSelectedTags([]); setShowCrop(true) }
    r.readAsDataURL(file)
  }, [])

  const generate = async () => {
    if (!selCust || !croppedB64) return
    setGenerating(true); setResult(null); setErrMsg(''); setSelectedTags([])
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: croppedB64, customer: selCust, customPrompt }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setResult(data)
      // Auto-select first 15
      setSelectedTags((data.tags || []).slice(0, 15))
    } catch (e: any) { setErrMsg(e.message) }
    setGenerating(false)
  }

  const regenerateFromTab = async () => {
    if (!selCust || !croppedB64) return
    setGenerating(true); setErrMsg(''); setSelectedTags([])
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: croppedB64, customer: selCust, customPrompt }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setResult(data)
      setSelectedTags((data.tags || []).slice(0, 15))
    } catch (e: any) { setErrMsg(e.message) }
    setGenerating(false)
  }

  const savePost = async (toKunde = false) => {
    if (!result || !selCust) return
    const { data } = await supabase.from('posts').insert({
      customer_id: selCust.id, customer_name: selCust.name,
      image_url: croppedImg, ig_text: result.ig, fb_text: result.fb,
      ig_edit: result.ig, fb_edit: result.fb,
      hashtags: selectedTags.length > 0 ? selectedTags : result.tags,
      status: toKunde ? 'kunde' : 'pending',
      publish_date: publishDate || null,
    }).select().single()
    if (data) setPosts(p => [...p, data].sort((a, b) => {
      if (!a.publish_date && !b.publish_date) return 0
      if (!a.publish_date) return 1
      if (!b.publish_date) return -1
      return new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime()
    }))
    setResult(null); setCroppedImg(null); setCroppedB64(null); setRawImg(null); setSelectedTags([]); setPublishDate('')
    setNav(toKunde ? 'abnahme' : 'board')
  }

  const updatePost = async (id: string, patch: Partial<Post>) => {
    await supabase.from('posts').update(patch).eq('id', id)
    setPosts(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p))
  }

  const deletePost = async (id: string) => {
    await supabase.from('posts').delete().eq('id', id)
    setPosts(ps => ps.filter(p => p.id !== id))
  }

  const saveCust = async () => {
    if (!cForm.name.trim()) return
    const slug = cForm.slug || cForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (editCId) {
      await supabase.from('customers').update({ ...cForm, slug }).eq('id', editCId)
      setCustomers(cs => cs.map(c => c.id === editCId ? { ...c, ...cForm, slug } : c))
    } else {
      const { data } = await supabase.from('customers').insert({ ...cForm, slug }).select().single()
      if (data) setCustomers(cs => [...cs, data])
    }
    setEditCId(null); setCForm(blankC)
  }

  const pendingCount = posts.filter(p => p.status === 'pending' || p.status === 'review').length
  const kundeCount = posts.filter(p => p.status === 'kunde').length
  const navItems = [
    { id: 'generate', icon: '✦', label: 'Erstellen' },
    { id: 'board', icon: '☰', label: 'Board', badge: pendingCount || null },
    { id: 'abnahme', icon: '📤', label: 'Abnahme', badge: kundeCount || null },
    { id: 'log', icon: '◷', label: 'Log' },
    { id: 'customers', icon: '◈', label: 'Kunden' },
  ]

  // Sort posts: by publish_date asc, nulls last
  const sortedPosts = [...posts].sort((a, b) => {
    const ad = (a as any).publish_date, bd = (b as any).publish_date
    if (!ad && !bd) return 0; if (!ad) return 1; if (!bd) return -1
    return new Date(ad).getTime() - new Date(bd).getTime()
  })
  const filteredPosts = sortedPosts.filter(p => (statusFilter === 'all' || p.status === statusFilter) && (!custFilter || p.customer_id === custFilter))

  return (
    <div style={s.shell}>
      {/* Toast notifications */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => {
          const colors = {
            approved: { bg: '#0A2A1A', border: '#3BFFA040', color: '#3BFFA0' },
            rejected: { bg: '#2A0A0A', border: '#FF575740', color: '#FF5757' },
            comment: { bg: '#1A1A2A', border: '#A78BFA40', color: '#A78BFA' },
            info: { bg: '#1A1A1A', border: '#25283340', color: '#E8ECF0' },
          }[t.type]
          return (
            <div key={t.id} style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 16px', fontSize: 13, fontWeight: 600, color: colors.color, maxWidth: 320, boxShadow: '0 4px 20px rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, animation: 'slideIn .2s ease' }}>
              <span>{t.msg}</span>
              <button onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))} style={{ background: 'none', border: 'none', color: colors.color, cursor: 'pointer', fontSize: 16, opacity: 0.6, padding: 0 }}>×</button>
            </div>
          )
        })}
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(20px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>
      <div style={s.sidebar}>
        <div style={{ padding: '0 20px 24px', fontSize: 19, fontWeight: 800 }}>content<span style={{ color: 'var(--accent)' }}>.</span>studio</div>
        {navItems.map(n => <NavItem key={n.id} icon={n.icon} label={n.label} active={nav === n.id} badge={n.badge} onClick={() => setNav(n.id)} />)}
        <div style={{ marginTop: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {selCust && <a href={`/kunde/${selCust.slug}`} target="_blank" style={{ ...s.btnYellow, textAlign: 'center', borderRadius: 8, fontSize: 11, padding: '7px 12px' }}>👁 Kundenansicht: {selCust.name}</a>}
          <button onClick={() => { localStorage.removeItem('cs_admin'); router.push('/') }} style={{ ...s.btnGhost, ...s.btnSm, width: '100%', justifyContent: 'center' }}>Ausloggen</button>
        </div>
      </div>

      <div style={s.main}>

        {/* GENERATE */}
        {nav === 'generate' && <>
          <div style={s.topbar}><div><div style={{ fontSize: 18, fontWeight: 800 }}>Beitrag erstellen</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Bild · Zuschnitt · KI-Text · Hashtags wählen · Zum Kunden</div></div></div>
          <div style={s.body}>
            <div style={s.label}>① Kunde wählen</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10, marginBottom: 20 }}>
              {customers.map(c => (
                <div key={c.id} onClick={() => { setSelCust(c); setResult(null); setSelectedTags([]) }}
                  style={{ background: selCust?.id === c.id ? 'var(--accent-dim)' : 'var(--card)', border: `2px solid ${selCust?.id === c.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 10, padding: 12, cursor: 'pointer' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--accent)', marginBottom: 7 }}>{c.name[0]}</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.instagram || c.industry}</div>
                </div>
              ))}
            </div>

            {selCust && <div style={s.g2}>
              <div>
                <div style={s.label}>② Bild hochladen &amp; zuschneiden</div>
                {!showCrop && !croppedImg && (
                  <div style={s.dropZone} onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault() }} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>📷</div>
                    <div style={{ fontWeight: 700, marginBottom: 3 }}>Bild ablegen</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>JPG · PNG · WEBP</div>
                  </div>
                )}
                {showCrop && rawImg && (
                  <div style={{ ...s.card, padding: 14 }}>
                    <Cropper src={rawImg} onCrop={(url, b64) => { setCroppedImg(url); setCroppedB64(b64); setShowCrop(false) }} onCancel={() => { setShowCrop(false); setRawImg(null) }} />
                  </div>
                )}
                {croppedImg && !showCrop && (
                  <div>
                    <img src={croppedImg} style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)', display: 'block' }} alt="" />
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button onClick={generate} disabled={generating} style={{ ...s.btnPrimary, flex: 1 }}>{generating ? '⏳ Generiere...' : '✦ Beitrag generieren'}</button>
                      <button onClick={() => { setCroppedImg(null); setCroppedB64(null); setResult(null); setRawImg(null); setErrMsg(''); setSelectedTags([]); setCustomPrompt('') }} style={s.btnGhost}>✕</button>
                    </div>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files![0])} />

                {/* Custom prompt field */}
                {croppedImg && (
                  <div style={{ marginTop: 14, ...s.card }}>
                    <div style={s.label}>✍️ Zusätzliche Anweisungen (optional)</div>
                    <textarea
                      value={customPrompt}
                      onChange={e => setCustomPrompt(e.target.value)}
                      placeholder={`z.B. "Erwähne das neue Mittagsmenü", "Mehr Emojis", "Kürzer und knackiger", "Schreibe auf Englisch"...`}
                      rows={3}
                      style={{ ...s.input, resize: 'vertical', minHeight: 72, lineHeight: 1.5, fontSize: 13 }}
                    />
                    {customPrompt && (
                      <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        ✓ Wird beim nächsten Generieren berücksichtigt
                        <button onClick={() => setCustomPrompt('')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 11, padding: 0 }}>✕ Löschen</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Publish date picker */}
                {croppedImg && (
                  <div style={{ marginTop: 14, ...s.card }}>
                    <div style={s.label}>📅 Veröffentlichungsdatum (optional)</div>
                    <input type="date" value={publishDate} onChange={e => setPublishDate(e.target.value)}
                      style={{ ...s.input, fontSize: 13 }} />
                    {publishDate && <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 6 }}>
                      Geplant: {new Date(publishDate).toLocaleDateString('de', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>}
                  </div>
                )}
              </div>

              <div>
                <div style={s.label}>③ Generierter Beitrag</div>
                {errMsg && <div style={{ background: '#FF575710', border: '1px solid #FF575740', borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>⚠️ Fehler</div>
                  <div style={{ fontSize: 12, color: 'var(--danger)' }}>{errMsg}</div>
                  <button onClick={generate} style={{ ...s.btnPrimary, ...s.btnSm, marginTop: 10 }}>Nochmal</button>
                </div>}
                {result && <div style={s.card}>
                  <div style={{ fontWeight: 700, marginBottom: 14 }}>Beitrag · <span style={{ color: 'var(--accent)' }}>{selCust.name}</span></div>
                  <div style={s.label}>📸 Instagram</div>
                  <div style={s.resultBlock}>{result.ig}<CopyBtn text={result.ig} /></div>
                  <div style={{ ...s.label, marginTop: 12 }}>📘 Facebook</div>
                  <div style={s.resultBlock}>{result.fb}<CopyBtn text={result.fb} /></div>

                  {/* Hashtag Picker */}
                  <div style={{ marginTop: 16, padding: 14, background: '#0A0D10', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <HashtagPicker tags={result.tags || []} selected={selectedTags} onChange={setSelectedTags} />
                    {selectedTags.length > 0 && (
                      <button onClick={() => navigator.clipboard.writeText(selectedTags.map(t => '#' + t.replace(/^#/, '')).join(' '))}
                        style={{ marginTop: 10, background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                        📋 Gewählte Hashtags kopieren
                      </button>
                    )}
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />
                  <button onClick={regenerateFromTab} disabled={generating}
                    style={{ width: '100%', background: '#A78BFA20', color: '#A78BFA', border: '1px solid #A78BFA40', borderRadius: 8, padding: 10, fontWeight: 700, fontSize: 13, cursor: generating ? 'not-allowed' : 'pointer', marginBottom: 8 }}>
                    {generating ? '⏳ Generiere neu...' : '✨ Anderen Text generieren'}
                  </button>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button onClick={() => savePost(true)} style={{ ...s.btnYellow, width: '100%', justifyContent: 'center', padding: 11, fontSize: 13 }}>📤 Direkt zum Kunden senden</button>
                    <button onClick={() => savePost(false)} style={{ ...s.btnGhost, width: '100%', justifyContent: 'center' }}>◷ Im Board speichern</button>
                  </div>
                </div>}
                {!generating && !result && !errMsg && <div style={{ ...s.card, border: '1px dashed var(--border)' }}><div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--border)', fontSize: 13 }}>Beitrag erscheint hier</div></div>}
              </div>
            </div>}
          </div>
        </>}

        {/* BOARD */}
        {nav === 'board' && <>
          <div style={s.topbar}><div style={{ fontSize: 18, fontWeight: 800 }}>Freigabe-Board</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Sortiert nach Veröffentlichungsdatum</div></div>
          <div style={s.body}>
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', padding: 4, borderRadius: 10, marginBottom: 12, overflowX: 'auto' }}>
              {[null, ...customers].map((c: any) => <button key={c?.id || 'all'} onClick={() => setCustFilter(c?.id || null)} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: custFilter === (c?.id || null) ? 'var(--accent)' : 'transparent', color: custFilter === (c?.id || null) ? '#000' : 'var(--muted)', fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>{c?.name || 'Alle'}</button>)}
            </div>
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', padding: 4, borderRadius: 10, marginBottom: 16, overflowX: 'auto' }}>
              {['all', 'pending', 'review', 'kunde', 'approved', 'rejected'].map(st => {
                const labels: Record<string, string> = { all: 'Alle', pending: '⏳ Entwurf', review: '👁 Prüfung', kunde: '📤 Beim Kunden', approved: '✓ Freigegeben', rejected: '✕ Abgelehnt' }
                return <button key={st} onClick={() => setStatusFilter(st)} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: statusFilter === st ? 'var(--accent)' : 'transparent', color: statusFilter === st ? '#000' : 'var(--muted)', fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>{labels[st]}</button>
              })}
            </div>
            {filteredPosts.length === 0 && <div style={{ ...s.card, textAlign: 'center', padding: '50px 20px', color: 'var(--muted)' }}>Keine Beiträge</div>}
            {filteredPosts.map(p => <PostCard key={p.id} post={p} customers={customers} onUpdate={patch => updatePost(p.id, patch)} onDelete={() => deletePost(p.id)} />)}
          </div>
        </>}

        {/* ABNAHME */}
        {nav === 'abnahme' && <>
          <div style={s.topbar}>
            <div><div style={{ fontSize: 18, fontWeight: 800 }}>Abnahme Kunde</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Sortiert nach Veröffentlichungsdatum</div></div>
            {selCust && <a href={`/kunde/${selCust.slug}`} target="_blank" style={{ ...s.btnYellow, borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>👁 Kundenansicht</a>}
          </div>
          <div style={s.body}>
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', padding: 4, borderRadius: 10, marginBottom: 16, overflowX: 'auto' }}>
              {customers.map(c => <button key={c.id} onClick={() => setSelCust(c)} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: selCust?.id === c.id ? 'var(--accent)' : 'transparent', color: selCust?.id === c.id ? '#000' : 'var(--muted)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{c.name}</button>)}
            </div>
            {sortedPosts.filter(p => ['kunde', 'approved', 'rejected'].includes(p.status) && (!selCust || p.customer_id === selCust.id)).length === 0
              ? <div style={{ ...s.card, textAlign: 'center', padding: '50px 20px', color: 'var(--muted)' }}>Keine Beiträge beim Kunden</div>
              : sortedPosts.filter(p => ['kunde', 'approved', 'rejected'].includes(p.status) && (!selCust || p.customer_id === selCust.id)).map(p => <PostCard key={p.id} post={p} customers={customers} onUpdate={patch => updatePost(p.id, patch)} onDelete={() => deletePost(p.id)} />)
            }
          </div>
        </>}

        {/* LOG */}
        {nav === 'log' && <>
          <div style={s.topbar}><div style={{ fontSize: 18, fontWeight: 800 }}>Verlaufs-Log</div><span style={{ color: 'var(--muted)', fontSize: 13 }}>{posts.length} Beiträge</span></div>
          <div style={s.body}>
            <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
              {posts.length === 0 && <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--muted)' }}>Noch nichts gespeichert</div>}
              {sortedPosts.map((p, i) => {
                const pd = (p as any).publish_date
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: i < posts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    {p.image_url ? <img src={p.image_url} style={{ width: 36, height: 45, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} alt="" /> : <div style={{ width: 36, height: 45, borderRadius: 6, background: 'var(--surface)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{p.customer_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(p.ig_edit || p.ig_text)?.substring(0, 60)}…</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      <Badge status={p.status} />
                      {pd && <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>📅 {new Date(pd).toLocaleDateString('de', { day: '2-digit', month: 'short' })}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>}

        {/* CUSTOMERS */}
        {nav === 'customers' && <>
          <div style={s.topbar}><div style={{ fontSize: 18, fontWeight: 800 }}>Kunden</div></div>
          <div style={s.body}>
            <div style={s.g2}>
              <div style={s.card}>
                <div style={{ fontWeight: 700, marginBottom: 14 }}>{editCId ? '✏️ Bearbeiten' : '＋ Neuer Kunde'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[['name', 'Kundenname *', 'Restaurant Bella Italia'], ['instagram', 'Instagram', '@handle'], ['facebook', 'Facebook', 'seitenname'], ['industry', 'Branche', 'Gastronomie…'], ['tone', 'Tonalität', 'locker, professionell…'], ['slug', 'URL-Slug', 'bella-italia']].map(([field, lbl, ph]) => (
                    <div key={field}><label style={s.label}>{lbl}</label><input value={cForm[field]} onChange={e => setCForm((f: any) => ({ ...f, [field]: e.target.value }))} placeholder={ph as string} style={s.input} /></div>
                  ))}
                  <div><label style={s.label}>Beschreibung</label><textarea value={cForm.description} onChange={e => setCForm((f: any) => ({ ...f, description: e.target.value }))} style={{ ...s.input, resize: 'vertical', minHeight: 72 }} /></div>
                  <div><label style={s.label}>Sprache</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[['de', '🇩🇪 Deutsch'], ['en', '🇬🇧 English']].map(([l, lb]) => <button key={l} onClick={() => setCForm((f: any) => ({ ...f, lang: l }))} style={{ ...cForm.lang === l ? s.btnPrimary : s.btnGhost, ...s.btnSm }}>{lb}</button>)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={saveCust} disabled={!cForm.name.trim()} style={{ ...s.btnPrimary, flex: 1 }}>{editCId ? 'Speichern' : 'Anlegen'}</button>
                    {editCId && <button onClick={() => { setEditCId(null); setCForm(blankC) }} style={s.btnGhost}>Abbrechen</button>}
                  </div>
                </div>
              </div>
              <div>
                {customers.map(c => (
                  <div key={c.id} style={{ ...s.card, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 3 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 3 }}>{c.instagram && <span style={{ marginRight: 8 }}>📸 {c.instagram}</span>}{c.facebook && <span>📘 {c.facebook}</span>}</div>
                        {c.industry && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.industry}</div>}
                        <div style={{ fontSize: 11, color: 'var(--border)', marginTop: 4 }}>🔗 /kunde/{c.slug}</div>
                        <a href={`/kunde/${c.slug}`} target="_blank" style={{ fontSize: 11, color: 'var(--accent)', marginTop: 3, display: 'block' }}>Kundenlink öffnen →</a>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { setCForm({ ...c }); setEditCId(c.id) }} style={{ ...s.btnGhost, ...s.btnXs }}>✏️</button>
                        <button onClick={async () => { await supabase.from('customers').delete().eq('id', c.id); setCustomers(cs => cs.filter(x => x.id !== c.id)) }} style={{ background: '#FF575715', color: '#FF5757', border: '1px solid #FF575730', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>🗑</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>}

      </div>
    </div>
  )
}
