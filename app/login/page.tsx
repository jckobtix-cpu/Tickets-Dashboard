'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Špatný email nebo heslo.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060808', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        input:focus { outline: none; border-color: #00ff88 !important; box-shadow: 0 0 0 2px rgba(0,255,136,0.1); }
      `}</style>

      <div style={{ width: '100%', maxWidth: 360, animation: 'up 0.5s ease both' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 12, height: 12, background: '#00ff88', borderRadius: '50%', boxShadow: '0 0 14px #00ff88, 0 0 28px #00ff8844', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>TICKETS</span>
          </div>
          <div style={{ fontSize: 12, color: '#1a4a1a', letterSpacing: 2 }}>FINANCIAL DASHBOARD</div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ background: '#080d08', border: '1px solid #0d2b0d', borderRadius: 16, padding: '32px', boxShadow: '0 0 40px rgba(0,255,136,0.05)' }}>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, color: '#1a4a1a', fontWeight: 600, letterSpacing: 2, display: 'block', marginBottom: 8 }}>EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tvuj@email.cz" required
              style={{ width: '100%', background: '#0d1a0d', border: '1px solid #0d2b0d', borderRadius: 8, color: '#e2e8f0', fontSize: 14, padding: '11px 14px', fontFamily: "'DM Sans',sans-serif", transition: 'border-color 0.2s, box-shadow 0.2s' }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 10, color: '#1a4a1a', fontWeight: 600, letterSpacing: 2, display: 'block', marginBottom: 8 }}>HESLO</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
              style={{ width: '100%', background: '#0d1a0d', border: '1px solid #0d2b0d', borderRadius: 8, color: '#e2e8f0', fontSize: 14, padding: '11px 14px', fontFamily: "'DM Sans',sans-serif", transition: 'border-color 0.2s, box-shadow 0.2s' }} />
          </div>

          {error && (
            <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: '100%', background: 'transparent', border: '1px solid #00ff88', color: '#00ff88', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13, padding: '12px', cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 10, letterSpacing: 1, boxShadow: '0 0 20px rgba(0,255,136,0.1)', opacity: loading ? 0.6 : 1, transition: 'box-shadow 0.2s' }}>
            {loading ? 'PŘIHLAŠOVÁNÍ...' : 'PŘIHLÁSIT SE'}
          </button>
        </form>
      </div>
    </div>
  )
}
