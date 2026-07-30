"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { updateProfile, changePassword } from "@/lib/api";
import { User, Save, Key, AlertCircle, CheckCircle } from "lucide-react";

export default function ProfilPage() {
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [namaKeuchik, setNamaKeuchik] = useState("");
  const [noWa, setNoWa] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Password form
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSubmitting, setPwSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || "");
      setNamaKeuchik(user.nama_keuchik || "");
      setNoWa(user.no_wa || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await updateProfile(user!.username, {
        display_name: displayName,
        nama_keuchik: namaKeuchik,
        no_wa: noWa,
        email,
      });
      await refreshUser();
      setSuccess("Profil berhasil diperbarui.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui profil.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (!oldPw || !newPw || !confirmPw) {
      setPwError("Lengkapi semua kolom password.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("Password baru dan konfirmasi tidak cocok.");
      return;
    }
    if (newPw.length < 6) {
      setPwError("Password baru minimal 6 karakter.");
      return;
    }

    setPwSubmitting(true);
    try {
      await changePassword(user!.username, oldPw, newPw);
      setPwSuccess("Password berhasil diganti.");
      setOldPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "Password lama salah.");
    } finally {
      setPwSubmitting(false);
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
        <h1 className="text-2xl font-bold text-gray-900">👤 Profil Saya</h1>
      </div>

      {/* User Info Card */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user.display_name}</h2>
            <p className="text-sm text-gray-500">
              @{user.username} &middot;{" "}
              {user.role === "kecamatan" ? "Admin Kecamatan" : "Operator Gampong"}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-start gap-2 mb-4 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg flex items-start gap-2 mb-4 text-sm">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmitProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Tampilan
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={user.username}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            {user.nama_gampong && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gampong
                </label>
                <input
                  type="text"
                  value={user.nama_gampong}
                  disabled
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Keuchik
              </label>
              <input
                type="text"
                value={namaKeuchik}
                onChange={(e) => setNamaKeuchik(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. WA
              </label>
              <input
                type="text"
                value={noWa}
                onChange={(e) => setNoWa(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {submitting ? "Menyimpan..." : "Simpan Profil"}
          </button>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Key className="w-5 h-5" /> Ganti Password
        </h2>

        {pwError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-start gap-2 mb-4 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{pwError}</span>
          </div>
        )}
        {pwSuccess && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg flex items-start gap-2 mb-4 text-sm">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{pwSuccess}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password Lama
            </label>
            <input
              type="password"
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password Baru
            </label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={pwSubmitting}
            className="bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            {pwSubmitting ? "Memproses..." : "Ganti Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

