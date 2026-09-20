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
} from "lucide-react";

interface MobileNavProps {
  user: UserSession;
}

export default function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN";

  const adminItems = [
    { label: "Dasbor", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Kasir", href: "/pos", icon: ShoppingCart },
    { label: "Produk", href: "/admin/products", icon: Package },
    { label: "Stok", href: "/admin/inventory", icon: Boxes },
    { label: "Transaksi", href: "/admin/transactions", icon: ReceiptText },
    { label: "Laporan", href: "/admin/reports", icon: BarChart3 },
  ];

  const cashierItems = [
    { label: "Kasir (POS)", href: "/pos", icon: ShoppingCart },
    { label: "Transaksi", href: "/cashier/transactions", icon: ReceiptText },
    { label: "Produk", href: "/cashier/products", icon: Package },
  ];

  const items = isAdmin ? adminItems : cashierItems;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 py-1.5">
      <nav className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold transition ${
                isActive
                  ? "text-emerald-600 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-0.5 ${
                  isActive ? "text-emerald-600" : "text-slate-400"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
