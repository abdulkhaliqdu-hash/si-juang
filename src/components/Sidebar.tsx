"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Building2,
  Landmark,
  UserPlus,
  User,
  MessageSquare,
  Trophy,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const isActive = (path: string) => pathname === path;

  const adminLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/meja-pelayanan", label: "Meja Pelayanan", icon: Landmark },
    { href: "/daftar-operator", label: "Daftar Operator", icon: UserPlus },
    { href: "/profil", label: "Profil Saya", icon: User },
    { href: "/feedback", label: "Feedback", icon: MessageSquare },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  const operatorLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/loket", label: "Loket Gampong", icon: Building2 },
    { href: "/profil", label: "Profil Saya", icon: User },
    { href: "/feedback", label: "Feedback", icon: MessageSquare },
  ];

  const links = user.role === "kecamatan" ? adminLinks : operatorLinks;

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-900">SI-JUANG</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kecamatan Kota Juang
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-sm font-medium">{user.display_name}</p>
            <p className="text-xs text-gray-400 capitalize">
              {user.role === "kecamatan" ? "Admin Kecamatan" : "Operator Gampong"}
            </p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link ${isActive(link.href) ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <link.icon size={18} />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

