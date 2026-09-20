import AppLayout from "@/components/layout/AppLayout";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  ShoppingCart,
  Receipt,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";

export default async function CashierDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Cashier's transactions today
  const myTodayTransactions = await prisma.transaction.findMany({
    where: {
      cashierId: user.id,
      createdAt: { gte: today },
      status: "COMPLETED",
    },
    orderBy: { createdAt: "desc" },
  });

  const mySales = myTodayTransactions.reduce((acc, curr) => acc + curr.total, 0);
  const myCount = myTodayTransactions.length;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome & Primary CTA Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-700/20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Shift Kasir Aktif</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Halo, {user.name}! 👋
            </h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-md">
              Siap melayani pelanggan warung hari ini? Tekan tombol di samping untuk langsung membuka mesin kasir.
            </p>
          </div>

          <Link
            href="/pos"
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-emerald-50 text-emerald-800 text-base font-extrabold rounded-2xl shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shrink-0 cursor-pointer"
          >
            <ShoppingCart className="w-6 h-6 text-emerald-600" />
            <span>+ Transaksi Baru</span>
          </Link>
        </div>

        {/* 2 Cashier Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Penjualan Kasir Anda Hari Ini
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">
              {formatRupiah(mySales)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Total omzet yang Anda catat hari ini
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Jumlah Transaksi Anda
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">
              {myCount}{" "}
              <span className="text-sm font-semibold text-slate-500">
                Pelanggan
              </span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Struk belanja berhasil dibuat
            </p>
          </div>
        </div>

        {/* Recent Transactions for this Cashier */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              <h2 className="text-base font-bold text-slate-900">
                Transaksi Terakhir Anda
              </h2>
            </div>
            <Link
              href="/cashier/transactions"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              Lihat Riwayat Saya &rarr;
            </Link>
          </div>

          {myTodayTransactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Belum ada transaksi pada shift ini. Klik tombol <strong>+ Transaksi Baru</strong> di atas untuk mulai melayani pembeli.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myTodayTransactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition"
                >
                  <div>
                    <p className="text-xs font-mono font-bold text-slate-900">
                      {tx.invoiceNumber}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatDate(tx.createdAt)} &bull; {tx.paymentMethod === "CASH" ? "Tunai" : "QRIS"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-slate-900">
                      {formatRupiah(tx.total)}
                    </p>
                    <span className="text-[10px] font-semibold text-emerald-600">
                      Berhasil
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
