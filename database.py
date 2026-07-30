import hashlib
import os
import sqlite3
from sqlite3 import Connection
from typing import List, Optional, Dict

from dotenv import load_dotenv

load_dotenv()

DB_FILE = "sijuang.db"


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def get_connection() -> Connection:
    os.makedirs(os.path.dirname(DB_FILE) or ".", exist_ok=True)
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def create_default_users(cursor) -> None:
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    operator_password = os.environ.get("OPERATOR_PASSWORD", "gampong123")
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
        if row["password_hash"] != hash_password(password):
            return None
        return dict(row)


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
