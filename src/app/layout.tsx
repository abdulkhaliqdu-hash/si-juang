import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "SI-JUANG - Sistem Informasi Juang",
  description: "Sistem Integrasi Layanan Administrasi Gampong & Kecamatan Kota Juang, Bireuen",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-8 overflow-auto">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

