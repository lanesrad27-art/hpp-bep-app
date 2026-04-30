import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setErr(''); setMsg('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setErr(error.message)
      else router.push('/')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setErr(error.message)
      else setMsg('Cek email Anda untuk konfirmasi akun!')
    }
    setLoading(false)
  }

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>📊</div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '4px' }}>Kalkulator HPP & BEP</h1>
          <p style={{ fontSize: '14px', color: 'var(--c-muted)' }}>Untuk UMKM Kuliner & Kerajinan</p>
        </div>

        <div className="card">
          <div className="tabs" style={{ marginBottom: '20px' }}>
            <button className={`tab-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setErr(''); setMsg('') }}>Masuk</button>
            <button className={`tab-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setErr(''); setMsg('') }}>Daftar</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@email.com" required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimal 6 karakter" required minLength={6} />
            </div>

            {err && <p style={{ color: 'var(--c-red)', fontSize: '13px', marginBottom: '10px' }}>{err}</p>}
            {msg && <p style={{ color: 'var(--c-teal)', fontSize: '13px', marginBottom: '10px' }}>{msg}</p>}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '4px' }}>
              {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar Akun'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--c-muted)', marginTop: '16px' }}>
          Data tersimpan aman dengan enkripsi
        </p>
      </div>
    </div>
  )
}
