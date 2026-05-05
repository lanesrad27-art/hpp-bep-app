import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { hitungHPP, formatRupiah, getStatusMargin } from '../lib/kalkulasi'

function Cell({ label, val, subVal, highlight, small }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 6px' }}>
      {label && <div style={{ fontSize: 10, color: 'var(--c-muted)', fontWeight: 500, marginBottom: 3 }}>{label}</div>}
      <div style={{
        fontSize: small ? 13 : 15, fontWeight: 700,
        color: highlight === 'green' ? 'var(--c-teal)' : highlight === 'red' ? 'var(--c-red)' : highlight === 'amber' ? '#D4870F' : 'var(--c-text)'
      }}>{val}</div>
      {subVal && <div style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 1 }}>{subVal}</div>}
    </div>
  )
}

export default function Bandingkan() {
  const router = useRouter()
  const [produkList, setProdukList] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
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
    setProdukList((data || []).map(p => ({ ...p, hasil: hitungHPP(p) })))
    setLoading(false)
  }

  function toggleSelect(id) {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 3 ? [...prev, id] : prev
    )
  }

  const comparing = produkList.filter(p => selected.includes(p.id))

  // Find best in each metric
  function bestIdx(metric, higher = true) {
    if (comparing.length < 2) return -1
    const vals = comparing.map(p => p.hasil[metric])
    const best = higher ? Math.max(...vals) : Math.min(...vals)
    return vals.indexOf(best)
  }

  const bestMargin = bestIdx('margin_aktual')
  const bestLaba = bestIdx('laba_bulanan')
  const bestBep = bestIdx('bep_unit', false)
  const bestHpp = bestIdx('hpp_unit', false)
  const bestMos = bestIdx('margin_of_safety')

  return (
    <div className="page">
      <nav className="nav">
        <div className="nav-inner">
          <div>
            <div className="nav-title">⚖️ Bandingkan Produk</div>
            <div className="nav-sub">Pilih hingga 3 produk</div>
          </div>
          <Link href="/" className="btn btn-sm">← Beranda</Link>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: 16, paddingBottom: 100 }}>

        {loading ? (
          <div className="empty"><div className="empty-icon">⏳</div>Memuat...</div>
        ) : produkList.length < 2 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚖️</div>
            <p style={{ fontWeight: 500 }}>Perlu minimal 2 produk</p>
            <p className="text-muted text-sm" style={{ margin: '8px 0 20px' }}>Tambah lebih banyak produk untuk membandingkannya</p>
            <Link href="/produk/baru" className="btn btn-primary">Tambah Produk</Link>
          </div>
        ) : (
          <>
            {/* Pilih produk */}
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Pilih produk untuk dibandingkan</div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 12 }}>Maksimal 3 produk • {selected.length}/3 dipilih</div>
              {produkList.map(p => {
                const isSelected = selected.includes(p.id)
                const st = getStatusMargin(p.hasil.margin_aktual, p.target_margin)
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleSelect(p.id)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 14px', borderRadius: 'var(--radius-md)', marginBottom: 8,
                      border: `2px solid ${isSelected ? 'var(--c-text)' : 'var(--c-border)'}`,
                      background: isSelected ? 'var(--c-bg)' : 'var(--c-surface)',
                      cursor: 'pointer', transition: 'all 0.15s',
                      opacity: !isSelected && selected.length >= 3 ? 0.4 : 1
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{p.nama}</div>
                      <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>{p.kategori} · {formatRupiah(p.hasil.hpp_unit)}/unit</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className={`badge badge-${st.color === 'green' ? 'green' : st.color === 'amber' ? 'amber' : st.color === 'red' ? 'red' : 'blue'}`}>{st.label}</span>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        border: `2px solid ${isSelected ? 'var(--c-text)' : 'var(--c-border)'}`,
                        background: isSelected ? 'var(--c-text)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 14, flexShrink: 0
                      }}>
                        {isSelected ? '✓' : ''}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Tabel Perbandingan */}
            {comparing.length >= 2 && (
              <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--c-border)' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Perbandingan Detail</div>
                  <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>🏆 = terbaik di metrik ini</div>
                </div>

                {/* Header row */}
                <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${comparing.length}, 1fr)`, borderBottom: '1px solid var(--c-border)' }}>
                  <div />
                  {comparing.map((p, i) => (
                    <div key={p.id} style={{ padding: '10px 6px', textAlign: 'center', borderLeft: '1px solid var(--c-border)' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>{p.nama}</div>
                      <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{p.kategori}</div>
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {[
                  {
                    label: 'Harga Jual', key: null,
                    vals: comparing.map(p => ({ val: formatRupiah(p.harga_jual) })),
                  },
                  {
                    label: 'HPP/Unit', key: 'hpp_unit', lower: true,
                    vals: comparing.map((p, i) => ({
                      val: formatRupiah(p.hasil.hpp_unit),
                      best: i === bestHpp
                    })),
                  },
                  {
                    label: 'Margin', key: 'margin_aktual', lower: false,
                    vals: comparing.map((p, i) => ({
                      val: `${p.hasil.margin_aktual.toFixed(1)}%`,
                      best: i === bestMargin,
                      color: p.hasil.margin_aktual < 0 ? 'red' : p.hasil.margin_aktual < 15 ? 'amber' : 'green'
                    })),
                  },
                  {
                    label: 'BEP Unit', key: 'bep_unit', lower: true,
                    vals: comparing.map((p, i) => ({
                      val: `${p.hasil.bep_unit} unit`,
                      sub: formatRupiah(p.hasil.bep_rupiah),
                      best: i === bestBep
                    })),
                  },
                  {
                    label: 'Laba/Bulan', key: 'laba_bulanan', lower: false,
                    vals: comparing.map((p, i) => ({
                      val: formatRupiah(p.hasil.laba_bulanan),
                      best: i === bestLaba,
                      color: p.hasil.laba_bulanan < 0 ? 'red' : 'green'
                    })),
                  },
                  {
                    label: 'Margin of Safety', key: 'margin_of_safety', lower: false,
                    vals: comparing.map((p, i) => ({
                      val: `${p.hasil.margin_of_safety.toFixed(0)}%`,
                      best: i === bestMos,
                      color: p.hasil.margin_of_safety < 10 ? 'red' : 'green'
                    })),
                  },
                  {
                    label: 'Biaya Tetap', key: null,
                    vals: comparing.map(p => ({ val: formatRupiah(p.hasil.biaya_tetap) })),
                  },
                ].map((row, ri) => (
                  <div key={ri} style={{
                    display: 'grid',
                    gridTemplateColumns: `100px repeat(${comparing.length}, 1fr)`,
                    borderBottom: '1px solid var(--c-border)',
                    background: ri % 2 === 0 ? 'transparent' : 'var(--c-bg)'
                  }}>
                    <div style={{ padding: '10px 8px', display: 'flex', alignItems: 'center', fontSize: 11, color: 'var(--c-muted)', fontWeight: 500, lineHeight: 1.3 }}>
                      {row.label}
                    </div>
                    {row.vals.map((v, i) => (
                      <div key={i} style={{ borderLeft: '1px solid var(--c-border)', textAlign: 'center', padding: '10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                          fontSize: 14, fontWeight: 700,
                          color: v.color === 'green' ? 'var(--c-teal)' : v.color === 'red' ? 'var(--c-red)' : v.color === 'amber' ? '#D4870F' : 'var(--c-text)'
                        }}>
                          {v.best ? '🏆 ' : ''}{v.val}
                        </div>
                        {v.sub && <div style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 2 }}>{v.sub}</div>}
                      </div>
                    ))}
                  </div>
                ))}

                {/* Skenario Moderat */}
                <div style={{ padding: '10px 12px', background: 'var(--c-teal-bg)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-teal)', marginBottom: 8 }}>Skenario Moderat (100% volume)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${comparing.length}, 1fr)`, gap: 8 }}>
                    {comparing.map(p => (
                      <div key={p.id} style={{ background: 'var(--c-surface)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 4, lineHeight: 1.3 }}>{p.nama}</div>
                        <div style={{ fontWeight: 700, color: p.hasil.skenario.moderat.untung ? 'var(--c-teal)' : 'var(--c-red)', fontSize: 13 }}>
                          {formatRupiah(p.hasil.skenario.moderat.laba)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selected.length === 1 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--c-muted)', fontSize: 14 }}>
                Pilih 1 produk lagi untuk mulai membandingkan
              </div>
            )}
            {selected.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--c-muted)', fontSize: 14 }}>
                Pilih 2-3 produk di atas untuk membandingkan
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', padding: '8px 0', display: 'flex', justifyContent: 'space-around' }}>
        <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--c-muted)', textDecoration: 'none', fontSize: 11, gap: 2 }}>
          <span style={{ fontSize: 20 }}>📦</span>Produk
        </Link>
        <Link href="/dashboard" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--c-muted)', textDecoration: 'none', fontSize: 11, gap: 2 }}>
          <span style={{ fontSize: 20 }}>📊</span>Analitik
        </Link>
        <Link href="/simulasi" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--c-muted)', textDecoration: 'none', fontSize: 11, gap: 2 }}>
          <span style={{ fontSize: 20 }}>🧮</span>Simulasi
        </Link>
        <Link href="/bandingkan" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--c-text)', textDecoration: 'none', fontSize: 11, gap: 2, fontWeight: 600 }}>
          <span style={{ fontSize: 20 }}>⚖️</span>Bandingkan
        </Link>
      </div>
    </div>
  )
}
