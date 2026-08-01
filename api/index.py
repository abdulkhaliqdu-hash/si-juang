import json
import os
import sys
from http.server import BaseHTTPRequestHandler
from typing import Optional

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import database

# Inisialisasi DB
database.init_db()

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
}


def json_response(status: int, data: dict) -> dict:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(data, default=str),
    }


def error_response(status: int, message: str) -> dict:
    return json_response(status, {"error": message})


def parse_body(body: Optional[str]) -> dict:
    if not body:
        return {}
    try:
        return json.loads(body)
    except (json.JSONDecodeError, TypeError):
        return {}


def handler(event, context):
    """Vercel Serverless Function handler."""
    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")
    body_str = event.get("body", "")
    query_params = event.get("queryStringParameters") or {}
    body = parse_body(body_str)

    # Handle CORS preflight
    if method == "OPTIONS":
        return {
            "statusCode": 204,
            "headers": CORS_HEADERS,
            "body": "",
        }

    # === ROUTING ===

    # POST /api/login
    if path == "/api/login" and method == "POST":
        username = body.get("username", "")
        password = body.get("password", "")
        user = database.verify_user(username.strip(), password)
        if user:
            # Remove sensitive data
            user.pop("password_hash", None)
            return json_response(200, {"success": True, "user": user})
        return json_response(401, {"success": False, "error": "Username atau password salah."})

    # GET /api/user?username=xxx
    if path == "/api/user" and method == "GET":
        username = query_params.get("username", "")
        if not username:
            return error_response(400, "Parameter username diperlukan.")
        user = database.get_user_by_username(username)
        if user:
            user.pop("password_hash", None)
            return json_response(200, user)
        return error_response(404, "User tidak ditemukan.")

    # PUT /api/user/profile
    if path == "/api/user/profile" and method == "PUT":
        username = body.get("username", "")
        if not username:
            return error_response(400, "Parameter username diperlukan.")
        try:
            database.update_user_profile(
                username=username,
                display_name=body.get("display_name", ""),
                nama_keuchik=body.get("nama_keuchik", ""),
                no_wa=body.get("no_wa", ""),
                email=body.get("email", ""),
                photo_path=body.get("photo_path"),
            )
            return json_response(200, {"success": True})
        except Exception as e:
            return error_response(500, str(e))

    # POST /api/user/change-password
    if path == "/api/user/change-password" and method == "POST":
        username = body.get("username", "")
        old_password = body.get("old_password", "")
        new_password = body.get("new_password", "")
        if not all([username, old_password, new_password]):
            return error_response(400, "Semua field password diperlukan.")
        if len(new_password) < 6:
            return error_response(400, "Password baru minimal 6 karakter.")
        result = database.change_password(username, old_password, new_password)
        if result:
            return json_response(200, {"success": True})
        return json_response(401, {"success": False, "error": "Password lama salah."})

    # GET /api/permohonan
    if path == "/api/permohonan" and method == "GET":
        status_filter = query_params.get("status")
        gampong = query_params.get("gampong")
        if gampong:
            data = database.get_permohonan_by_gampong(gampong, status_filter)
        else:
            data = database.get_permohonan_by_filter(status_filter)
        return json_response(200, {"data": data})

    # POST /api/permohonan
    if path == "/api/permohonan" and method == "POST":
        required = ["nik", "nama_pemohon", "asal_gampong", "jenis_surat", "keperluan", "no_wa_gampong"]
        for field in required:
            if not body.get(field):
                return error_response(400, f"Field '{field}' diperlukan.")
        try:
            permohonan_id = database.tambah_permohonan(
                nik=body["nik"],
                nama_pemohon=body["nama_pemohon"],
                asal_gampong=body["asal_gampong"],
                jenis_surat=body["jenis_surat"],
                keperluan=body["keperluan"],
                no_wa_gampong=body["no_wa_gampong"],
                file_pengantar_path=body.get("file_pengantar_path"),
            )
            return json_response(201, {"success": True, "id": permohonan_id})
        except Exception as e:
            return error_response(500, str(e))

    # PUT /api/permohonan/status
    if path == "/api/permohonan/status" and method == "PUT":
        permohonan_id = body.get("id")
        action = body.get("action")
        if not permohonan_id or not action:
            return error_response(400, "Parameter 'id' dan 'action' diperlukan.")
        try:
            if action == "acc_srikandi":
                database.update_status_srikandi(permohonan_id)
            elif action == "tolak":
                alasan = body.get("alasan", "")
                if not alasan:
                    return error_response(400, "Alasan penolakan diperlukan.")
                database.update_status_ditolak(permohonan_id, alasan)
            elif action == "selesai_tte":
                file_path = body.get("file_tte_path", "")
                if not file_path:
                    return error_response(400, "Path file TTE diperlukan.")
                database.update_status_selesai_tte(permohonan_id, file_path)
            else:
                return error_response(400, f"Action '{action}' tidak dikenal.")
            return json_response(200, {"success": True})
        except Exception as e:
            return error_response(500, str(e))

    # GET /api/leaderboard
    if path == "/api/leaderboard" and method == "GET":
        data = database.get_leaderboard()
        return json_response(200, {"data": data})

    # GET /api/stats
    if path == "/api/stats" and method == "GET":
        data = database.get_dashboard_stats()
        return json_response(200, data)

    # GET /api/feedback
    if path == "/api/feedback" and method == "GET":
        data = database.get_rekap_evaluasi()
        return json_response(200, data)

    # POST /api/feedback
    if path == "/api/feedback" and method == "POST":
        permohonan_id = body.get("permohonan_id")
        tingkat_kepuasan = body.get("tingkat_kepuasan")
        catatan = body.get("catatan", "")
        if not permohonan_id or not tingkat_kepuasan:
            return error_response(400, "Field 'permohonan_id' dan 'tingkat_kepuasan' diperlukan.")
        try:
            database.tambah_feedback(permohonan_id, tingkat_kepuasan, catatan)
            return json_response(201, {"success": True})
        except Exception as e:
            return error_response(500, str(e))

    # POST /api/user/register-operator
    if path == "/api/user/register-operator" and method == "POST":
        required = ["username", "password", "display_name", "nama_gampong", "nama_keuchik", "no_wa"]
        for field in required:
            if not body.get(field):
                return error_response(400, f"Field '{field}' diperlukan.")
        try:
            database.add_operator(
                username=body["username"],
                password=body["password"],
                display_name=body["display_name"],
                nama_gampong=body["nama_gampong"],
                nama_keuchik=body["nama_keuchik"],
                no_wa=body["no_wa"],
                email=body.get("email", ""),
                photo_path=body.get("photo_path"),
            )
            return json_response(201, {"success": True})
        except Exception as e:
            return error_response(500, str(e))

    # Fallback 404
    return error_response(404, f"Route {method} {path} tidak ditemukan.")


# Compatibility alias for Vercel's Python serverless function detector.
def app(event, context=None):
    return handler(event, context)


application = app

