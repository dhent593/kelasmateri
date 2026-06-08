# kelasmateri - Platform Simulasi CAT CPNS 2026

**kelasmateri** adalah platform simulasi CAT (Computer Assisted Test) CPNS 2026 modern berbasis Full-Stack Next.js. Aplikasi ini dirancang dengan antarmuka minimalis premium (*Modern Minimalist theme*) serta mendukung pengerjaan simulasi berbasis bank soal database lokal maupun ujian adaptif cerdas yang dipotensiasi oleh **Gemini AI**.

---

## 🚀 Fitur Utama

1. **CAT Exam Engine Realistis**: Simulasi ujian CPNS standar CAT BKN RI dengan durasi **100 menit** dan **110 soal** (30 TWK, 35 TIU, 45 TKP).
2. **Skoring CPNS Standar BKN**: 
   - **TWK / TIU**: Benar mendapat +5 poin, Salah/Kosong mendapat 0.
   - **TKP**: Pembobotan nilai skala 1 sampai 5 untuk pilihan opsi A hingga E.
3. **Tryout Adaptif Gemini AI**: Pembuatan paket soal unik tak terbatas secara instan melalui pemanggilan paralel API Gemini.
4. **Frozen Header & Spaced Sidebar Navigation**: Navigasi soal yang dikelompokkan rapi per materi (TWK, TIU, TKP) dengan header lengket (*frosted glass opacity*) untuk kenyamanan membaca saat digulir.
5. **Dashboard Analitis**: Radar penilaian rata-rata sub-materi dibandingkan dengan Passing Grade CPNS resmi (TIU: 80, TWK: 65, TKP: 166) disertai grafik *Recharts* pelacak riwayat skor.
6. **Portal Pembahasan Soal**: Tinjauan kunci jawaban lengkap dengan pewarnaan penanda visual dan kartu pembahasan untuk setiap butir soal.
7. **Sistem Pengaman Mock DB Persisten**: Jika Supabase tidak dikonfigurasi, sistem akan otomatis beralih menggunakan file persisten JSON lokal (`mock_db_data.json`) untuk sinkronisasi data 100% antara *Server Actions* (pendaftaran/login) dan browser.
8. **Auto-Logout Keamanan**: Akun akan keluar secara otomatis jika tidak ada aktivitas interaksi (gerakan mouse, ketikan keyboard, scroll layar) selama **15 menit** untuk menjaga keamanan data.
9. **Modal Konfirmasi Logout**: Pop-up modal kustom elegan untuk mengonfirmasi tindakan keluar guna mencegah ketidaksengajaan.

---

## 🛠️ Tech Stack

*   **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
*   **Database & Auth**: Supabase (PostgreSQL + Supabase Auth) / JSON Mock DB fallback
*   **AI Integration**: Google Generative AI (Gemini API SDK)
*   **Visualisasi Data**: Recharts, Lucide React

---

## ⚙️ Persiapan Lokal

### 1. Kloning Repositori & Instal Dependensi
```bash
# Masuk ke folder proyek
cd kelasmateri-2

# Instal dependensi node modules
npm install
```

### 2. Konfigurasi Environment Variables (`.env.local`)
Buat file bernama `.env.local` di direktori utama proyek Anda:
```env
# Gemini API Key untuk modul simulasi ujian AI
GEMINI_API_KEY=YOUR_API_KEY_HERE

# Supabase (Kosongkan/Komentari jika ingin menggunakan Mock Database lokal)
# NEXT_PUBLIC_SUPABASE_URL=https://proyek-anda.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Jalankan Dev Server
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) untuk mengakses aplikasi.

### 🔑 Akun Uji Coba Cepat (Bypass):
Pada halaman `/login`, Anda dapat mengklik tombol bypass instan atau menggunakan kredensial:
*   **Admin**: `admin@kelasmateri.com` / Sandi: `palamana`
*   **User**: `user@kelasmateri.com` / Sandi: `palamana`

---

## 📁 Panduan Mengunggah ke GitHub

Jika folder proyek Anda belum terhubung dengan repositori GitHub, ikuti langkah berikut:

1. Buat repositori baru di akun GitHub Anda (beri nama misal: `kelasmateri-cpns`). Jangan centang inisialisasi README atau gitignore karena proyek lokal Anda sudah memilikinya.
2. Buka terminal atau Command Prompt pada direktori proyek Anda (`d:\Project\kelasmateri-2`), lalu jalankan perintah:
```bash
# Inisialisasi Git (jika belum pernah)
git init

# Tambahkan seluruh file ke staging area
git add .

# Buat commit pertama
git commit -m "feat: complete cpns tryout system with AI, timeout security and sidebar categorisation"

# Atur nama branch utama menjadi main
git branch -M main

# Hubungkan repositori lokal dengan GitHub Anda
# (Ganti tautan di bawah dengan URL repositori Anda yang baru dibuat)
git remote add origin https://github.com/username-anda/kelasmateri-cpns.git

# Unggah file ke GitHub
git push -u origin main
```

---

## 🗄️ Panduan Integrasi Supabase

Platform ini mendukung penuh integrasi ke database live PostgreSQL melalui Supabase. Ikuti langkah di bawah ini untuk menghubungkannya:

### 1. Membuat Proyek Supabase
1. Masuk ke [Supabase Dashboard](https://supabase.com/) dan buat proyek baru.
2. Tunggu beberapa menit hingga server database Anda aktif.

### 2. Menjalankan SQL Schema
1. Masuk ke menu **SQL Editor** pada navigasi kiri Supabase Dashboard Anda.
2. Klik **New Query** dan buat lembar kerja baru.
3. Buka file [supabase_schema.sql](file:///d:/Project/kelasmateri-2/supabase_schema.sql) yang terletak di folder proyek lokal Anda.
4. Salin seluruh konten SQL di dalamnya dan tempel ke lembar kerja SQL Editor Supabase.
5. Klik tombol **Run** di bagian kanan bawah. Perintah ini akan otomatis membuat tabel `users`, `manual_questions`, `exam_sessions`, membuat tipe enum, mengatur trigger otomatisasi akun, serta mengaktifkan RLS (Row Level Security).

### 3. Mendapatkan API Keys
1. Di Supabase Dashboard, masuk ke menu **Project Settings** (ikon gerigi) -> **API**.
2. Salin nilai dari:
   - **Project URL**
   - **anon public API Key**

---

## 🚀 Panduan Hosting ke Vercel

Setelah kode Anda diunggah ke GitHub dan skema database disiapkan di Supabase, Anda dapat meng-hosting aplikasi secara gratis di Vercel:

### 1. Hubungkan Akun GitHub ke Vercel
1. Masuk ke [Vercel](https://vercel.com/) dan masuk menggunakan akun GitHub Anda.
2. Klik tombol **Add New** -> **Project**.

### 2. Impor Repositori
1. Cari repositori Anda (misal: `kelasmateri-cpns`) di dalam daftar dan klik **Import**.

### 3. Konfigurasi Environment Variables (PENTING!)
Sebelum mengklik deploy, buka menu dropdown **Environment Variables** di halaman konfigurasi proyek Vercel Anda, lalu tambahkan variabel berikut:

| Key | Value | Keterangan |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | `YOUR_API_KEY_HERE` | Kunci akses API Gemini |
| `NEXT_PUBLIC_SUPABASE_URL` | *URL dari Supabase Anda* | Contoh: `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *Key Anon dari Supabase Anda* | Token API publik Supabase |

> [!NOTE]
> Jika Anda ingin tetap menggunakan database persisten lokal berbasis file (`mock_db_data.json`) daripada menggunakan database live Supabase, cukup **jangan** masukkan variabel `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` di konfigurasi Vercel Anda. Sistem otomatis beralih ke engine mock DB.

### 4. Deploy!
1. Klik tombol **Deploy**.
2. Vercel akan mengunduh repositori Anda, mengompilasi build produksi, dan meng-online-kannya dalam waktu kurang dari 2 menit.
3. Setelah selesai, Vercel akan memberikan tautan publik kustom (seperti `kelasmateri-cpns.vercel.app`) yang dapat diakses secara global!
