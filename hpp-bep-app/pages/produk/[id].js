import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { hitungHPP, formatRupiah } from '../../lib/kalkulasi'

const EMPTY_PRODUK = {
  nama: '', kategori: 'Kuliner', satuan: 'pcs', qty_produksi: 100,
  harga_jual: 0, target_margin: 30,
  upah_harian: 100000, hari_kerja: 22, jumlah_naker: 1,
  biaya_listrik: 300000, biaya_sewa: 500000,
  biaya_kemasan: 500, biaya_lain: 100000, biaya_tetap_lain: 1000000,
}

export default function ProdukForm() {
  const router = useRouter()
  const { id } = router.query
  const isNew = id === 'baru'

  const [tab, setTab] = useState(0)
  const [form, setForm] = useState(EMPTY_PRODUK)
  const [bahan, setBahan] = useState([{ nama: '', qty: '', biaya: '' }, { nama: '', qty: '', biaya: '' }])
  const [hasil, setHasil] = useState(null)
  const [saving, setSaving] = useState(false)
  const [chatMsgs, setChatMsgs] = useState([{ role: 'bot', text: 'Halo! Hitung HPP & BEP dulu, lalu tanya saya apa saja tentang keuangan produk Anda.' }])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      if (!isNew && id) loadProduk(id)
    })
  }, [id])

  async function loadProduk(pid) {
    const { data } = await supabase.from('produk').select('*, bahan_baku(*)').eq('id', pid).single()
    if (!data) return
    const { bahan_baku: bb, ...rest } = data
    setForm(rest)
    if (bb?.length) setBahan(bb.map(b => ({ nama: b.nama, qty: b.qty || '', biaya: b.biaya })))
    // Auto-hitung
    const h = hitungHPP({ ...rest, bahan_baku: bb || [] })
    setHasil(h)
  }

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const num = (k) => (e) => set(k, parseFloat(e.target.value) || 0)

  function addBahan() { setBahan(prev => [...prev, { nama: '', qty: '', biaya: '' }]) }
  function delBahan(i) { setBahan(prev => prev.filter((_, idx) => idx !== i)) }
  function setBahanField(i, k, v) { setBahan(prev => prev.map((b, idx) => idx === i ? { ...b, [k]: v } : b)) }

  function hitung() {
    const h = hitungHPP({ ...form, bahan_baku: bahan })
    setHasil(h)
    setTab(1)
  }

  async function simpan() {
    if (!hasil) { alert('Hitung dulu sebelum menyimpan!'); return }
    setSaving(true)

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    const res = await fetch('/api/produk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produk: { ...form, id: isNew ? undefined : id },
        bahan_baku: bahan.filter(b => b.nama && b.biaya),
        hasil: {
          hpp_unit: hasil.hpp_unit, hpp_total: hasil.hpp_total,
          bep_unit: hasil.bep_unit, bep_rupiah: hasil.bep_rupiah,
          margin_aktual: hasil.margin_aktual, laba_bulanan: hasil.laba_bulanan,
          harga_ideal: hasil.harga_ideal,
        },
        token,
      }),
    })

    const data = await res.json()
    setSaving(false)
    if (data.success) {
      alert('Tersimpan!')
      if (isNew) router.push(`/produk/${data.produk_id}`)
    } else {
      alert('Gagal simpan: ' + data.error)
    }
  }

  async function kirimChat() {
    const msg = chatInput.trim(); if (!msg) return
    setChatInput('')
    setChatMsgs(prev => [...prev, { role: 'user', text: msg }, { role: 'bot', text: '...', loading: true }])
    setChatLoading(true)

    const res = await fetch('/api/ai-konsultan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        keuangan: hasil ? {
          nama: form.nama, kategori: form.kategori,
          hpp_unit: hasil.hpp_unit, harga_jual: form.harga_jual,
          bep_unit: hasil.bep_unit, margin_aktual: hasil.margin_aktual,
          laba_bulanan: hasil.laba_bulanan,
        } : null,
      }),
    })
    const data = await res.json()
    setChatMsgs(prev => prev.map((m, i) => i === prev.length - 1 ? { role: 'bot', text: data.reply || data.error } : m))
    setChatLoading(false)
  }

  const TABS = ['Input', 'Hasil', 'Simulasi', 'AI']

  return (
    <div className="page">
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="btn btn-sm" style={{ padding: '7px 12px' }}>← Kembali</Link>
          <div style={{ textAlign: 'center' }}>
            <div className="nav-title">{isNew ? 'Produk Baru' : (form.nama || 'Edit Produk')}</div>
          </div>
          <button className="btn btn-sm btn-primary" onClick={simpan} disabled={saving}>
            {saving ? '...' : 'Simpan'}
          </button>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '16px', paddingBottom: '80px' }}>
        <div className="tabs">
          {TABS.map((t, i) => (
            <button key={t} className={`tab-btn ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{t}</button>
          ))}
        </div>

        {/* TAB 0: INPUT */}
        {tab === 0 && (
          <>
            <div className="card">
              <div className="section-title"><span className="dot dot-amber"></span>Info Produk</div>
              <div className="field"><label>Nama Produk</label>
                <input value={form.nama} onChange={e => set('nama', e.target.value)} placeholder="mis. Keripik Singkong" />
              </div>
              <div className="field-row">
                <div className="field"><label>Kategori</label>
                  <select value={form.kategori} onChange={e => set('kategori', e.target.value)}>
                    <option>Kuliner</option><option>Kerajinan</option><option>Manufaktur</option>
                  </select>
                </div>
                <div className="field"><label>Satuan</label>
                  <select value={form.satuan} onChange={e => set('satuan', e.target.value)}>
                    <option>pcs</option><option>kg</option><option>liter</option><option>paket</option><option>lusin</option>
                  </select>
                </div>
              </div>
              <div className="field-row">
                <div className="field"><label>Produksi / bulan</label>
                  <input type="number" value={form.qty_produksi} onChange={num('qty_produksi')} />
                </div>
                <div className="field"><label>Target Margin (%)</label>
                  <input type="number" value={form.target_margin} onChange={num('target_margin')} />
                </div>
              </div>
              <div className="field"><label>Harga Jual (Rp/unit)</label>
                <input type="number" value={form.harga_jual} onChange={num('harga_jual')} placeholder="15000" />
              </div>
            </div>

            <div className="card">
              <div className="section-title"><span className="dot dot-teal"></span>Bahan Baku</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 28px', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--c-muted)' }}>Nama Bahan</span>
                <span style={{ fontSize: '11px', color: 'var(--c-muted)' }}>Qty</span>
                <span style={{ fontSize: '11px', color: 'var(--c-muted)' }}>Biaya (Rp)</span>
                <span></span>
              </div>
              {bahan.map((b, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 28px', gap: '6px', marginBottom: '6px' }}>
                  <input value={b.nama} onChange={e => setBahanField(i, 'nama', e.target.value)} placeholder="Nama bahan" style={{ padding: '8px', fontSize: '13px', border: '1px solid var(--c-border)', borderRadius: '8px', background: 'var(--c-bg)', color: 'var(--c-text)' }} />
                  <input type="number" value={b.qty} onChange={e => setBahanField(i, 'qty', e.target.value)} placeholder="500" style={{ padding: '8px', fontSize: '13px', border: '1px solid var(--c-border)', borderRadius: '8px', background: 'var(--c-bg)', color: 'var(--c-text)' }} />
                  <input type="number" value={b.biaya} onChange={e => setBahanField(i, 'biaya', e.target.value)} placeholder="6000" style={{ padding: '8px', fontSize: '13px', border: '1px solid var(--c-border)', borderRadius: '8px', background: 'var(--c-bg)', color: 'var(--c-text)' }} />
                  <button onClick={() => delBahan(i)} style={{ width: '28px', height: '36px', border: 'none', background: 'transparent', color: 'var(--c-muted)', cursor: 'pointer', fontSize: '16px' }}>×</button>
                </div>
              ))}
              <button onClick={addBahan} style={{ width: '100%', padding: '8px', fontSize: '13px', background: 'transparent', border: '1px dashed var(--c-border)', borderRadius: '8px', color: 'var(--c-muted)', cursor: 'pointer', marginTop: '4px' }}>
                + Tambah Bahan
              </button>
            </div>

            <div className="card">
              <div className="section-title"><span className="dot dot-blue"></span>Tenaga Kerja</div>
              <div className="field-row">
                <div className="field"><label>Upah per hari (Rp)</label>
                  <input type="number" value={form.upah_harian} onChange={num('upah_harian')} />
                </div>
                <div className="field"><label>Hari kerja / bulan</label>
                  <input type="number" value={form.hari_kerja} onChange={num('hari_kerja')} />
                </div>
              </div>
              <div className="field"><label>Jumlah tenaga kerja</label>
                <input type="number" value={form.jumlah_naker} onChange={num('jumlah_naker')} />
              </div>
            </div>

            <div className="card">
              <div className="section-title"><span className="dot dot-purple"></span>Biaya Overhead</div>
              <div className="field-row">
                <div className="field"><label>Listrik + Air (Rp/bln)</label>
                  <input type="number" value={form.biaya_listrik} onChange={num('biaya_listrik')} />
                </div>
                <div className="field"><label>Sewa Tempat (Rp/bln)</label>
                  <input type="number" value={form.biaya_sewa} onChange={num('biaya_sewa')} />
                </div>
              </div>
              <div className="field-row">
                <div className="field"><label>Kemasan (Rp/unit)</label>
                  <input type="number" value={form.biaya_kemasan} onChange={num('biaya_kemasan')} />
                </div>
                <div className="field"><label>Lain-lain (Rp/bln)</label>
                  <input type="number" value={form.biaya_lain} onChange={num('biaya_lain')} />
                </div>
              </div>
              <div className="field"><label>Biaya Tetap lain / bulan (Rp) <span style={{ color: 'var(--c-hint)', fontSize: '11px' }}>gaji admin, cicilan</span></label>
                <input type="number" value={form.biaya_tetap_lain} onChange={num('biaya_tetap_lain')} />
              </div>
            </div>

            <button className="btn btn-primary btn-full" onClick={hitung} style={{ fontSize: '16px', padding: '14px' }}>
              Hitung HPP & BEP →
            </button>
          </>
        )}

        {/* TAB 1: HASIL */}
        {tab === 1 && (
          <>
            {!hasil ? (
              <div className="empty">
                <div className="empty-icon">🧮</div>
                <p>Isi data di tab <strong>Input</strong> lalu klik <strong>Hitung</strong></p>
              </div>
            ) : (
              <>
                <div className="card">
                  <div className="section-title"><span className="dot dot-teal"></span>Harga Pokok Produksi (HPP)</div>
                  <div className="metric-grid">
                    <div className="metric"><div className="metric-label">HPP per Unit</div><div className="metric-value teal">{formatRupiah(hasil.hpp_unit)}</div></div>
                    <div className="metric"><div className="metric-label">HPP Total / bulan</div><div className="metric-value">{formatRupiah(hasil.hpp_total)}</div></div>
                    <div className="metric"><div className="metric-label">Biaya Bahan Baku</div><div className="metric-value amber">{formatRupiah(hasil.total_bahan)}</div></div>
                    <div className="metric"><div className="metric-label">TK + Overhead</div><div className="metric-value blue">{formatRupiah(hasil.total_tk + hasil.total_oh)}</div></div>
                  </div>
                </div>

                <div className="card">
                  <div className="section-title"><span className="dot dot-amber"></span>Break Even Point (BEP)</div>
                  <div className="metric-grid">
                    <div className="metric"><div className="metric-label">BEP Unit</div><div className="metric-value amber">{hasil.bep_unit} unit</div></div>
                    <div className="metric"><div className="metric-label">BEP Rupiah</div><div className="metric-value">{formatRupiah(hasil.bep_rupiah)}</div></div>
                  </div>
                  <div style={{ margin: '8px 0' }}>
                    <div className="bar-track">
                      <div className="bar-fill teal" style={{ width: `${Math.min(100, Math.max(5, (hasil.bep_unit / form.qty_produksi) * 100))}%` }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--c-muted)', marginTop: '4px' }}>
                      <span>0</span><span>BEP: {hasil.bep_unit} unit</span><span>{form.qty_produksi} unit</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--c-muted)' }}>
                    Margin of Safety: <strong>{hasil.margin_of_safety > 0 ? hasil.margin_of_safety.toFixed(1) + '%' : 'Di bawah BEP'}</strong>
                  </p>
                </div>

                <div className="card">
                  <div className="section-title"><span className="dot dot-purple"></span>Analisis Harga Jual</div>
                  <div className="metric-grid">
                    <div className="metric"><div className="metric-label">Margin Aktual</div><div className="metric-value purple">{hasil.margin_aktual.toFixed(1)}%</div></div>
                    <div className="metric"><div className="metric-label">Harga Ideal ({form.target_margin}%)</div><div className="metric-value teal">{formatRupiah(hasil.harga_ideal)}</div></div>
                    <div className="metric"><div className="metric-label">Laba / bulan</div><div className={`metric-value ${hasil.laba_bulanan >= 0 ? 'teal' : 'red'}`}>{formatRupiah(hasil.laba_bulanan)}</div></div>
                    <div className="metric"><div className="metric-label">Contribution Margin</div><div className="metric-value blue">{formatRupiah(hasil.contribution_margin)}</div></div>
                  </div>
                </div>

                <div className="card">
                  <div className="section-title"><span className="dot dot-blue"></span>Rekomendasi</div>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--c-muted)' }}>
                    {hasil.margin_aktual < 0
                      ? '⚠️ Harga jual lebih rendah dari HPP — Anda rugi di setiap unit yang terjual. Naikkan harga atau efisienkan biaya segera.'
                      : hasil.margin_aktual < 15
                      ? `⚠️ Margin sangat tipis (${hasil.margin_aktual.toFixed(1)}%). Pertimbangkan menaikkan harga ke ${formatRupiah(hasil.harga_ideal)} untuk margin ${form.target_margin}%.`
                      : hasil.margin_aktual >= form.target_margin
                      ? `✅ Margin ${hasil.margin_aktual.toFixed(1)}% sudah memenuhi target. BEP di ${hasil.bep_unit} unit — pastikan volume melampaui angka ini setiap bulan.`
                      : `📈 Margin ${hasil.margin_aktual.toFixed(1)}% belum mencapai target ${form.target_margin}%. Harga ideal: ${formatRupiah(hasil.harga_ideal)}.`
                    }
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {/* TAB 2: SIMULASI */}
        {tab === 2 && (
          <>
            {!hasil ? (
              <div className="empty"><div className="empty-icon">📊</div><p>Hitung HPP & BEP dulu di tab Input</p></div>
            ) : (
              <SimulasiTab form={form} hasil={hasil} />
            )}
          </>
        )}

        {/* TAB 3: AI */}
        {tab === 3 && (
          <div className="card">
            <div className="section-title"><span className="dot dot-purple"></span>AI Konsultan UMKM</div>
            <div className="chat-wrap" id="chat-wrap">
              {chatMsgs.map((m, i) => (
                <div key={i} className={`bubble ${m.role} ${m.loading ? 'loading' : ''}`}>{m.text}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !chatLoading && kirimChat()}
                placeholder="Tanya tentang HPP, BEP, harga..."
                style={{ flex: 1, padding: '10px 12px', fontSize: '14px', borderRadius: '20px', border: '1px solid var(--c-border)', background: 'var(--c-bg)', color: 'var(--c-text)', outline: 'none' }}
              />
              <button onClick={kirimChat} disabled={chatLoading} className="btn btn-primary" style={{ borderRadius: '20px', padding: '10px 16px' }}>
                Kirim
              </button>
            </div>
            <div style={{ marginTop: '14px' }}>
              <p style={{ fontSize: '11px', color: 'var(--c-muted)', marginBottom: '8px' }}>Pertanyaan cepat:</p>
              {['Apakah harga jual saya sudah untung?', 'Bagaimana cara turunkan HPP?', 'Target penjualan minimal per minggu?'].map(q => (
                <button key={q} onClick={() => { setChatInput(q); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', marginBottom: '6px', fontSize: '13px', background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: '8px', cursor: 'pointer', color: 'var(--c-muted)' }}>
                  → {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SimulasiTab({ form, hasil }) {
  const [harga, setHarga] = useState(form.harga_jual)
  const [vol, setVol] = useState(form.qty_produksi)

  const pendapatan = harga * vol
  const total_cost = hasil.hpp_unit * vol + (form.biaya_tetap_lain || 0)
  const laba = pendapatan - total_cost
  const margin = pendapatan > 0 ? (laba / pendapatan * 100) : 0

  const sk = (mult) => {
    const v = Math.round(vol * mult)
    const l = harga * v - (hasil.hpp_unit * v + (form.biaya_tetap_lain || 0))
    return l
  }

  return (
    <>
      <div className="card">
        <div className="section-title"><span className="dot dot-amber"></span>Simulasi Harga & Volume</div>
        <div className="field">
          <label>Harga jual: <strong>{formatRupiah(harga)}</strong></label>
          <input type="range" min="1000" max="200000" step="500" value={harga} onChange={e => setHarga(+e.target.value)} style={{ marginTop: '6px' }} />
        </div>
        <div className="field">
          <label>Volume penjualan: <strong>{vol} unit</strong></label>
          <input type="range" min="10" max="1000" step="10" value={vol} onChange={e => setVol(+e.target.value)} style={{ marginTop: '6px' }} />
        </div>
      </div>

      <div className="card">
        <div className="section-title"><span className="dot dot-teal"></span>Hasil Simulasi</div>
        <div className="metric-grid">
          <div className="metric"><div className="metric-label">Pendapatan</div><div className="metric-value">{formatRupiah(pendapatan)}</div></div>
          <div className="metric"><div className="metric-label">Laba Bersih</div><div className={`metric-value ${laba >= 0 ? 'teal' : 'red'}`}>{formatRupiah(laba)}</div></div>
          <div className="metric"><div className="metric-label">Margin</div><div className="metric-value purple">{margin.toFixed(1)}%</div></div>
          <div className="metric"><div className="metric-label">Status</div>
            <span className={`badge ${laba > 0 ? 'badge-green' : laba === 0 ? 'badge-amber' : 'badge-red'}`}>
              {laba > 0 ? 'Untung' : laba === 0 ? 'BEP' : 'Rugi'}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title"><span className="dot dot-blue"></span>Skenario 3 Kondisi</div>
        {[['Pesimis (70%)', 0.7, 'red'], ['Moderat (100%)', 1.0, 'amber'], ['Optimis (130%)', 1.3, 'green']].map(([label, mult, color]) => {
          const l = sk(mult)
          return (
            <div key={label} className="row-item">
              <span style={{ fontSize: '13px', color: 'var(--c-muted)' }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{formatRupiah(l)}</span>
                <span className={`badge badge-${l > 0 ? 'green' : l === 0 ? 'amber' : 'red'}`}>{l > 0 ? 'Untung' : l === 0 ? 'BEP' : 'Rugi'}</span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
