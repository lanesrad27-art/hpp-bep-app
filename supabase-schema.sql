-- =============================================
-- HPP & BEP UMKM - Supabase Database Schema
-- Jalankan ini di Supabase SQL Editor
-- =============================================

-- Tabel produk
CREATE TABLE produk (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL DEFAULT 'Kuliner',
  satuan TEXT NOT NULL DEFAULT 'pcs',
  qty_produksi INTEGER NOT NULL DEFAULT 100,
  harga_jual DECIMAL(15,2) NOT NULL DEFAULT 0,
  target_margin DECIMAL(5,2) NOT NULL DEFAULT 30,
  upah_harian DECIMAL(15,2) NOT NULL DEFAULT 0,
  hari_kerja INTEGER NOT NULL DEFAULT 22,
  jumlah_naker INTEGER NOT NULL DEFAULT 1,
  biaya_listrik DECIMAL(15,2) NOT NULL DEFAULT 0,
  biaya_sewa DECIMAL(15,2) NOT NULL DEFAULT 0,
  biaya_kemasan DECIMAL(15,2) NOT NULL DEFAULT 0,
  biaya_lain DECIMAL(15,2) NOT NULL DEFAULT 0,
  biaya_tetap_lain DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel bahan baku (relasi ke produk)
CREATE TABLE bahan_baku (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produk_id UUID REFERENCES produk(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  qty DECIMAL(15,3),
  biaya DECIMAL(15,2) NOT NULL DEFAULT 0
);

-- Tabel riwayat kalkulasi
CREATE TABLE riwayat_kalkulasi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produk_id UUID REFERENCES produk(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  hpp_unit DECIMAL(15,2),
  hpp_total DECIMAL(15,2),
  bep_unit DECIMAL(15,2),
  bep_rupiah DECIMAL(15,2),
  margin_aktual DECIMAL(5,2),
  laba_bulanan DECIMAL(15,2),
  harga_ideal DECIMAL(15,2),
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) - hanya bisa akses data sendiri
ALTER TABLE produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE bahan_baku ENABLE ROW LEVEL SECURITY;
ALTER TABLE riwayat_kalkulasi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_produk" ON produk FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_bahan" ON bahan_baku FOR ALL USING (
  produk_id IN (SELECT id FROM produk WHERE user_id = auth.uid())
);
CREATE POLICY "user_own_riwayat" ON riwayat_kalkulasi FOR ALL USING (auth.uid() = user_id);

-- Auto update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER produk_updated_at BEFORE UPDATE ON produk FOR EACH ROW EXECUTE FUNCTION update_updated_at();
