"""
Contoh script untuk menguji upload ke Supabase Storage menggunakan storage.upload_bytes dari repo.
Jalankan setelah mengisi .env (SUPABASE_URL, SUPABASE_KEY, SUPABASE_BUCKET) dan menginstall dependensi.
"""
import os
from pathlib import Path

# Pastikan environment vars sudah di-set (misal lewat .env dan python-dotenv, atau setx)
# Contoh: SUPABASE_URL=https://iqbvehfpwnzkfrdijnge.supabase.co
# SUPABASE_KEY=your_service_role_key
# SUPABASE_BUCKET=si-juang-uploads

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    # dotenv optional
    pass

from storage import upload_bytes, public_url_for

TEST_FILE = Path("test_resources/test-image.png")

if not TEST_FILE.exists():
    print("File contoh tidak ditemukan:", TEST_FILE)
    print("Buat folder test_resources/ dan letakkan test-image.png di dalamnya, atau ubah path di file ini.")
    raise SystemExit(1)

with open(TEST_FILE, "rb") as f:
    data = f.read()

key = f"test_uploads/{TEST_FILE.name}"
print("Mengunggah ke key:", key)
try:
    url = upload_bytes(data, key, content_type="image/png")
    print("Upload berhasil. URL/signed:", url)
except Exception as exc:
    print("Upload gagal:", exc)
    # jika gagal, coba cetak public_url_for (jika configured)
    try:
        print("Public URL (constructed):", public_url_for(key))
    except Exception as e:
        print("Tidak bisa membuat public URL secara otomatis:", e)
