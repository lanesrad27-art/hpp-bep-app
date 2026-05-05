import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { hitungHPP, formatRupiah, getStatusMargin } from '../lib/kalkulasi'

export default function Dashboard() {
  const router = useRouter()
  const [produkList, setProdukList] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      loadProduk(session.user.id)
    })
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

  const hasilList = produkList.map(p => ({ ...p, hasil: hitungHPP(p) }))

  const totalLaba = hasilList.reduce((s, p) => s + (p.hasil.laba_bulanan || 0), 0)
  const totalProduk = produkList.length
  const rataMargin = hasilList.length > 0
    ? hasilList.reduce((s, p) => s + p.hasil.margin_aktual, 0) / hasilList.length
    : 0
  const produkSehat = hasilList.filter(p => p.hasil.margin_aktual >= p.target_margin).length

  // For bar chart: sort by laba
  const sorted = [...hasilList].sort((a, b) => b.hasil.laba_bulanan - a.hasil.laba_bulanan)
  const maxLaba = Math.max(...sorted.map(p => Math.abs(p.hasil.laba_bulanan)), 1)

  // Kategori breakdown
  const kategoriMap = {}
  hasilList.forEach(p => {
    if (!kategoriMap[p.kategori]) kategoriMap[p.kategori] = { count: 0, laba: 0 }
    kategoriMap[p.kategori].count++
    kategoriMap[p.kategori].laba += p.hasil.laba_bulanan
  })
  const kategoriList = Object.entries(kategoriMap)

  return (
    <div className="page">
      <nav className="nav">
        <div className="nav-inner">
          <div>
            <div className="nav-title">📊 Analitik</div>
            <div className="nav-sub">Ringkasan bisnis Anda</div>
          </div>
          <Link href="/" className="btn btn-sm">← Kembali</Link>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: 16, paddingBottom: 80 }}>
        {loading ? (
          <div className="empty"><div className="empty-icon">⏳</div>Memuat...</div>
        ) : totalProduk === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <p style={{ fontWeight: 500 }}>Belum ada data produk</p>
            <p className="text-muted text-sm" style={{ margin: '8px 0 20px' }}>Tambah produk dulu untuk melihat analitik</p>
            <Link href="/produk/baru" className="btn btn-primary">Tambah Produk</Link>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div className="card" style={{ margin: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--c-muted)', fontWeight: 500, marginBottom: 4 }}>EST. LABA / BULAN</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: totalLaba >= 0 ? 'var(--c-teal)' : 'var(--c-red)' }}>
                  {formatRupiah(totalLaba)}
                </div>
              </div>
              <div className="card" style={{ margin: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--c-muted)', fontWeight: 500, marginBottom: 4 }}>RATA MARGIN</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: rataMargin >= 20 ? 'var(--c-teal)' : 'var(--c-amber)' }}>
                  {rataMargin.toFixed(1)}%
                </div>
              </div>
              <div className="card" style={{ margin: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--c-muted)', fontWeight: 500, marginBottom: 4 }}>TOTAL PRODUK</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{totalProduk}</div>
              </div>
              <div className="card" style={{ margin: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--c-muted)', fontWeight: 500, marginBottom: 4 }}>PRODUK SEHAT</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--c-teal)' }}>
                  {produkSehat}/{totalProduk}
                </div>
              </div>
            </div>

            {/* Bar Chart Laba per Produk */}
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Laba / Bulan per Produk</div>
              {sorted.map(p => {
                const laba = p.hasil.laba_bulanan
                const pct = (Math.abs(laba) / maxLaba) * 100
                const st = getStatusMargin(p.hasil.margin_aktual, p.target_margin)
                return (
                  <div key={p.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                      <span style={{ fontWeight: 500, maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nama}</span>
                      <span style={{ color: laba >= 0 ? 'var(--c-teal)' : 'var(--c-red)', fontWeight: 600 }}>
                        {laba >= 0 ? '+' : ''}{formatRupiah(laba)}
                      </span>
                    </div>
                    <div style={{ height: 8, background: 'var(--c-bg)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--c-border)' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: laba >= 0
                          ? (st.color === 'green' ? 'var(--c-teal)' : st.color === 'amber' ? 'var(--c-amber)' : 'var(--c-blue)')
                          : 'var(--c-red)',
                        borderRadius: 4,
                        transition: 'width 0.6s ease'
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Margin health per produk */}
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Status Margin Tiap Produk</div>
              {hasilList.map(p => {
                const st = getStatusMargin(p.hasil.margin_aktual, p.target_margin)
                const fillPct = Math.min(Math.max(p.hasil.margin_aktual, 0), 100)
                const targetPct = Math.min(p.target_margin, 100)
                return (
                  <Link key={p.id} href={`/produk/${p.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit', marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, fontSize: 13 }}>
                      <span style={{ fontWeight: 500 }}>{p.nama}</span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ color: 'var(--c-muted)', fontSize: 12 }}>{p.hasil.margin_aktual.toFixed(1)}%</span>
                        <span className={`badge badge-${st.color === 'green' ? 'green' : st.color === 'amber' ? 'amber' : st.color === 'red' ? 'red' : 'blue'}`} style={{ fontSize: 11 }}>{st.label}</span>
                      </div>
                    </div>
                    <div style={{ position: 'relative', height: 8, background: 'var(--c-bg)', borderRadius: 4, border: '1px solid var(--c-border)' }}>
                      <div style={{
                        height: '100%', width: `${fillPct}%`,
                        background: st.color === 'green' ? 'var(--c-teal)' : st.color === 'amber' ? '#D4870F' : st.color === 'red' ? 'var(--c-red)' : 'var(--c-blue)',
                        borderRadius: 4
                      }} />
                      {/* Target line */}
                      <div style={{
                        position: 'absolute', top: -2, bottom: -2,
                        left: `${targetPct}%`, width: 2,
                        background: 'var(--c-text)', borderRadius: 2, opacity: 0.4
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--c-hint)', marginTop: 2 }}>Target: {p.target_margin}%</div>
                  </Link>
                )
              })}
            </div>

            {/* Breakdown per Kategori */}
            {kategoriList.length > 1 && (
              <div className="card">
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Per Kategori</div>
                {kategoriList.map(([kat, data]) => (
                  <div key={kat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--c-border)' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{kat}</div>
                      <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>{data.count} produk</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: data.laba >= 0 ? 'var(--c-teal)' : 'var(--c-red)' }}>
                        {data.laba >= 0 ? '+' : ''}{formatRupiah(data.laba)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>/ bulan</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* BEP Summary */}
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Ringkasan BEP</div>
              {hasilList.map(p => (
                <Link key={p.id} href={`/produk/${p.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ padding: '10px 0', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{p.nama}</div>
                      <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
                        BEP: {p.hasil.bep_unit} unit · MoS: {p.hasil.margin_of_safety.toFixed(0)}%
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{formatRupiah(p.hasil.bep_rupiah)}</div>
                      <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>titik impas</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', padding: '8px 0', display: 'flex', justifyContent: 'space-around' }}>
        <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--c-muted)', textDecoration: 'none', fontSize: 11, gap: 2 }}>
          <span style={{ fontSize: 20 }}>📦</span>Produk
        </Link>
        <Link href="/dashboard" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--c-text)', textDecoration: 'none', fontSize: 11, gap: 2, fontWeight: 600 }}>
          <span style={{ fontSize: 20 }}>📊</span>Analitik
        </Link>
        <Link href="/simulasi" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--c-muted)', textDecoration: 'none', fontSize: 11, gap: 2 }}>
          <span style={{ fontSize: 20 }}>🧮</span>Simulasi
        </Link>
        <Link href="/bandingkan" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--c-muted)', textDecoration: 'none', fontSize: 11, gap: 2 }}>
          <span style={{ fontSize: 20 }}>⚖️</span>Bandingkan
        </Link>
      </div>
    </div>
  )
}
