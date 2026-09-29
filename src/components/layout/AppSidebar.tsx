"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserSession } from "@/lib/auth";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  ReceiptText,
  BarChart3,
  Users,
  Settings,
  BookOpen,
} from "lucide-react";

interface AppSidebarProps {
  user: UserSession;
}

export default function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN";

  const adminNavItems = [
    {
      label: "Dasbor",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Mesin Kasir (POS)",
      href: "/pos",
      icon: ShoppingCart,
      highlight: true,
    },
    {
      label: "Buku Kasbon / Piutang",
      href: "/admin/debts",
      icon: BookOpen,
    },
    {
      label: "Produk & Kategori",
      href: "/admin/products",
      icon: Package,
    },
    {
      label: "Stok & Mutasi",
      href: "/admin/inventory",
      icon: Boxes,
    },
    {
      label: "Riwayat Transaksi",
      href: "/admin/transactions",
      icon: ReceiptText,
    },
    {
      label: "Laporan Penjualan",
      href: "/admin/reports",
      icon: BarChart3,
    },
    {
      label: "Kelola Kasir",
      href: "/admin/cashiers",
      icon: Users,
    },
    {
      label: "Pengaturan Toko",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  const cashierNavItems = [
    {
      label: "Mesin Kasir (POS)",
      href: "/pos",
      icon: ShoppingCart,
      highlight: true,
    },
    {
      label: "Buku Kasbon / Piutang",
      href: "/cashier/debts",
      icon: BookOpen,
    },
    {
      label: "Riwayat Transaksi",
      href: "/cashier/transactions",
      icon: ReceiptText,
    },
    {
      label: "Daftar Produk",
      href: "/cashier/products",
      icon: Package,
    },
  ];

  const items = isAdmin ? adminNavItems : cashierNavItems;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 shrink-0 hidden md:flex flex-col justify-between py-6 px-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            {isAdmin ? "Menu Pemilik / Admin" : "Menu Kasir"}
          </p>
          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? item.highlight
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                        : "bg-emerald-50 text-emerald-800"
                      : item.highlight
                      ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 font-bold border border-emerald-500/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive
                        ? item.highlight
                          ? "text-white"
                          : "text-emerald-700"
                        : item.highlight
                        ? "text-emerald-600"
                        : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-500">
        <p className="font-bold text-slate-700">TOKOin POS Pintar</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Versi 1.2.0 • UMKM</p>
      </div>
    </aside>
  );
}
