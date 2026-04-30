/**
 * Kalkulasi HPP (Harga Pokok Produksi) dan BEP (Break Even Point)
 */

export function hitungHPP(data) {
  const {
    qty_produksi,
    bahan_baku,
    upah_harian,
    hari_kerja,
    jumlah_naker,
    biaya_listrik,
    biaya_sewa,
    biaya_kemasan,
    biaya_lain,
    biaya_tetap_lain,
    harga_jual,
    target_margin,
  } = data

  const qty = parseFloat(qty_produksi) || 1

  // Biaya Bahan Baku total
  const total_bahan = (bahan_baku || []).reduce(
    (sum, b) => sum + (parseFloat(b.biaya) || 0),
    0
  )

  // Biaya Tenaga Kerja Langsung
  const total_tk = (parseFloat(upah_harian) || 0) *
    (parseFloat(hari_kerja) || 0) *
    (parseFloat(jumlah_naker) || 1)

  // Biaya Overhead
  const total_oh =
    (parseFloat(biaya_listrik) || 0) +
    (parseFloat(biaya_sewa) || 0) +
    (parseFloat(biaya_kemasan) || 0) * qty +
    (parseFloat(biaya_lain) || 0)

  const hpp_total = total_bahan + total_tk + total_oh
  const hpp_unit = hpp_total / qty

  // Harga Jual & Margin
  const hj = parseFloat(harga_jual) || 0
  const margin_aktual = hj > 0 ? ((hj - hpp_unit) / hj) * 100 : 0
  const tm = parseFloat(target_margin) || 30
  const harga_ideal = tm < 100 ? hpp_unit / (1 - tm / 100) : hpp_unit

  // BEP — biaya tetap = TK + overhead tetap + biaya tetap lain
  const biaya_tetap =
    total_tk +
    (parseFloat(biaya_listrik) || 0) +
    (parseFloat(biaya_sewa) || 0) +
    (parseFloat(biaya_lain) || 0) +
    (parseFloat(biaya_tetap_lain) || 0)

  const contribution_margin = hj - hpp_unit
  const bep_unit = contribution_margin > 0 ? biaya_tetap / contribution_margin : 0
  const bep_rupiah = bep_unit * hj

  // Laba bersih per bulan
  const laba_bulanan = (hj - hpp_unit) * qty - (parseFloat(biaya_tetap_lain) || 0)

  // Margin of Safety
  const margin_of_safety = qty > 0 ? ((qty - bep_unit) / qty) * 100 : 0

  // Skenario
  const hitungSkenario = (mult) => {
    const vol = Math.round(qty * mult)
    const laba = hj * vol - (hpp_unit * vol + (parseFloat(biaya_tetap_lain) || 0))
    return { volume: vol, laba, untung: laba > 0 }
  }

  return {
    // HPP
    hpp_unit,
    hpp_total,
    total_bahan,
    total_tk,
    total_oh,
    // BEP
    bep_unit: Math.ceil(bep_unit),
    bep_rupiah,
    contribution_margin,
    biaya_tetap,
    // Analisis
    margin_aktual,
    harga_ideal,
    laba_bulanan,
    margin_of_safety,
    // Skenario
    skenario: {
      pesimis: hitungSkenario(0.7),
      moderat: hitungSkenario(1.0),
      optimis: hitungSkenario(1.3),
    },
  }
}

export function formatRupiah(n) {
  if (n === null || n === undefined || isNaN(n)) return 'Rp 0'
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`
  if (abs >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} jt`
  if (abs >= 1_000) return `Rp ${Math.round(n).toLocaleString('id-ID')}`
  return `Rp ${Math.round(n)}`
}

export function getStatusMargin(margin, target) {
  if (margin < 0) return { label: 'Rugi', color: 'red' }
  if (margin < 15) return { label: 'Tipis', color: 'amber' }
  if (margin >= target) return { label: 'Baik', color: 'green' }
  return { label: 'Cukup', color: 'blue' }
}
