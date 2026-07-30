"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getPermohonan, getFeedback, submitFeedback, Permohonan } from "@/lib/api";
import { MessageSquare, Send, AlertCircle, ThumbsUp, ThumbsDown, Meh } from "lucide-react";

export default function FeedbackPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [permohonan, setPermohonan] = useState<Permohonan[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [kepuasan, setKepuasan] = useState("Puas");
  const [catatan, setCatatan] = useState("");
  const [rekap, setRekap] = useState<{
    total_feedback: number;
    detail: Record<string, number>;
    masukan_tidak_puas: { permohonan_id: number; catatan?: string; waktu_feedback: string }[];
  } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const loadData = () => {
    getPermohonan().then((res) => setPermohonan(res.data)).catch(() => {});
    getFeedback()
      .then(setRekap)
      .catch(() => {});
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedId) {
      setError("Pilih permohonan terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback(parseInt(selectedId), kepuasan, catatan);
      setSuccess("Terima kasih atas feedback Anda.");
      setSelectedId("");
      setKepuasan("Puas");
      setCatatan("");
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengirim feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const getKepuasanIcon = (k: string) => {
    if (k === "Sangat Puas") return <ThumbsUp className="w-4 h-4 text-green-600" />;
    if (k === "Puas") return <Meh className="w-4 h-4 text-blue-600" />;
    return <ThumbsDown className="w-4 h-4 text-red-600" />;
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          💬 Feedback & Evaluasi Pelayanan
        </h1>
        <p className="text-gray-500 mt-1">
          Monitoring kepuasan masyarakat dan kualitas layanan Gampong-Kecamatan
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg">{success}</div>
      )}

      {/* Form Feedback */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Kirim Feedback</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pilih Permohonan
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Pilih --</option>
              {permohonan.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.id} - {p.nik} - {p.nama_pemohon}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tingkat Kepuasan
            </label>
            <div className="flex gap-3">
              {["Sangat Puas", "Puas", "Tidak Puas"].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKepuasan(k)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    kepuasan === k
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {getKepuasanIcon(k)}
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan / Kritik / Saran
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
              placeholder="Tulis masukan Anda..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitting ? "Mengirim..." : "Kirim Feedback"}
          </button>
        </form>
      </div>

      {/* Rekap Evaluasi */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">📊 Rekap Evaluasi Pelayanan</h2>

        {rekap && (
          <>
            <div className="mb-4">
              <p className="text-3xl font-bold text-blue-600">
                {rekap.total_feedback}
              </p>
              <p className="text-sm text-gray-500">Total Feedback</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {["Sangat Puas", "Puas", "Tidak Puas"].map((k) => (
                <div
                  key={k}
                  className="text-center p-4 bg-gray-50 rounded-lg"
                >
                  <p className="text-2xl font-bold">
                    {rekap.detail[k] || 0}
                  </p>
                  <p className="text-sm text-gray-500">{k}</p>
                </div>
              ))}
            </div>

            {rekap.masukan_tidak_puas.length > 0 && (
              <div>
                <h3 className="font-medium text-red-600 mb-3">
                  Masukan Tidak Puas
                </h3>
                <div className="space-y-2">
                  {rekap.masukan_tidak_puas.map((f, i) => (
                    <div
                      key={i}
                      className="bg-red-50 p-3 rounded-lg text-sm"
                    >
                      <p className="font-medium">
                        Permohonan #{f.permohonan_id}
                      </p>
                      {f.catatan && <p className="text-gray-600 mt-1">{f.catatan}</p>}
                      <p className="text-xs text-gray-400 mt-1">{f.waktu_feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!rekap && (
          <p className="text-gray-400 text-sm">Belum ada data feedback.</p>
        )}
      </div>
    </div>
  );
}

