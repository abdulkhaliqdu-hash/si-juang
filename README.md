# si-juang

Default credentials for a fresh database are:

- Admin Kecamatan: `admin` / `admin`
- Operator Gampong: `operator` / `operator`

The frontend expects the Python backend to be available through `/api` as configured by `vercel.json`.

## Deploy ke Vercel

Untuk menjalankan aplikasi ini di Vercel, set environment variables berikut di dashboard Vercel:

- `DATABASE_FILE=/tmp/sijuang.db`
  - Wajib jika Anda menggunakan SQLite pada Vercel. Direktori `/tmp` adalah direktori writable di lingkungan serverless Vercel.
- `ADMIN_USERNAME=admin`
- `ADMIN_PASSWORD=admin`
  - Jika tidak diatur, aplikasi akan menggunakan default `admin` / `admin`.
- `SESSION_SECRET=sebuah_nilai_rahasia_acak`
  - Tidak wajib untuk login dasar, tetapi direkomendasikan untuk security bila Anda menambahkan session/state handling.

Jika Anda ingin menggunakan Supabase untuk file/storage atau database eksternal, set variabel tambahan:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_BUCKET`

Atau untuk Cloudflare R2:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

> Jika tidak ada env Supabase/R2, aplikasi akan menggunakan SQLite lokal dan penyimpanan file lokal. Perlu dicatat bahwa penyimpanan lokal di Vercel tidak persisten untuk produksi.

Cloudflare R2 (opsional)

Untuk menyimpan file (uploads/TTE) ke Cloudflare R2 gunakan langkah berikut:

1. Buat akun Cloudflare (perlu login) dan buka dashboard R2
2. Buat Bucket R2 baru
3. Buat Access Key (Access Key ID & Secret) untuk R2
4. Set environment variables pada server/deployment/local env:
   - R2_ACCOUNT_ID (dapat dari dashboard)
   - R2_ACCESS_KEY_ID
   - R2_SECRET_ACCESS_KEY
   - R2_BUCKET

5. Install dependency Python: pip install boto3

Setelah env vars diatur, aplikasi Streamlit akan otomatis mengunggah file ke R2. Jika R2 tidak dikonfigurasi, aplikasi akan menyimpan file secara lokal di folder `uploads/` dan `tte_docs/`.

Catatan: Pada deployment serverless, penyimpanan lokal tidak persisten — gunakan R2 atau penyimpanan objek yang persisten untuk produksi.

Supabase Storage (opsional, tidak perlu pembayaran)

Jika Anda menggunakan Supabase (lebih mudah dan gratis untuk awal):

1. Di dashboard Supabase project Anda, buka Settings → API Keys dan catat `Project URL` dan `anon` atau `service_role` key (gunakan `service_role` untuk operasi backend yang memerlukan akses penuh — jangan bagikan key ini ke klien).
2. Aktifkan Storage dan buat Bucket di menu Storage → Buckets (buat bucket, mis. `public-files`).
3. Set environment variables di mesin/dev atau hosting:
   - SUPABASE_URL=https://your-project-id.supabase.co
   - SUPABASE_KEY=service_role_key_or_anon_key
   - SUPABASE_BUCKET=nama-bucket-anda
4. Install dependency Python: pip install supabase

Setelah env vars dan dependency terpasang, aplikasi akan otomatis menggunakan Supabase untuk menyimpan file (prioritas Supabase jika dikonfigurasi). Jika Supabase tidak dikonfigurasi, aplikasi pakai R2 (jika tersedia) atau fallback ke penyimpanan lokal.

Keamanan: jangan commit SUPABASE_KEY ke repo. Gunakan service secrets di hosting atau simpan di .env dan jangan push ke git.
