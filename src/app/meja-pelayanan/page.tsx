"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  getPermohonan,
  updatePermohonanStatus,
  Permohonan,
} from "@/lib/api";
import {
  CheckCircle,
  XCircle,
  Upload,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

export default function MejaPelayananPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [permohonan, setPermohonan] = useState<Permohonan[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && user.role !== "kecamatan") router.replace("/dashboard");
  }, [user, loading, router]);

  const loadData = () => {
    getPermohonan()
      .then((res) => setPermohonan(res.data))
      .catch(() => setError("Gagal memuat data."));
  };

  useEffect(() => {
    if (user && user.role === "kecamatan") loadData();
  }, [user]);

  const handleAcc = async (id: number) => {
    try {
      await updatePermohonanStatus(id, "acc_srikandi");
      loadData();
    } catch {
      setError("Gagal meneruskan ke Srikandi.");
    }
  };

  const handleTolak = async (id: number, reason: string) => {
    if (!reason.trim()) {
      setError("Alasan penolakan diperlukan.");
      return;
    }
    try {
      await updatePermohonanStatus(id, "tolak", { alasan: reason });
      loadData();
    } catch {
      setError("Gagal menolak permohonan.");
    }
  };

  const handleSelesaiTTE = async (id: number) => {
    try {
      // In real scenario, user would upload file
      await updatePermohonanStatus(id, "selesai_tte", {
        file_tte_path: `/tte_docs/tte_${id}.pdf`,
      });
      loadData();
    } catch {
      setError("Gagal menyelesaikan TTE.");
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "Menunggu Verifikasi") return "status-badge status-menunggu";
    if (status === "Proses Srikandi (TTE Pimpinan)") return "status-badge status-srikandi";
    if (status === "Selesai (TTE Terbit)") return "status-badge status-selesai";
    if (status.startsWith("Ditolak")) return "status-badge status-ditolak";
    return "status-badge";
  };

  const total = permohonan.length;
  const menunggu = permohonan.filter((p) => p.status === "Menunggu Verifikasi").length;
  const srikandi = permohonan.filter((p) => p.status === "Proses Srikandi (TTE Pimpinan)").length;
  const selesai = permohonan.filter((p) => p.status === "Selesai (TTE Terbit)").length;
  const ditolak = permohonan.filter((p) => p.status.startsWith("Ditolak")).length;

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
          🏛️ Meja Pelayanan Kecamatan
        </h1>
        <p className="text-gray-500 mt-1">
          Verifikasi permohonan, teruskan ke Srikandi, atau kelola TTE
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total", value: total, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Menunggu", value: menunggu, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Srikandi", value: srikandi, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Selesai", value: selesai, color: "text-green-600", bg: "bg-green-50" },
          { label: "Ditolak", value: ditolak, color: "text-red-600", bg: "bg-red-50" },
        ].map((item) => (
          <div key={item.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-sm text-gray-500">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Daftar Permohonan</h2>
        <button
          onClick={loadData}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Permohonan List */}
      {permohonan.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">
          Belum ada permohonan.
        </div>
      ) : (
        <div className="space-y-4">
          {permohonan.map((item) => (
            <div key={item.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">
                    #{item.id} - {item.nama_pemohon}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {item.asal_gampong} &middot; {item.jenis_surat}
                  </p>
                </div>
                <span className={getStatusBadge(item.status)}>
                  {item.status}
                </span>
              </div>

              <div className="text-sm text-gray-600 space-y-1 mb-3">
                <p>
                  <strong>NIK:</strong> {item.nik}
                </p>
                <p>
                  <strong>Keperluan:</strong> {item.keperluan}
                </p>
                <p>
                  <strong>No. WA:</strong> {item.no_wa_gampong}
                </p>
                {item.file_pengantar_path && (
                  <p>
                    <strong>File Pengantar:</strong> {item.file_pengantar_path}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {item.status === "Menunggu Verifikasi" && (
                  <>
                    <button
                      onClick={() => handleAcc(item.id)}
                      className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" /> ACC & Forward
                    </button>
                    <TolakButton onSubmit={(reason) => handleTolak(item.id, reason)} />
                  </>
                )}
                {item.status === "Proses Srikandi (TTE Pimpinan)" && (
                  <button
                    onClick={() => handleSelesaiTTE(item.id)}
                    className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" /> Upload TTE & Selesaikan
                  </button>
                )}
                {item.status === "Selesai (TTE Terbit)" && item.file_tte_path && (
                  <a
                    href={item.file_tte_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> Lihat File TTE
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TolakButton({ onSubmit }: { onSubmit: (reason: string) => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-red-100 text-red-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
      >
        <XCircle className="w-4 h-4" /> Tolak
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"
        placeholder="Alasan penolakan..."
        autoFocus
      />
      <button
        onClick={() => {
          onSubmit(reason);
          setOpen(false);
          setReason("");
        }}
        className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700"
      >
        Kirim
      </button>
      <button
        onClick={() => {
          setOpen(false);
          setReason("");
        }}
        className="text-gray-500 text-sm hover:text-gray-700"
      >
        Batal
      </button>
    </div>
  );
}

