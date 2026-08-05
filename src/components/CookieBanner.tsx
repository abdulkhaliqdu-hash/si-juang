"use client";

import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [accepted, setAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem("si-juang-cookie-accepted");
      setAccepted(v === "1");
    } catch (e) {
      setAccepted(false);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem("si-juang-cookie-accepted", "1");
    } catch (e) {
      // ignore
    }
    setAccepted(true);
  };

  if (accepted) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 max-w-3xl mx-auto bg-white border border-gray-200 shadow-md rounded-lg p-4 z-50">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">Kami menggunakan cookie</p>
          <p className="text-sm text-gray-500">Dengan melanjutkan, Anda menyetujui penggunaan cookie untuk fungsionalitas situs. Data pribadi sensitif tidak disimpan di cookie.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={accept} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Izinkan</button>
        </div>
      </div>
    </div>
  );
}
