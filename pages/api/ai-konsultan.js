import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { message, keuangan } = req.body
  if (!message) return res.status(400).json({ error: 'Pesan kosong' })

  const dataCtx = keuangan
    ? `Data keuangan produk "${keuangan.nama || 'UMKM'}":
- HPP/unit: Rp ${Math.round(keuangan.hpp_unit || 0).toLocaleString('id-ID')}
- Harga jual: Rp ${Math.round(keuangan.harga_jual || 0).toLocaleString('id-ID')}
- BEP: ${keuangan.bep_unit || 0} unit/bulan
- Margin aktual: ${(keuangan.margin_aktual || 0).toFixed(1)}%
- Laba per bulan: Rp ${Math.round(keuangan.laba_bulanan || 0).toLocaleString('id-ID')}
- Kategori: ${keuangan.kategori || '-'}`
    : 'Belum ada data kalkulasi yang diberikan.'

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: `Anda adalah konsultan keuangan UMKM profesional Indonesia yang ramah dan praktis.
${dataCtx}

Berikan saran yang konkret, singkat (maks 4 kalimat), dalam Bahasa Indonesia yang mudah dipahami pengusaha kecil.
Jika ada data keuangan di atas, gunakan angka-angkanya dalam jawaban Anda.`,
      messages: [{ role: 'user', content: message }],
    })

    res.json({ reply: response.content[0].text })
  } catch (err) {
    console.error('Anthropic error:', err)
    res.status(500).json({ error: 'Gagal menghubungi AI. Coba lagi.' })
  }
}
