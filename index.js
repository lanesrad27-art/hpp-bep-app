import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { hitungHPP, formatRupiah, getStatusMargin } from '../lib/kalkulasi'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [produkList, setProdukList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      loadProduk(session.user.id)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.push('/login')
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function loadProduk(uid) {
    setLoading(true)
    const { data } = await supabase
      .from('produk')
      .select('*, bahan_baku(*)')
      .eq('user_id', uid)
      .order('updated_at', { ascending: false })
    setProdukList(data || [])
    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function hapusProduk(id, e) {
    e.preventDefault(); e.stopPropagation()
    if (!confirm('Hapus produk ini?')) return
    await supabase.from('produk').delete().eq('id', id)
    setProdukList(prev => prev.filter(p => p.id !== id))
  }

  const totalLaba = produkList.reduce((sum, p) => {
    const h = hitungHPP(p); return sum + (h.laba_bulanan || 0)
  }, 0)

  return (
    <div className="page">
      <nav className="nav">
        <div className="nav-inner">
          <div>
            <div className="nav-title">HPP & BEP UMKM</div>
            <div className="nav-sub">{user?.email}</div>
          </div>
          <button className="btn btn-sm" onClick={logout}>Keluar</button>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '16px', paddingBottom: '80px' }}>

        {/* Summary */}
        {produkList.length > 0 && (
          <div className="metric-grid" style={{ marginBottom: '20px' }}>
            <div className="metric">
              <div className="metric-label">Total Produk</div>
              <div className="metric-value">{produkList.length}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Est. Laba / Bulan</div>
              <div className={`metric-value ${totalLaba >= 0 ? 'teal' : 'red'}`}>{formatRupiah(totalLaba)}</div>
            </div>
          </div>
        )}

        {/* Produk list */}
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Produk Saya</h2>
          <Link href="/produk/baru" className="btn btn-primary btn-sm">+ Tambah</Link>
        </div>

        {loading ? (
          <div className="empty"><div className="empty-icon">⏳</div>Memuat data...</div>
        ) : produkList.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
            <p style={{ fontWeight: 500, marginBottom: '6px' }}>Belum ada produk</p>
            <p className="text-muted text-sm" style={{ marginBottom: '20px' }}>Tambah produk pertama Anda untuk mulai hitung HPP & BEP</p>
            <Link href="/produk/baru" className="btn btn-primary">Tambah Produk Pertama</Link>
          </div>
        ) : (
          produkList.map(p => {
            const h = hitungHPP(p)
            const st = getStatusMargin(h.margin_aktual, p.target_margin)
            return (
              <Link key={p.id} href={`/produk/${p.id}`} className="produk-item">
                <div>
                  <div className="produk-nama">{p.nama}</div>
                  <div className="produk-meta">{p.kategori} · HPP {formatRupiah(h.hpp_unit)}/unit · BEP {h.bep_unit} unit</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <span className={`badge badge-${st.color === 'green' ? 'green' : st.color === 'amber' ? 'amber' : st.color === 'red' ? 'red' : 'blue'}`}>{st.label}</span>
                  <button className="btn btn-sm btn-danger" onClick={(e) => hapusProduk(p.id, e)} style={{ padding: '3px 8px', fontSize: '11px' }}>Hapus</button>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
