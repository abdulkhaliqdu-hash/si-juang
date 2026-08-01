"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getDashboardStats, DashboardStats } from "@/lib/api";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getDashboardStats()
        .then(setStats)
        .catch(() => setError("Gagal memuat data statistik."));
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const cards = [
    {
      label: "Total Permohonan",
      value: stats?.total_permohonan ?? 0,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Menunggu Verifikasi",
      value: stats?.menunggu_verifikasi ?? 0,
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "Proses Srikandi",
      value: stats?.proses_srikandi ?? 0,
      icon: RefreshCw,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Selesai TTE",
      value: stats?.selesai_tte ?? 0,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Ditolak",
      value: stats?.ditolak ?? 0,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Selamat datang, {user.display_name}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="card p-5">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Permohonan per Bulan */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">
          Permohonan per Bulan (6 Bulan Terakhir)
        </h2>
        {stats && stats.permohonan_per_bulan.length > 0 ? (
          <div className="space-y-3">
            {stats.permohonan_per_bulan.map((item) => {
              const maxVal = Math.max(
                ...stats.permohonan_per_bulan.map((p) => p.jumlah)
              );
              const pct = maxVal > 0 ? (item.jumlah / maxVal) * 100 : 0;
              return (
                <div key={item.bulan} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-20">
                    {item.bulan}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">
                    {item.jumlah}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">
            Belum ada data permohonan.
          </p>
        )}
      </div>

      {/* Per Jenis Surat */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">
          Permohonan per Jenis Surat
        </h2>
        {stats && stats.per_jenis_surat.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.per_jenis_surat.map((item) => (
              <div
                key={item.jenis_surat}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm font-medium">{item.jenis_surat}</span>
                <span className="text-lg font-bold text-blue-600">
                  {item.jumlah}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">
            Belum ada data permohonan.
          </p>
        )}
      </div>
    </div>
  );
}

