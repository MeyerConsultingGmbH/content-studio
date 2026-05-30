'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const router = useRouter()

  const login = async () => {
    const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) })
    if (res.ok) {
      localStorage.setItem('cs_admin', 'true')
      router.push('/admin')
    } else {
      setErr('Falsches Passwort')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 40, width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>content<span style={{ color: 'var(--accent)' }}>.</span>studio</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28 }}>Admin Login</div>
        <input
          type="password" placeholder="Passwort" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          style={{ width: '100%', background: '#0D1014', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', marginBottom: 12 }}
        />
        {err && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <button onClick={login} style={{ width: '100%', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8, padding: '11px', fontWeight: 700, fontSize: 14 }}>
          Einloggen →
        </button>
      </div>
    </div>
  )
}
