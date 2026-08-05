"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result = await login(username.trim(), password);
      if (!result) {
        setError("Username atau password tidak valid.");
        setSubmitting(false);
        return;
      }
      router.replace("/dashboard");
    } catch (err) {
      setError("Gagal masuk. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200 shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Masuk ke SI-JUANG</h1>
        <p className="text-sm text-gray-500 mb-6">
          Masukkan username dan password Anda untuk melanjutkan.
        </p>
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-white font-semibold transition hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}

