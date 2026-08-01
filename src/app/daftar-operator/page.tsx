"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { registerOperator } from "@/lib/api";
import { UserPlus, AlertCircle, CheckCircle } from "lucide-react";

const GAMPONG_LIST = [
  "Bireuen Meunasah Capa", "Geudong-Geudong", "Kota Bireuen",
  "Pulo Ara Geudong Teungoh", "Meunasah Reuleut", "Bandar Bireuen",
  "Geulanggang Gampong", "Geulanggang Teungoh", "Geulanggang Kulam",
  "Pulo Kiton", "Blang Bireuen", "Cot Gapu", "Lhok Awe-Awe",
  "Meunasah Blang", "Meunasah Gadong", "Meunasah Tgk Digadong",
  "Meunasah Dayah", "Meunasah Capa", "Uteun Reutoh",
  "Bireuen Meunasah Dayah", "Cadang", "Geudong Alue", "Paya Cut",
];

export default function DaftarOperatorPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [form, setForm] = useState({
    username: "",
    password: "",
    display_name: "",
    nama_gampong: GAMPONG_LIST[0],
    nama_keuchik: "",
    no_wa: "",
    email: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && user.role !== "kecamatan") router.replace("/dashboard");
  }, [user, loading, router]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const required = ["username", "password", "display_name", "nama_keuchik", "no_wa"];
    for (const field of required) {
      if (!form[field as keyof typeof form]) {
        setError("Lengkapi semua kolom wajib.");
        return;
      }
    }

    setSubmitting(true);
    try {
      await registerOperator(form);
      setSuccess(`Operator ${form.display_name} berhasil didaftarkan.`);
      setForm({
        username: "",
        password: "",
        display_name: "",
        nama_gampong: GAMPONG_LIST[0],
        nama_keuchik: "",
        no_wa: "",
        email: "",
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mendaftarkan operator.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          📝 Pendaftaran Operator Gampong
        </h1>
        <p className="text-gray-500 mt-1">
          Hanya admin Kecamatan yang dapat menambahkan akun operator baru
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username Operator *
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="operator_baru"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Min. 6 karakter"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Operator *
              </label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => handleChange("display_name", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Nama lengkap operator"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Gampong *
              </label>
              <select
                value={form.nama_gampong}
                onChange={(e) => handleChange("nama_gampong", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                Nama Keuchik *
              </label>
              <input
                type="text"
                value={form.nama_keuchik}
                onChange={(e) => handleChange("nama_keuchik", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Keuchik Gampong"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. WA *
              </label>
              <input
                type="text"
                value={form.no_wa}
                onChange={(e) => handleChange("no_wa", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="081234567890"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (opsional)
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="operator@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            {submitting ? "Mendaftarkan..." : "Daftarkan Operator"}
          </button>
        </form>
      </div>
    </div>
  );
}

