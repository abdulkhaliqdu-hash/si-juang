# TODO - Perbaikan & Pengembangan SI-JUANG ✅ SELESAI

## ✅ 1. Perbaikan Keamanan & Database (`database.py`)
- [x] Ganti SHA-256 dengan bcrypt untuk password hashing
- [x] Fix `get_connection()` path handling
- [x] Tambah fungsi `change_password()`
- [x] Tambah fungsi `get_permohonan_by_gampong()` untuk filtering by gampong
- [x] Tambah fungsi `get_dashboard_stats()` untuk statistik dashboard

## ✅ 2. Perbaikan `app.py` (Streamlit)
- [x] Tambah fitur ganti password di halaman profil
- [x] Improve error handling & validasi with try/except
- [x] Tambah import pandas, openpyxl untuk export

## ✅ 3. Perbaikan API (`api/index.py`)
- [x] Ubah menjadi REST API endpoint (Vercel Serverless)
- [x] Endpoint: login, user/profile, change-password, permohonan (CRUD), leaderboard, stats, feedback, register-operator

## ✅ 4. Pengembangan Next.js Frontend
- [x] Struktur folder `src/app/`, `src/lib/`, `src/components/`
- [x] Layout global + Sidebar komponen dengan navigasi
- [x] Halaman Login (dengan form & auth context)
- [x] Halaman Dashboard (statistik cards, grafik per bulan, per jenis surat)
- [x] Halaman Loket Gampong (pengajuan + pantau status)
- [x] Halaman Meja Pelayanan Kecamatan (verifikasi, ACC, tolak, upload TTE)
- [x] Halaman Pendaftaran Operator (form lengkap)
- [x] Halaman Profil (edit profil + ganti password)
- [x] Halaman Feedback & Evaluasi (form + rekap)
- [x] Halaman Leaderboard (peringkat dengan progress bar)
- [x] API client library (`src/lib/api.ts`)
- [x] Auth context provider (`src/lib/auth.tsx`)

