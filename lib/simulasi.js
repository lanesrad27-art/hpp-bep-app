import { useState } from 'react'
import Link from 'next/link'
import { hitungHPP, formatRupiah } from '../lib/kalkulasi'

function Slider({ label, value, min, max, step = 1, onChange, format }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--c-muted)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{format ? format(value) : value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--c-text)' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--c-hint)', marginTop: 2 }}>
        <span>{format ? format(min) : min}</span>
        <span>{format ? format(max) : max}</span>
      </div>
    </div>
  )
}

export default function Simulasi() {
  // Biaya produksi
  const [hpp, setHpp] = useState(5000)
  const [biayaTetap, setBiayaTetap] = useState(2000000)
  const [qty, setQty] = useState(200)

  // Harga jual
  const [hargaJual, setHargaJual] = useState(8000)

  // Kalkulasi
  const margin = hargaJual > 0 ? ((hargaJual - hpp) / hargaJual) * 100 : 0
  const kontribusiMargin = hargaJual - hpp
  const bepUnit = kontribusiMargin > 0 ? Math.ceil(biayaTetap / kontribusiMargin) : 0
  const bepRupiah = bepUnit * hargaJual
  const laba = (hargaJual - hpp) * qty - biayaTetap
  const mosUnit = qty > 0 ? ((qty - bepUnit) / qty) * 100 : 0
  const hargaIdeal30 = hpp / 0.7
  const hargaIdeal40 = hpp / 0.6
  const hargaIdeal50 = hpp / 0.5

  // Skenario volume
  const scenarios = [
    { label: '70%', vol: Math.round(qty * 0.7) },
    { label: '100%', vol: qty },
    { label: '130%', vol: Math.round(qty * 1.3) },
  ]

  const marginColor = margin < 0 ? 'var(--c-red)' : margin < 15 ? 'var(--c-amber)' : margin >= 30 ? 'var(--c-teal)' : 'var(--c-blue)'

  return (
    <div className="page">
      <nav className="nav">
        <div className="nav-inner">
          <div>
            <div className="nav-title">🧮 Simulasi Harga</div>
            <div className="nav-sub">Cari harga jual yang optimal</div>
          </div>
          <Link href="/" className="btn btn-sm">← Beranda</Link>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: 16, paddingBottom: 100 }}>

        {/* Input Biaya */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>⚙️ Parameter Produksi</div>

          <Slider
            label="HPP per Unit"
            value={hpp} min={500} max={100000} step={500}
            onChange={setHpp}
            format={v => formatRupiah(v)}
          />
          <Slider
            label="Biaya Tetap / Bulan"
            value={biayaTetap} min={100000} max={20000000} step={100000}
            onChange={setBiayaTetap}
            format={v => formatRupiah(v)}
          />
          <Slider
            label="Volume Produksi / Bulan"
            value={qty} min={10} max={5000} step={10}
            onChange={setQty}
            format={v => `${v} unit`}
          />
        </div>

        {/* Slider Harga Jual */}
        <div className="card" style={{ border: `2px solid ${marginColor}`, background: `${marginColor}10` }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>💰 Atur Harga Jual</div>
          <div style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 14 }}>Geser slider untuk melihat dampak ke laba & BEP</div>

          <Slider
            label="Harga Jual"
            value={hargaJual} min={Math.round(hpp * 0.5)} max={Math.round(hpp * 4)} step={100}
            onChange={setHargaJual}
            format={v => formatRupiah(v)}
          />

          {/* Result */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 4 }}>MARGIN</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: marginColor }}>{margin.toFixed(1)}%</div>
            </div>
            <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 4 }}>LABA / BULAN</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: laba >= 0 ? 'var(--c-teal)' : 'var(--c-red)' }}>
                {laba >= 0 ? '+' : ''}{formatRupiah(laba)}
              </div>
            </div>
            <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 4 }}>BEP</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{bepUnit} unit</div>
              <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{formatRupiah(bepRupiah)}</div>
            </div>
            <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 4 }}>MARGIN OF SAFETY</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: mosUnit >= 20 ? 'var(--c-teal)' : 'var(--c-amber)' }}>
                {mosUnit.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* Skenario Volume */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>📈 Skenario Volume Penjualan</div>
          {scenarios.map(s => {
            const l = (hargaJual - hpp) * s.vol - biayaTetap
            return (
              <div key={s.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px', borderRadius: 'var(--radius-md)', marginBottom: 8,
                background: s.label === '100%' ? 'var(--c-bg)' : 'transparent',
                border: `1px solid ${s.label === '100%' ? 'var(--c-border)' : 'transparent'}`
              }}>
                <div>
                  <span style={{ fontWeight: 600, marginRight: 8 }}>{s.label}</span>
                  <span style={{ fontSize: 13, color: 'var(--c-muted)' }}>{s.vol} unit</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: l >= 0 ? 'var(--c-teal)' : 'var(--c-red)' }}>
                    {l >= 0 ? '+' : ''}{formatRupiah(l)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{l >= 0 ? 'untung' : 'rugi'}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Rekomendasi Harga */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>💡 Rekomendasi Harga Berdasarkan Target Margin</div>
          {[
            { margin: 30, harga: hargaIdeal30, desc: 'Minimum sehat' },
            { margin: 40, harga: hargaIdeal40, desc: 'Rekomendasi' },
            { margin: 50, harga: hargaIdeal50, desc: 'Premium' },
          ].map(r => (
            <div key={r.margin} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--c-border)' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Margin {r.margin}%</div>
                <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>{r.desc}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{formatRupiah(r.harga)}</span>
                <button
                  className="btn btn-sm"
                  onClick={() => setHargaJual(Math.round(r.harga / 100) * 100)}
                  style={{ fontSize: 11 }}
                >Pakai</button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', padding: '8px 0', display: 'flex', justifyContent: 'space-around' }}>
        <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--c-muted)', textDecoration: 'none', fontSize: 11, gap: 2 }}>
          <span style={{ fontSize: 20 }}>📦</span>Produk
        </Link>
        <Link href="/dashboard" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--c-muted)', textDecoration: 'none', fontSize: 11, gap: 2 }}>
          <span style={{ fontSize: 20 }}>📊</span>Analitik
        </Link>
        <Link href="/simulasi" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--c-text)', textDecoration: 'none', fontSize: 11, gap: 2, fontWeight: 600 }}>
          <span style={{ fontSize: 20 }}>🧮</span>Simulasi
        </Link>
        <Link href="/bandingkan" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--c-muted)', textDecoration: 'none', fontSize: 11, gap: 2 }}>
          <span style={{ fontSize: 20 }}>⚖️</span>Bandingkan
        </Link>
      </div>
    </div>
  )
}
