"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserSession } from "@/lib/auth";
import { logoutServerAction } from "@/app/actions/auth";
import { Store, ShoppingCart, LogOut } from "lucide-react";

interface NavbarProps {
  user: UserSession;
  storeName?: string;
}

export default function Navbar({ user, storeName = "TOKOin" }: NavbarProps) {
  const pathname = usePathname();

  const isAdmin = user.role === "ADMIN";

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Store Name */}
          <div className="flex items-center gap-4">
            <Link
              href={isAdmin ? "/admin/dashboard" : "/pos"}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-white block leading-none">
                  TOKO<span className="text-emerald-400">in</span>
                </span>
                <span className="text-[11px] font-medium text-slate-400 block mt-0.5 truncate max-w-[140px] sm:max-w-[200px]">
                  {storeName}
                </span>
              </div>
            </Link>

            {/* Quick POS Shortcut Button in Topbar */}
            <Link
              href="/pos"
              className={`ml-4 hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                pathname === "/pos"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Buka Kasir (POS)</span>
            </Link>
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-white leading-tight flex items-center gap-1.5 justify-end">
                <span>{user.name}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isAdmin
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  }`}
                >
                  {isAdmin ? "Pemilik" : "Kasir"}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                @{user.username}
              </span>
            </div>

            <form action={logoutServerAction}>
              <button
                type="submit"
                title="Keluar dari Akun"
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/25 hover:border-red-500/40 transition-all cursor-pointer text-xs font-semibold shadow-sm active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Keluar</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
