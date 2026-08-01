import os
import secrets
import sqlite3
import string
from datetime import datetime, timedelta
from pathlib import Path
from sqlite3 import Connection
from typing import List, Optional, Dict

import bcrypt
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DB_FILE = str(BASE_DIR / "sijuang.db")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def get_connection() -> Connection:
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def _generate_random_password(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _ensure_users_schema(cursor) -> None:
    cursor.execute("PRAGMA table_info(users)")
    columns = {row[1] for row in cursor.fetchall()}

    required_columns = {
        "username": "TEXT NOT NULL UNIQUE",
        "password_hash": "TEXT NOT NULL",
        "role": "TEXT NOT NULL",
        "display_name": "TEXT NOT NULL",
        "nama_gampong": "TEXT",
        "nama_keuchik": "TEXT",
        "no_wa": "TEXT",
        "email": "TEXT",
        "photo_path": "TEXT",
        "created_at": "DATETIME DEFAULT CURRENT_TIMESTAMP",
        "updated_at": "DATETIME DEFAULT CURRENT_TIMESTAMP",
    }

    for column_name, column_type in required_columns.items():
        if column_name not in columns:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}")


def create_default_users(cursor) -> None:
    admin_password = os.environ.get("ADMIN_PASSWORD")
    if not admin_password:
        admin_password = _generate_random_password()
        print(f"[!] ADMIN_PASSWORD tidak diatur. Password random: {admin_password}")

    operator_password = os.environ.get("OPERATOR_PASSWORD")
    if not operator_password:
        operator_password = _generate_random_password()
        print(f"[!] OPERATOR_PASSWORD tidak diatur. Password random: {operator_password}")

    users = [
        ("admin", hash_password(admin_password), "kecamatan", "Admin Kecamatan", None, None, None, None, None),
        ("operator", hash_password(operator_password), "gampong", "Operator Gampong", "Bireuen Meunasah Capa", "Keuchik Default", "081234567890", "operator@example.com", None),
    ]
    for username, password_hash, role, display_name, nama_gampong, nama_keuchik, no_wa, email, photo_path in users:
        cursor.execute("SELECT 1 FROM users WHERE username = ?", (username,))
        if cursor.fetchone() is None:
            cursor.execute(
                "INSERT INTO users (username, password_hash, role, display_name, nama_gampong, nama_keuchik, no_wa, email, photo_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (username, password_hash, role, display_name, nama_gampong, nama_keuchik, no_wa, email, photo_path),
            )


def init_db() -> None:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                display_name TEXT NOT NULL,
                nama_gampong TEXT,
                nama_keuchik TEXT,
                no_wa TEXT,
                email TEXT,
                photo_path TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        _ensure_users_schema(cursor)
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS permohonan (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nik TEXT NOT NULL,
                nama_pemohon TEXT NOT NULL,
                asal_gampong TEXT NOT NULL,
                jenis_surat TEXT NOT NULL,
                keperluan TEXT NOT NULL,
                no_wa_gampong TEXT NOT NULL,
                file_pengantar_path TEXT,
                waktu_pengajuan DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT NOT NULL DEFAULT 'Menunggu Verifikasi',
                alasan_penolakan TEXT,
                file_tte_path TEXT
            )
            """
        )
        create_default_users(cursor)
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                permohonan_id INTEGER NOT NULL,
                tingkat_kepuasan TEXT NOT NULL,
                catatan TEXT,
                waktu_feedback DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (permohonan_id) REFERENCES permohonan(id)
            )
            """
        )
        conn.commit()


def tambah_permohonan(
    nik: str,
    nama_pemohon: str,
    asal_gampong: str,
    jenis_surat: str,
    keperluan: str,
    no_wa_gampong: str,
    file_pengantar_path: Optional[str],
) -> int:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO permohonan
                (nik, nama_pemohon, asal_gampong, jenis_surat, keperluan, no_wa_gampong, file_pengantar_path)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (nik, nama_pemohon, asal_gampong, jenis_surat, keperluan, no_wa_gampong, file_pengantar_path),
        )
        conn.commit()
        return cursor.lastrowid


def update_status_ditolak(permohonan_id: int, alasan: str) -> None:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE permohonan
            SET status = ?, alasan_penolakan = ?
            WHERE id = ?
            """,
            (f"Ditolak - {alasan}", alasan, permohonan_id),
        )
        conn.commit()


def update_status_srikandi(permohonan_id: int) -> None:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE permohonan
            SET status = 'Proses Srikandi (TTE Pimpinan)'
            WHERE id = ?
            """,
            (permohonan_id,),
        )
        conn.commit()


def update_status_selesai_tte(permohonan_id: int, file_tte_path: str) -> None:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE permohonan
            SET status = 'Selesai (TTE Terbit)', file_tte_path = ?
            WHERE id = ?
            """,
            (file_tte_path, permohonan_id),
        )
        conn.commit()


def tambah_feedback(
    permohonan_id: int,
    tingkat_kepuasan: str,
    catatan: Optional[str],
) -> int:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO feedback
                (permohonan_id, tingkat_kepuasan, catatan)
            VALUES (?, ?, ?)
            """,
            (permohonan_id, tingkat_kepuasan, catatan),
        )
        conn.commit()
        return cursor.lastrowid


def verify_user(username: str, password: str) -> Optional[Dict]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM users WHERE username = ?",
            (username,),
        )
        row = cursor.fetchone()
        if row is None:
            return None
        if not verify_password(password, row["password_hash"]):
            return None
        return dict(row)


def change_password(username: str, old_password: str, new_password: str) -> bool:
    """Change user password. Returns True if successful, False if old password is wrong."""
    user = verify_user(username, old_password)
    if not user:
        return False
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?",
            (hash_password(new_password), username),
        )
        conn.commit()
        return True


def get_permohonan_by_gampong(gampong: str, status: Optional[str] = None) -> List[Dict]:
    """Get permohonan filtered by gampong, optionally by status."""
    with get_connection() as conn:
        cursor = conn.cursor()
        if status:
            cursor.execute(
                "SELECT * FROM permohonan WHERE asal_gampong = ? AND status = ? ORDER BY waktu_pengajuan DESC",
                (gampong, status),
            )
        else:
            cursor.execute(
                "SELECT * FROM permohonan WHERE asal_gampong = ? ORDER BY waktu_pengajuan DESC",
                (gampong,),
            )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_dashboard_stats() -> Dict[str, object]:
    """Get aggregate statistics for dashboard."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as total FROM permohonan")
        total = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) as total FROM permohonan WHERE status = 'Menunggu Verifikasi'")
        menunggu = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) as total FROM permohonan WHERE status = 'Proses Srikandi (TTE Pimpinan)'")
        proses_srikandi = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) as total FROM permohonan WHERE status = 'Selesai (TTE Terbit)'")
        selesai = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) as total FROM permohonan WHERE status LIKE 'Ditolak%'")
        ditolak = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) as total FROM feedback")
        total_feedback = cursor.fetchone()["total"]

        # Permohonan per bulan (6 bulan terakhir)
        cursor.execute("""
            SELECT strftime('%Y-%m', waktu_pengajuan) as bulan, COUNT(*) as jumlah
            FROM permohonan
            WHERE waktu_pengajuan >= date('now', '-6 months')
            GROUP BY bulan ORDER BY bulan
        """)
        permohonan_per_bulan = [dict(row) for row in cursor.fetchall()]

        # Permohonan per jenis surat
        cursor.execute("""
            SELECT jenis_surat, COUNT(*) as jumlah
            FROM permohonan GROUP BY jenis_surat ORDER BY jumlah DESC
        """)
        per_jenis_surat = [dict(row) for row in cursor.fetchall()]

        return {
            "total_permohonan": total,
            "menunggu_verifikasi": menunggu,
            "proses_srikandi": proses_srikandi,
            "selesai_tte": selesai,
            "ditolak": ditolak,
            "total_feedback": total_feedback,
            "permohonan_per_bulan": permohonan_per_bulan,
            "per_jenis_surat": per_jenis_surat,
        }


def get_user_by_username(username: str) -> Optional[Dict]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        return dict(row) if row else None


def add_operator(
    username: str,
    password: str,
    display_name: str,
    nama_gampong: str,
    nama_keuchik: str,
    no_wa: str,
    email: str,
    photo_path: Optional[str] = None,
) -> int:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (username, password_hash, role, display_name, nama_gampong, nama_keuchik, no_wa, email, photo_path) VALUES (?, ?, 'gampong', ?, ?, ?, ?, ?, ?)",
            (username, hash_password(password), display_name, nama_gampong, nama_keuchik, no_wa, email, photo_path),
        )
        conn.commit()
        return cursor.lastrowid


def update_user_profile(
    username: str,
    display_name: str,
    nama_keuchik: str,
    no_wa: str,
    email: str,
    photo_path: Optional[str] = None,
) -> None:
    with get_connection() as conn:
        cursor = conn.cursor()
        if photo_path is not None:
            cursor.execute(
                "UPDATE users SET display_name = ?, nama_keuchik = ?, no_wa = ?, email = ?, photo_path = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?",
                (display_name, nama_keuchik, no_wa, email, photo_path, username),
            )
        else:
            cursor.execute(
                "UPDATE users SET display_name = ?, nama_keuchik = ?, no_wa = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?",
                (display_name, nama_keuchik, no_wa, email, username),
            )
        conn.commit()


def get_operators() -> List[Dict]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE role = 'gampong' ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_leaderboard() -> List[Dict]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT asal_gampong AS gampong, COUNT(*) AS layanan FROM permohonan GROUP BY asal_gampong ORDER BY layanan DESC"
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_permohonan_by_filter(status: Optional[str] = None) -> List[Dict]:
    with get_connection() as conn:
        cursor = conn.cursor()
        if status:
            cursor.execute(
                "SELECT * FROM permohonan WHERE status = ? ORDER BY waktu_pengajuan DESC",
                (status,),
            )
        else:
            cursor.execute(
                "SELECT * FROM permohonan ORDER BY waktu_pengajuan DESC"
            )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_rekap_evaluasi() -> Dict[str, object]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT tingkat_kepuasan, COUNT(*) AS jumlah FROM feedback GROUP BY tingkat_kepuasan"
        )
        rows = cursor.fetchall()
        nilai = {row["tingkat_kepuasan"]: row["jumlah"] for row in rows}
        cursor.execute(
            "SELECT permohonan_id, tingkat_kepuasan, catatan, waktu_feedback FROM feedback WHERE tingkat_kepuasan = 'Tidak Puas' ORDER BY waktu_feedback DESC"
        )
        tidak_puas = [dict(row) for row in cursor.fetchall()]
        return {
            "total_feedback": sum(nilai.values()),
            "detail": nilai,
            "masukan_tidak_puas": tidak_puas,
        }
