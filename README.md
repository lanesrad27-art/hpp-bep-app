# 📊 Kalkulator HPP & BEP UMKM

Aplikasi web mobile-friendly untuk menghitung Harga Pokok Produksi (HPP) dan Break Even Point (BEP) untuk UMKM Kuliner & Kerajinan.

## Fitur
- ✅ Hitung HPP (per unit & total)
- ✅ Hitung BEP (unit & rupiah) + Margin of Safety
- ✅ Simulasi harga jual & skenario 3 kondisi
- ✅ AI Konsultan (powered by Claude)
- ✅ Akun pengguna & simpan riwayat produk
- ✅ Responsive — bisa diakses dari HP

---

## 🚀 Cara Deploy (Step by Step)

### Langkah 1 — Buat akun & database di Supabase (GRATIS)

1. Daftar di https://supabase.com
2. Klik **New Project**, beri nama mis. `hpp-bep-umkm`
3. Setelah project jadi, buka **SQL Editor** di sidebar kiri
4. Copy semua isi file `supabase-schema.sql` → paste → klik **Run**
5. Aktifkan autentikasi email:
   - Buka **Authentication → Providers → Email** → pastikan **Enable** aktif
6. Ambil credentials di **Project Settings → API**:
   - Copy **Project URL** → simpan
   - Copy **anon/public key** → simpan

### Langkah 2 — Ambil Anthropic API Key (GRATIS $5 kredit awal)

1. Daftar di https://console.anthropic.com
2. Buka **API Keys** → klik **Create Key**
3. Copy key-nya → simpan

### Langkah 3 — Upload kode ke GitHub

1. Daftar/login di https://github.com
2. Klik **New Repository** → beri nama `hpp-bep-umkm` → **Public** → **Create**
3. Di terminal/command prompt, jalankan:

```bash
cd hpp-bep-app
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/USERNAME/hpp-bep-umkm.git
git push -u origin main
```

*(Ganti USERNAME dengan username GitHub Anda)*

### Langkah 4 — Deploy ke Vercel (GRATIS)

1. Daftar/login di https://vercel.com dengan akun GitHub
2. Klik **Add New → Project**
3. Import repository `hpp-bep-umkm`
4. Di bagian **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL` → isi dengan Project URL Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → isi dengan anon key Supabase
   - `ANTHROPIC_API_KEY` → isi dengan API key Anthropic
5. Klik **Deploy**
6. Tunggu ~2 menit → aplikasi live!

Vercel akan memberikan URL seperti: `https://hpp-bep-umkm.vercel.app`

---

## 💻 Menjalankan di Komputer (Development)

```bash
# Install dependencies
npm install

# Salin file environment
cp .env.example .env.local
# Edit .env.local dengan nilai asli

# Jalankan
npm run dev
# Buka http://localhost:3000
```

---

## 📱 Cara Akses dari HP

Setelah deploy ke Vercel, buka URL dari HP. Untuk pengalaman terbaik:
- Android: Chrome → menu (⋮) → **Add to Home Screen**
- iPhone: Safari → Share (□↑) → **Add to Home Screen**

Aplikasi akan terasa seperti app native di HP Anda!

---

## 🗂 Struktur File

```
hpp-bep-app/
├── pages/
│   ├── index.js          # Dashboard (daftar produk)
│   ├── login.js          # Halaman login/register
│   ├── produk/[id].js    # Form input + kalkulasi
│   └── api/
│       ├── ai-konsultan.js  # API AI chat
│       └── produk.js        # API simpan/load produk
├── lib/
│   ├── kalkulasi.js      # Logika HPP & BEP
│   └── supabase.js       # Koneksi database
├── styles/
│   └── globals.css       # Style aplikasi
└── supabase-schema.sql   # Skema database
```

---

## ❓ Pertanyaan?

Jika ada error saat deploy, cek:
1. Semua environment variables sudah diisi dengan benar
2. SQL schema sudah dijalankan di Supabase
3. Email authentication sudah diaktifkan di Supabase
