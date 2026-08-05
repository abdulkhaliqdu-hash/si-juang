"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getLeaderboard } from "@/lib/api";
import { Trophy, Medal, Award, RefreshCw } from "lucide-react";

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [data, setData] = useState<{ gampong: string; layanan: number }[]>([]);

  const loadData = () => {
    getLeaderboard()
      .then((res) => setData(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const getIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-amber-600" />;
    return null;
  };

  const getRowBg = (index: number) => {
    if (index === 0) return "bg-yellow-50 border-yellow-200";
    if (index === 1) return "bg-gray-50 border-gray-200";
    if (index === 2) return "bg-amber-50 border-amber-200";
    return "border-gray-100 hover:bg-gray-50";
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const maxLayanan = data.length > 0 ? data[0].layanan : 1;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            🏆 Leaderboard Layanan Gampong
          </h1>
          <p className="text-gray-500 mt-1">
            Peringkat gampong berdasarkan jumlah permohonan layanan
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {data.length === 0 ? (
        <div className="card p-8 text-center">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">
            Belum ada data layanan untuk leaderboard.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item, index) => (
            <div
              key={item.gampong}
              className={`card p-5 border-2 ${getRowBg(index)} flex items-center gap-4`}
            >
              <div className="w-10 text-center">
                {getIcon(index) || (
                  <span className="text-lg font-bold text-gray-400">
                    #{index + 1}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {item.gampong}
                </h3>
                <div className="mt-2 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      index === 0
                        ? "bg-yellow-500"
                        : index === 1
                        ? "bg-gray-400"
                        : index === 2
                        ? "bg-amber-600"
                        : "bg-blue-500"
                    }`}
                    style={{ width: `${(item.layanan / maxLayanan) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {item.layanan}
                </p>
                <p className="text-xs text-gray-400">Layanan</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

