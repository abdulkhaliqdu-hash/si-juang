import csv
import io
import os
import urllib.parse
from pathlib import Path

import pandas as pd
import streamlit as st

import database

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
TTE_DOCS_DIR = BASE_DIR / "tte_docs"

USER_ROLES = {
    "kecamatan": "Admin Kecamatan",
    "gampong": "Operator Gampong",
}

GAMPONG_LIST = [
    "Bireuen Meunasah Capa",
    "Geudong-Geudong",
    "Kota Bireuen",
    "Pulo Ara Geudong Teungoh",
    "Meunasah Reuleut",
    "Bandar Bireuen",
    "Geulanggang Gampong",
    "Geulanggang Teungoh",
    "Geulanggang Kulam",
    "Pulo Kiton",
    "Blang Bireuen",
    "Cot Gapu",
    "Lhok Awe-Awe",
    "Meunasah Blang",
    "Meunasah Gadong",
    "Meunasah Tgk Digadong",
    "Meunasah Dayah",
    "Meunasah Capa",
    "Uteun Reutoh",
    "Bireuen Meunasah Dayah",
    "Cadang",
    "Geudong Alue",
    "Paya Cut",
]

DEFAULT_LOGIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")

JENIS_SURAT_LIST = [
    "SKTM",
    "Surat Rekomendasi Usaha (IUMK)",
    "Surat Keterangan Ahli Waris",
    "Surat Keterangan Domisili Usaha",
]


def prepare_directories() -> None:
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    TTE_DOCS_DIR.mkdir(parents=True, exist_ok=True)


# Helper to render download link or download button for a stored file
def render_file_access(path: str) -> None:
    """If path is a URL (http/https) show a markdown link. If local file exists, show a download button.

    If neither, just print the path.
    """
    if not path:
        return
    try:
        if isinstance(path, str) and path.startswith("http"):
            st.markdown(f"[Unduh file]({path})")
            return
        p = Path(path)
        if p.exists():
            with open(p, "rb") as f:
                data = f.read()
            st.download_button("Unduh file", data, file_name=p.name)
            return
        # fallback: print raw value
        st.write(path)
    except Exception as e:
        st.write(path)


def format_status(status: str) -> str:
    return status or "-"


def render_login() -> bool:
    if "logged_in" not in st.session_state:
        st.session_state.logged_in = False
        st.session_state.user = None

    if st.session_state.logged_in and st.session_state.user:
        st.sidebar.success(f"Masuk sebagai {st.session_state.user['display_name']}")
        return True

    st.sidebar.title("Login SI-JUANG")
    username = st.sidebar.text_input("Username")
    password = st.sidebar.text_input("Password", type="password")
    login_button = st.sidebar.button("Login")

    if login_button:
        user = database.verify_user(username.strip(), password)
        if user:
            st.session_state.logged_in = True
            st.session_state.user = user
            st.rerun()
        else:
            st.sidebar.error("Username atau password salah.")
    return False


def render_operator_registration() -> None:
    st.header("📝 Pendaftaran Operator Gampong")
    st.write("Hanya admin Kecamatan yang dapat menambahkan akun operator Gampong baru.")

    with st.form("form_daftar_operator", clear_on_submit=True):
        username = st.text_input("Username Operator")
        password = st.text_input("Password", type="password")
        display_name = st.text_input("Nama Operator")
        nama_gampong = st.selectbox("Nama Gampong", GAMPONG_LIST)
        nama_keuchik = st.text_input("Nama Keuchik")
        no_wa = st.text_input("No. WA Operator/Keuchik")
        email = st.text_input("Email Operator")
        photo_file = st.file_uploader("Unggah Foto Profil Operator", type=["jpg", "jpeg", "png"], key="operator_photo")
        submit = st.form_submit_button("Daftar Operator")

    if submit:
        if not username or not password or not display_name or not nama_keuchik or not no_wa:
            st.error("Lengkapi semua kolom wajib.")
            return

        photo_path = None
        if photo_file is not None:
            file_bytes = photo_file.getbuffer()
            try:
                import storage

                if storage.is_r2_configured():
                    key = f"operator_{username}_{photo_file.name}"
                    try:
                        url = storage.upload_bytes(file_bytes, key)
                        photo_path = url
                    except Exception:
                        local_path = UPLOADS_DIR / f"operator_{username}_{photo_file.name}"
                        with open(local_path, "wb") as f:
                            f.write(file_bytes)
                        photo_path = str(local_path)
                else:
                    local_path = UPLOADS_DIR / f"operator_{username}_{photo_file.name}"
                    with open(local_path, "wb") as f:
                        f.write(file_bytes)
                    photo_path = str(local_path)
            except Exception:
                local_path = UPLOADS_DIR / f"operator_{username}_{photo_file.name}"
                with open(local_path, "wb") as f:
                    f.write(file_bytes)
                photo_path = str(local_path)

        try:
            database.add_operator(
                username=username.strip(),
                password=password,
                display_name=display_name.strip(),
                nama_gampong=nama_gampong,
                nama_keuchik=nama_keuchik.strip(),
                no_wa=no_wa.strip(),
                email=email.strip(),
                photo_path=photo_path,
            )
            st.success("Operator Gampong berhasil didaftarkan.")
        except Exception as exc:
            st.error(f"Gagal mendaftarkan operator: {exc}")


def render_change_password() -> None:
    with st.expander("🔑 Ganti Password"):
        with st.form("form_ganti_password", clear_on_submit=True):
            old_pw = st.text_input("Password Lama", type="password")
            new_pw = st.text_input("Password Baru", type="password")
            confirm_pw = st.text_input("Konfirmasi Password Baru", type="password")
            submit_pw = st.form_submit_button("Ganti Password")
        if submit_pw:
            if not old_pw or not new_pw or not confirm_pw:
                st.error("Lengkapi semua kolom password.")
            elif new_pw != confirm_pw:
                st.error("Password baru dan konfirmasi tidak cocok.")
            elif len(new_pw) < 6:
                st.error("Password baru minimal 6 karakter.")
            else:
                if database.change_password(st.session_state.user["username"], old_pw, new_pw):
                    st.success("Password berhasil diganti.")
                else:
                    st.error("Password lama salah.")


def render_profile_tab() -> None:
    st.header("👤 Profil Pengguna")
    user = database.get_user_by_username(st.session_state.user["username"])
    if not user:
        st.error("Data pengguna tidak ditemukan.")
        return

    st.write(f"**Username:** {user['username']}")
    st.write(f"**Role:** {USER_ROLES.get(user['role'], user['role'])}")
    if user.get("photo_path"):
        st.image(user["photo_path"], width=180)

    with st.form("form_update_profile", clear_on_submit=False):
        display_name = st.text_input("Nama Tampilan", value=user.get("display_name", ""))
        nama_gampong = st.text_input("Nama Gampong", value=user.get("nama_gampong", ""), disabled=True)
        nama_keuchik = st.text_input("Nama Keuchik", value=user.get("nama_keuchik", ""))
        no_wa = st.text_input("No. WA", value=user.get("no_wa", ""))
        email = st.text_input("Email", value=user.get("email", ""))
        photo_file = st.file_uploader("Unggah Foto Profil Baru", type=["jpg", "jpeg", "png"], key="profile_photo")
        submit = st.form_submit_button("Simpan Profil")

    if submit:
        photo_path = user.get("photo_path")
        if photo_file is not None:
            file_bytes = photo_file.getbuffer()
            try:
                import storage

                if storage.is_r2_configured():
                    key = f"profile_{user['username']}_{photo_file.name}"
                    try:
                        url = storage.upload_bytes(file_bytes, key)
                        photo_path = url
                    except Exception:
                        local_path = UPLOADS_DIR / f"profile_{user['username']}_{photo_file.name}"
                        with open(local_path, "wb") as f:
                            f.write(file_bytes)
                        photo_path = str(local_path)
                else:
                    local_path = UPLOADS_DIR / f"profile_{user['username']}_{photo_file.name}"
                    with open(local_path, "wb") as f:
                        f.write(file_bytes)
                    photo_path = str(local_path)
            except Exception:
                local_path = UPLOADS_DIR / f"profile_{user['username']}_{photo_file.name}"
                with open(local_path, "wb") as f:
                    f.write(file_bytes)
                photo_path = str(local_path)

        try:
            database.update_user_profile(
                username=user["username"],
                display_name=display_name,
                nama_keuchik=nama_keuchik,
                no_wa=no_wa,
                email=email,
                photo_path=photo_path,
            )
            st.success("Profil berhasil diperbarui.")
            st.rerun()
        except Exception as exc:
            st.error(f"Gagal memperbarui profil: {exc}")

    render_change_password()


def render_leaderboard_tab() -> None:
    st.header("🏆 Leaderboard Layanan Gampong")
    st.write("Peringkat gampong berdasarkan jumlah permohonan layanan yang masuk.")

    leaderboard = database.get_leaderboard()
    if leaderboard:
        st.table(leaderboard)
    else:
        st.info("Belum ada data layanan untuk leaderboard saat ini.")


def render_loket_gampong_tab() -> None:
    st.header("🏢 Loket Gampong")
    st.write(
        "Operator Gampong dapat memilih layanan yang memerlukan validasi kecamatan atau layanan yang cukup selesai di tingkat gampong."
    )

    pilihan_validasi = st.radio(
        "Apakah Surat Memerlukan Validasi/TTE Kecamatan?",
        ["Ya", "Tidak"],
        index=0,
        horizontal=True,
    )

    if pilihan_validasi == "Tidak":
        st.info(
            "Surat ini dapat selesai di tingkat gampong dan tidak perlu diteruskan ke Kecamatan. "
            "Silakan selesaikan administrasi internal Gampong dan berikan informasi kepada pemohon."
        )
    else:
        with st.form("form_pengajuan", clear_on_submit=True):
            nik = st.text_input("NIK (16 digit)")
            nama = st.text_input("Nama Pemohon")
            asal_gampong = st.selectbox("Asal Gampong", GAMPONG_LIST)
            jenis_surat = st.selectbox("Jenis Surat", JENIS_SURAT_LIST)
            keperluan = st.text_area("Keperluan")
            no_wa_gampong = st.text_input("No. WA Operator/Keuchik Gampong")
            file_pengantar = st.file_uploader(
                "Unggah Berkas Pengantar (PDF/JPG)", type=["pdf", "jpg", "jpeg"], key="upload_pengantar"
            )
            submit_pengajuan = st.form_submit_button("Kirim Permohonan ke Kecamatan")

        if submit_pengajuan:
            if not nik.isdigit() or len(nik) != 16:
                st.error("NIK harus terdiri dari 16 digit angka.")
            elif not nama or not keperluan or not no_wa_gampong:
                st.error("Lengkapi seluruh informasi yang diperlukan sebelum mengirimkan permohonan.")
            else:
                file_pengantar_path = None
                if file_pengantar is not None:
                    # prefer R2 upload if configured, otherwise save locally
                    file_bytes = file_pengantar.getbuffer()
                    try:
                        import storage

                        if storage.is_r2_configured():
                            key = f"pengantar_{nik}_{file_pengantar.name}"
                            try:
                                url = storage.upload_bytes(file_bytes, key)
                                file_pengantar_path = url
                            except Exception:
                                file_name = f"pengantar_{nik}_{file_pengantar.name}"
                                local_path = UPLOADS_DIR / file_name
                                with open(local_path, "wb") as f:
                                    f.write(file_bytes)
                                file_pengantar_path = str(local_path)
                        else:
                            file_name = f"pengantar_{nik}_{file_pengantar.name}"
                            local_path = UPLOADS_DIR / file_name
                            with open(local_path, "wb") as f:
                                f.write(file_bytes)
                            file_pengantar_path = str(local_path)
                    except Exception:
                        file_name = f"pengantar_{nik}_{file_pengantar.name}"
                        local_path = UPLOADS_DIR / file_name
                        with open(local_path, "wb") as f:
                            f.write(file_bytes)
                        file_pengantar_path = str(local_path)

                database.tambah_permohonan(
                    nik=nik,
                    nama_pemohon=nama,
                    asal_gampong=asal_gampong,
                    jenis_surat=jenis_surat,
                    keperluan=keperluan,
                    no_wa_gampong=no_wa_gampong,
                    file_pengantar_path=file_pengantar_path,
                )
                st.success("Permohonan berhasil dikirim ke Meja Pelayanan Kecamatan.")

    st.markdown("---")
    st.subheader("Pantauan Status Permohonan")
    permohonan_semua = database.get_permohonan_by_filter()
    if permohonan_semua:
        for item in permohonan_semua:
            with st.expander(f"#{item['id']} - {item['nama_pemohon']} ({format_status(item['status'])})"):
                st.write(f"**NIK:** {item['nik']}")
                st.write(f"**Jenis Surat:** {item['jenis_surat']}")
                st.write(f"**Status:** {format_status(item['status'])}")
                if item['status'].startswith("Ditolak") and item['alasan_penolakan']:
                    st.warning(f"Alasan Penolakan: {item['alasan_penolakan']}")
                if item['file_tte_path']:
                    st.success("File TTE tersedia:")
                    try:
                        render_file_access(item['file_tte_path'])
                    except Exception:
                        st.write(item['file_tte_path'])
    else:
        st.info("Belum ada permohonan yang masuk.")


def render_meja_pelayanan_tab() -> None:
    st.header("🏛️ Meja Pelayanan Kecamatan")
    st.write("Staf Kecamatan dapat memverifikasi permohonan, menolak, atau meneruskan ke proses TTE Srikandi.")

    all_permohonan = database.get_permohonan_by_filter()
    total = len(all_permohonan)
    menunggu = len([item for item in all_permohonan if item["status"] == "Menunggu Verifikasi"])
    proses_srikandi = len([item for item in all_permohonan if item["status"] == "Proses Srikandi (TTE Pimpinan)"])
    selesai_tte = len([item for item in all_permohonan if item["status"] == "Selesai (TTE Terbit)"])
    ditolak = len([item for item in all_permohonan if item["status"].startswith("Ditolak")])

    col1, col2, col3, col4, col5 = st.columns(5)
    col1.metric("Total Permohonan", total)
    col2.metric("Menunggu Verifikasi", menunggu)
    col3.metric("Proses Srikandi", proses_srikandi)
    col4.metric("Selesai TTE", selesai_tte)
    col5.metric("Ditolak", ditolak)

    st.markdown("---")
    subtab = st.tabs(["Verifikasi Berkas Masuk", "Proses Srikandi & Unggah TTE"])

    with subtab[0]:
        st.subheader("Verifikasi Berkas Masuk")
        permohonan_menunggu = [item for item in all_permohonan if item["status"] == "Menunggu Verifikasi"]
        if permohonan_menunggu:
            for item in permohonan_menunggu:
                with st.expander(f"#{item['id']} - {item['nama_pemohon']} ({item['asal_gampong']})"):
                    st.write(f"**Jenis Surat:** {item['jenis_surat']}")
                    st.write(f"**Keperluan:** {item['keperluan']}")
                    st.write(f"**No. WA Gampong:** {item['no_wa_gampong']}")
                    if item['file_pengantar_path']:
                        st.write("**File Pengantar:**")
                        try:
                            render_file_access(item['file_pengantar_path'])
                        except Exception:
                            st.write(item['file_pengantar_path'])

                    if st.button("ACC & Forward ke Srikandi", key=f"acc_{item['id']}"):
                        database.update_status_srikandi(item['id'])
                        st.success("Permohonan berhasil diteruskan ke proses Srikandi.")
                        st.rerun()

                    with st.form(key=f"tolak_form_{item['id']}"):
                        alasan = st.text_area("Alasan Penolakan", placeholder="Contoh: Berkas KTP tidak jelas / Syarat kurang")
                        tolak_button = st.form_submit_button("Tolak Permohonan")
                        if tolak_button:
                            if not alasan.strip():
                                st.error("Masukkan alasan penolakan.")
                            else:
                                database.update_status_ditolak(item['id'], alasan.strip())
                                st.success("Permohonan ditolak dengan alasan yang tercatat.")
                                st.rerun()
        else:
            st.info("Tidak ada permohonan yang menunggu verifikasi saat ini.")

    with subtab[1]:
        st.subheader("Proses Srikandi & Unggah TTE")
        permohonan_srikandi = [item for item in all_permohonan if item["status"] == "Proses Srikandi (TTE Pimpinan)"]
        if permohonan_srikandi:
            for item in permohonan_srikandi:
                with st.expander(f"#{item['id']} - {item['nama_pemohon']}"):
                    st.write(f"**Asal Gampong:** {item['asal_gampong']}")
                    st.write(f"**Jenis Surat:** {item['jenis_surat']}")
                    st.write(f"**Keperluan:** {item['keperluan']}")
                    file_tte = st.file_uploader(
                        f"Unggah PDF Surat TTE untuk permohonan #{item['id']}", type=["pdf"], key=f"tte_{item['id']}"
                    )
                    if st.button("Unggah TTE & Selesaikan", key=f"upload_tte_{item['id']}"):
                        if not file_tte:
                            st.error("Unggah file PDF Surat TTE terlebih dahulu.")
                        else:
                            file_bytes = file_tte.getbuffer()
                            try:
                                import storage

                                if storage.is_r2_configured():
                                    key = f"tte_{item['id']}_{file_tte.name}"
                                    try:
                                        url = storage.upload_bytes(file_bytes, key)
                                        database.update_status_selesai_tte(item['id'], url)
                                    except Exception:
                                        # fallback to local storage on upload failure
                                        tte_path = TTE_DOCS_DIR / f"tte_{item['id']}_{file_tte.name}"
                                        with open(tte_path, "wb") as f:
                                            f.write(file_bytes)
                                        database.update_status_selesai_tte(item['id'], str(tte_path))
                                else:
                                    tte_path = TTE_DOCS_DIR / f"tte_{item['id']}_{file_tte.name}"
                                    with open(tte_path, "wb") as f:
                                        f.write(file_bytes)
                                    database.update_status_selesai_tte(item['id'], str(tte_path))
                            except Exception:
                                tte_path = TTE_DOCS_DIR / f"tte_{item['id']}_{file_tte.name}"
                                with open(tte_path, "wb") as f:
                                    f.write(file_bytes)
                                database.update_status_selesai_tte(item['id'], str(tte_path))

                            nomor_wa = item['no_wa_gampong'].lstrip("+")
                            if nomor_wa.startswith("0"):
                                nomor_wa = f"62{nomor_wa[1:]}"
                            wa_text = (
                                "Surat TTE untuk permohonan Anda sudah selesai. "
                                "Silakan unduh file PDF dan kirimkan ke operator Gampong Anda."  
                                f"Permohonan ID: {item['id']}"
                            )
                            wa_link = (
                                f"https://wa.me/{nomor_wa}?text={urllib.parse.quote(wa_text)}"
                            )
                            st.success("File TTE berhasil diunggah dan status diperbarui.")
                            st.write("Link WhatsApp untuk pengiriman ke Gampong:")
                            st.markdown(f"[Kirim ke WA Operator/Keuchik]({wa_link})")
                            st.rerun()
        else:
            st.info("Tidak ada permohonan yang sedang diproses oleh Srikandi saat ini.")


def render_feedback_tab() -> None:
    st.header("💬 Feedback & Evaluasi Pelayanan")
    st.write("Pengisian feedback untuk monitoring kepuasan masyarakat dan kualitas layanan Gampong-Kecamatan.")

    permohonan_semua = database.get_permohonan_by_filter()
    if not permohonan_semua:
        st.info("Belum ada data permohonan untuk memberikan feedback.")
        return

    with st.form("form_feedback", clear_on_submit=True):
        selected_id = st.selectbox(
            "Pilih ID Permohonan / NIK",
            [f"#{item['id']} - {item['nik']} - {item['nama_pemohon']}" for item in permohonan_semua],
        )
        tingkat_kepuasan = st.selectbox(
            "Tingkat Kepuasan",
            ["Sangat Puas", "Puas", "Tidak Puas"],
        )
        catatan = st.text_area("Catatan / Kritik / Saran")
        submit_feedback = st.form_submit_button("Kirim Feedback")

        if submit_feedback:
            permohonan_id = int(selected_id.split(" ")[0].lstrip("#"))
            database.tambah_feedback(permohonan_id, tingkat_kepuasan, catatan)
            st.success("Terima kasih atas feedback Anda.")

    st.markdown("---")
    st.subheader("Dashboard Rekap Evaluasi Pelayanan")
    rekap = database.get_rekap_evaluasi()
    st.metric("Total Feedback", rekap["total_feedback"])
    st.write("**Distribusi Kepuasan:**")
    st.write(rekap["detail"])

    if rekap["masukan_tidak_puas"]:
        st.write("**Masukan Tidak Puas:**")
        for feedback in rekap["masukan_tidak_puas"]:
            st.markdown(
                f"- **Permohonan #{feedback['permohonan_id']}** ({feedback['waktu_feedback']}): {feedback['catatan']}"
            )
    else:
        st.info("Belum ada feedback dengan tingkat kepuasan 'Tidak Puas'.")


def render_about_tab() -> None:
    st.header("ℹ️ Tentang SI-JUANG")
    st.write(
        "SI-JUANG adalah sistem digital untuk integrasi urusan administrasi Gampong dan Kecamatan di Kota Juang, Kabupaten Bireuen. "
        "Sistem ini memfasilitasi alur layanan dari Gampong ke Kecamatan, validasi permohonan, penerbitan TTE oleh Srikandi, hingga pengiriman notifikasi WhatsApp dan evaluasi pelayanan."
    )
    st.write("Alur sistem:")
    st.markdown(
        "1. Operator Gampong membuat permohonan jika surat memerlukan validasi Kecamatan.\n"
        "2. Meja Pelayanan Kecamatan meninjau berkas, menerima atau menolak.\n"
        "3. Jika diterima, permohonan diteruskan ke proses Srikandi untuk penerbitan TTE.\n"
        "4. Setelah TTE terbit, staf Kecamatan mengunggah PDF TTE dan mengirim notifikasi ke Operator Gampong melalui WhatsApp.\n"
        "5. Warga/Gampong dapat memberi feedback untuk perbaikan pelayanan."
    )


def main() -> None:
    st.set_page_config(layout="wide", page_title="SI-JUANG Kota Juang")
    st.title("SI-JUANG Kota Juang")
    prepare_directories()
    database.init_db()

    if not render_login():
        st.info("Silakan login melalui panel sebelah kiri untuk menggunakan SI-JUANG.")
        return

    user_role = st.session_state.user["role"]
    st.sidebar.markdown(f"**Role:** {USER_ROLES.get(user_role, user_role)}")
    if st.sidebar.button("Logout"):
        st.session_state.logged_in = False
        st.session_state.user = None
        st.experimental_rerun()

    if user_role == "gampong":
        tabs = st.tabs(["🏢 Loket Gampong", "👤 Profil Saya", "💬 Feedback & Evaluasi Pelayanan", "ℹ️ Tentang SI-JUANG"])
        with tabs[0]:
            render_loket_gampong_tab()
        with tabs[1]:
            render_profile_tab()
        with tabs[2]:
            render_feedback_tab()
        with tabs[3]:
            render_about_tab()
    else:
        tabs = st.tabs(["🏛️ Meja Pelayanan Kecamatan", "📝 Pendaftaran Operator", "👤 Profil Saya", "💬 Feedback & Evaluasi Pelayanan", "🏆 Leaderboard", "ℹ️ Tentang SI-JUANG"])
        with tabs[0]:
            render_meja_pelayanan_tab()
        with tabs[1]:
            render_operator_registration()
        with tabs[2]:
            render_profile_tab()
        with tabs[3]:
            render_feedback_tab()
        with tabs[4]:
            render_leaderboard_tab()
        with tabs[5]:
            render_about_tab()


if __name__ == "__main__":
    main()