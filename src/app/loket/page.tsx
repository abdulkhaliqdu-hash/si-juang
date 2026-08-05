"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  getPermohonan,
  createPermohonan,
  Permohonan,
} from "@/lib/api";
import { Send, Search, FileText, AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react";

const GAMPONG_LIST = [
  "Bireuen Meunasah Capa", "Geudong-Geudong", "Kota Bireuen",
  "Pulo Ara Geudong Teungoh", "Meunasah Reuleut", "Bandar Bireuen",
  "Geulanggang Gampong", "Geulanggang Teungoh", "Geulanggang Kulam",
  "Pulo Kiton", "Blang Bireuen", "Cot Gapu", "Lhok Awe-Awe",
  "Meunasah Blang", "Meunasah Gadong", "Meunasah Tgk Digadong",
  "Meunasah Dayah", "Meunasah Capa", "Uteun Reutoh",
  "Bireuen Meunasah Dayah", "Cadang", "Geudong Alue", "Paya Cut",
];

const JENIS_SURAT = [
  "SKTM",
  "Surat Rekomendasi Usaha (IUMK)",
  "Surat Keterangan Ahli Waris",
  "Surat Keterangan Domisili Usaha",
];

export default function LoketPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [permohonan, setPermohonan] = useState<Permohonan[]>([]);
  const [error, setError] = useState("");

  // Form
  const [nik, setNik] = useState("");
  const [nama, setNama] = useState("");
  const [asalGampong, setAsalGampong] = useState(GAMPONG_LIST[0]);
  const [jenisSurat, setJenisSurat] = useState(JENIS_SURAT[0]);
  const [keperluan, setKeperluan] = useState("");
  const [noWa, setNoWa] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [namaGampongPengusul, setNamaGampongPengusul] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Make this page public — do not redirect to login
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    getPermohonan()
      .then((res) => setPermohonan(res.data))
      .catch(() => setError("Gagal memuat data."));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^\d{16}$/.test(nik)) {
      setError("NIK harus 16 digit angka.");
      return;
    }
    if (!nama || !keperluan || !noWa) {
      setError("Lengkapi semua field wajib.");
      return;
    }
    // optional: validate drive link is a google drive url if provided
    if (driveLink && !/https?:\/\/(drive\.google\.com|docs\.google\.com)\/.+/.test(driveLink)) {
      // allow any url but warn if not a google drive link
      setError("Link Google Drive tidak valid (harus berasal dari drive.google.com atau docs.google.com). Jika tidak ada, kosongkan field ini.");
      return;
    }

    setSubmitting(true);
    try {
      await createPermohonan({
        nik,
        nama_pemohon: nama,
        asal_gampong: asalGampong,
        jenis_surat: jenisSurat.toUpperCase(),
        keperluan,
        no_wa_gampong: noWa,
        drive_link: driveLink || undefined,
        nama_gampong_pengusul: namaGampongPengusul || undefined,
        keterangan: keterangan || undefined,
      });
      setNik("");
      setNama("");
      setKeperluan("");
      setNoWa("");
      setDriveLink("");
      setNamaGampongPengusul("");
      setKeterangan("");
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengirim permohonan.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "Menunggu Verifikasi") return "status-badge status-menunggu";
    if (status === "Proses Srikandi (TTE Pimpinan)") return "status-badge status-srikandi";
    if (status === "Selesai (TTE Terbit)") return "status-badge status-selesai";
    if (status.startsWith("Ditolak")) return "status-badge status-ditolak";
    return "status-badge";
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          🏢 Loket Gampong
        </h1>
        <p className="text-gray-500 mt-1">
          Ajukan permohonan layanan yang memerlukan validasi kecamatan
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Pengajuan */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Form Pengajuan Permohonan</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIK (16 digit) *
              </label>
              <input
                type="text"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="1111111111111111"
                maxLength={16}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Pemohon *
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Nama lengkap"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asal Gampong *
              </label>
              <select
                value={asalGampong}
                onChange={(e) => setAsalGampong(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {GAMPONG_LIST.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jenis Surat *
              </label>
              <select
                value={jenisSurat}
                onChange={(e) => setJenisSurat(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {JENIS_SURAT.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keperluan *
              </label>
              <textarea
                value={keperluan}
                onChange={(e) => setKeperluan(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                rows={3}
                placeholder="Jelaskan keperluan permohonan"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link Google Drive (opsional)
              </label>
              <input
                type="url"
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="https://drive.google.com/drive/folders/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Gampong Pengusul (opsional)
              </label>
              <input
                type="text"
                value={namaGampongPengusul}
                onChange={(e) => setNamaGampongPengusul(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Nama gampong pengusul"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keterangan (opsional)
              </label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Tambahan keterangan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. WA Operator/Keuchik *
              </label>
              <input
                type="text"
                value={noWa}
                onChange={(e) => setNoWa(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="081234567890"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Mengirim..." : "Kirim Permohonan"}
            </button>
          </div>
        </form>
      </div>

      {/* Pantauan Status */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            <Search className="w-5 h-5 inline mr-2" />
            Pantauan Status Permohonan
          </h2>
          <button
            onClick={loadData}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {permohonan.length === 0 ? (
          <p className="text-gray-400 text-sm">Belum ada permohonan.</p>
        ) : (
          <div className="space-y-3">
            {permohonan.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">
                      #{item.id} - {item.nama_pemohon}
                    </span>
                  </div>
                  <span className={getStatusBadge(item.status)}>
                    {item.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-500">
                  <span>NIK: {item.nik}</span>
                  <span>Jenis: {item.jenis_surat}</span>
                  <span>Gampong: {item.asal_gampong}</span>
                  <span>
                    Tanggal:{" "}
                    {new Date(item.waktu_pengajuan).toLocaleDateString("id-ID")}
                  </span>
                </div>
                {item.status.startsWith("Ditolak") && item.alasan_penolakan && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    <XCircle className="w-4 h-4 inline mr-1" />
                    {item.alasan_penolakan}
                  </div>
                )}
                {item.status === "Selesai (TTE Terbit)" && (
                  <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    File TTE tersedia
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

