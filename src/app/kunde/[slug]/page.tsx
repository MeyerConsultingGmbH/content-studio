'use client'
import { useState, useEffect } from 'react'
import { supabase, Post, Comment, Customer } from '@/lib/supabase'
import { useParams } from 'next/navigation'

export default function KundePage() {
  const params = useParams()
  const slug = params.slug as string
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    loadData()
  }, [slug])

  const loadData = async () => {
    setLoading(true)
    const { data: cust } = await supabase.from('customers').select('*').eq('slug', slug).single()
    if (!cust) { setNotFound(true); setLoading(false); return }
    setCustomer(cust)
    const { data: ps } = await supabase.from('posts').select('*')
      .eq('customer_id', cust.id)
      .in('status', ['kunde', 'approved', 'rejected'])
      .order('created_at', { ascending: false })
    setPosts(ps || [])
    setLoading(false)
  }

  const updatePost = async (id: string, patch: Partial<Post>) => {
    await supabase.from('posts').update(patch).eq('id', id)
    setPosts(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ color: 'var(--muted)', fontSize: 14 }}>Lade...</div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>404</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Kunde nicht gefunden</div>
      </div>
    </div>
  )

  const pendingCount = posts.filter(p => p.status === 'kunde').length

  return (
    <div style={{ minHeight: '100vh', background: '#0D0F12', fontFamily: 'Bricolage Grotesque, sans-serif', color: 'var(--text)' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', textAlign: 'center', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>content<span style={{ color: 'var(--accent)' }}>.</span>studio</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Hallo, {customer?.name}! 👋</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: pendingCount > 0 ? 12 : 0 }}>Deine Social-Media-Beiträge zur Abnahme</div>
        {pendingCount > 0 && (
          <div style={{ display: 'inline-block', background: 'var(--yellow)', color: '#000', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>
            {pendingCount} Beitrag{pendingCount > 1 ? 'e' : ''} warten auf deine Freigabe
          </div>
        )}
      </div>

      {/* Posts */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px 60px' }}>
        {posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Noch keine Beiträge</div>
            <div style={{ fontSize: 13 }}>Sobald Beiträge für dich bereit sind, erscheinen sie hier.</div>
          </div>
        )}
        {posts.map(post => <KundePostCard key={post.id} post={post} customerName={customer?.name || ''} onUpdate={patch => updatePost(post.id, patch)} />)}
      </div>
    </div>
  )
}

function KundePostCard({ post, customerName, onUpdate }: { post: Post, customerName: string, onUpdate: (patch: Partial<Post>) => void }) {
  const [platform, setPlatform] = useState<'ig' | 'fb'>('ig')
  const [editMode, setEditMode] = useState(false)
  const [igEdit, setIgEdit] = useState(post.ig_edit || post.ig_text)
  const [fbEdit, setFbEdit] = useState(post.fb_edit || post.fb_text)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadComments()
  }, [])

  const loadComments = async () => {
    const { data } = await supabase.from('comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true })
    setComments(data || [])
  }

  const addComment = async () => {
    if (!newComment.trim()) return
    await supabase.from('comments').insert({ post_id: post.id, author: customerName, text: newComment.trim() })
    setNewComment('')
    loadComments()
  }

  const saveEdits = async () => {
    setSaving(true)
    await onUpdate({ ig_edit: igEdit, fb_edit: fbEdit })
    setSaving(false)
    setEditMode(false)
  }

  const text = platform === 'ig' ? (post.ig_edit || post.ig_text) : (post.fb_edit || post.fb_text)

  const statusInfo: Record<string, { bg: string, color: string, text: string }> = {
    approved: { bg: '#3BFFA015', color: '#3BFFA0', text: '✓ Du hast diesen Beitrag freigegeben – Danke!' },
    rejected: { bg: '#FF575715', color: '#FF5757', text: '✕ Du hast eine Änderung angefordert.' },
  }

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
      {/* Image */}
      {post.image_url
        ? <img src={post.image_url} style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', display: 'block' }} alt="" />
        : <div style={{ width: '100%', aspectRatio: '4/5', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>📷</div>}

      <div style={{ padding: 16 }}>
        {/* Date */}
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, fontFamily: 'DM Mono' }}>
          {new Date(post.created_at).toLocaleDateString('de', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>

        {/* Platform tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {(['ig', 'fb'] as const).map(p => (
            <button key={p} onClick={() => setPlatform(p)}
              style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: platform === p ? 'var(--accent)' : 'var(--surface)', color: platform === p ? '#000' : 'var(--muted)', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              {p === 'ig' ? '📸 Instagram' : '📘 Facebook'}
            </button>
          ))}
        </div>

        {/* Text */}
        {!editMode ? (
          <div style={{ fontSize: 14, lineHeight: 1.7, color: '#D0D8E0', whiteSpace: 'pre-wrap', marginBottom: 12 }}>{text}</div>
        ) : (
          <textarea value={platform === 'ig' ? igEdit : fbEdit}
            onChange={e => platform === 'ig' ? setIgEdit(e.target.value) : setFbEdit(e.target.value)}
            style={{ width: '100%', background: '#0A0D10', border: '1px solid var(--accent)', color: 'var(--text)', borderRadius: 8, padding: '10px 12px', fontSize: 14, lineHeight: 1.7, fontFamily: 'inherit', resize: 'vertical', minHeight: 140, outline: 'none', marginBottom: 10 }} />
        )}

        {/* Hashtags */}
        {post.hashtags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
            {post.hashtags.map((t, i) => (
              <span key={i} style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>#{t.replace(/^#/, '')}</span>
            ))}
          </div>
        )}

        {/* Status display */}
        {(post.status === 'approved' || post.status === 'rejected') && statusInfo[post.status] && (
          <div style={{ background: statusInfo[post.status].bg, border: `1px solid ${statusInfo[post.status].color}40`, borderRadius: 10, padding: '12px 16px', textAlign: 'center', color: statusInfo[post.status].color, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
            {statusInfo[post.status].text}
          </div>
        )}

        {/* Actions for kunde status */}
        {post.status === 'kunde' && !editMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <button onClick={() => onUpdate({ status: 'approved' })}
              style={{ width: '100%', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 10, padding: 13, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
              ✓ Beitrag freigeben
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditMode(true)}
                style={{ flex: 1, background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 10, padding: 11, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                ✏️ Text bearbeiten
              </button>
              <button onClick={() => { setShowComments(v => !v) }}
                style={{ flex: 1, background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 10, padding: 11, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                💬 Kommentar
              </button>
            </div>
            <button onClick={() => onUpdate({ status: 'rejected' })}
              style={{ width: '100%', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)40', borderRadius: 10, padding: 11, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              ✕ Änderung anfordern
            </button>
          </div>
        )}

        {/* After approval – allow status change */}
        {(post.status === 'approved' || post.status === 'rejected') && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {post.status !== 'approved' && (
              <button onClick={() => onUpdate({ status: 'approved' })}
                style={{ flex: 1, background: '#3BFFA020', color: '#3BFFA0', border: '1px solid #3BFFA040', borderRadius: 8, padding: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                ✓ Doch freigeben
              </button>
            )}
            {post.status !== 'rejected' && (
              <button onClick={() => onUpdate({ status: 'rejected' })}
                style={{ flex: 1, background: '#FF575715', color: '#FF5757', border: '1px solid #FF575740', borderRadius: 8, padding: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                ✕ Änderung anfordern
              </button>
            )}
          </div>
        )}

        {/* Edit mode actions */}
        {editMode && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={saveEdits} disabled={saving}
              style={{ flex: 1, background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8, padding: 11, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Speichert...' : '✓ Änderungen speichern'}
            </button>
            <button onClick={() => setEditMode(false)}
              style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, padding: 11, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Abbrechen
            </button>
          </div>
        )}

        {/* Comments section */}
        <div>
          <button onClick={() => setShowComments(v => !v)}
            style={{ background: 'none', border: 'none', color: comments.length > 0 ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', padding: 0, marginBottom: showComments ? 10 : 0 }}>
            💬 {comments.length > 0 ? `${comments.length} Kommentar${comments.length > 1 ? 'e' : ''}` : 'Kommentar hinzufügen'}
            {showComments ? ' ↑' : ' ↓'}
          </button>

          {showComments && (
            <div>
              {comments.map(c => (
                <div key={c.id} style={{ marginBottom: 8, padding: '10px 12px', background: c.author === 'admin' ? '#1A2A1A' : '#1A1A2A', borderRadius: 8, borderLeft: `3px solid ${c.author === 'admin' ? 'var(--accent)' : '#A78BFA'}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.author === 'admin' ? 'var(--accent)' : '#A78BFA', marginBottom: 3 }}>
                    {c.author === 'admin' ? '✍️ Agentur' : `👤 ${c.author}`}
                    <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 8, fontSize: 10 }}>{new Date(c.created_at).toLocaleDateString('de')}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#D0D8E0', lineHeight: 1.5 }}>{c.text}</div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input value={newComment} onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addComment()}
                  placeholder="Dein Kommentar..." 
                  style={{ flex: 1, background: '#0D1014', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                <button onClick={addComment}
                  style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                  Senden
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
