import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client (dengan service role untuk bypass RLS jika perlu)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { produk, bahan_baku, hasil, token } = req.body

    // Verifikasi user dari token
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return res.status(401).json({ error: 'Tidak terautentikasi' })

    // Upsert produk
    const { data: produkData, error: produkErr } = await supabase
      .from('produk')
      .upsert({ ...produk, user_id: user.id })
      .select()
      .single()

    if (produkErr) return res.status(500).json({ error: produkErr.message })

    // Hapus bahan lama lalu insert baru
    await supabase.from('bahan_baku').delete().eq('produk_id', produkData.id)
    if (bahan_baku?.length > 0) {
      await supabase.from('bahan_baku').insert(
        bahan_baku.map(b => ({ ...b, produk_id: produkData.id }))
      )
    }

    // Simpan ke riwayat kalkulasi
    await supabase.from('riwayat_kalkulasi').insert({
      produk_id: produkData.id,
      user_id: user.id,
      ...hasil,
    })

    res.json({ success: true, produk_id: produkData.id })
  } else if (req.method === 'GET') {
    const { token } = req.query
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return res.status(401).json({ error: 'Tidak terautentikasi' })

    const { data, error } = await supabase
      .from('produk')
      .select('*, bahan_baku(*)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    res.json({ produk: data })
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
