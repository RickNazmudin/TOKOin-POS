import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  TrendingUp,
  Receipt,
  PackageCheck,
  AlertTriangle,
  ShoppingCart,
  ArrowRight,
  Boxes,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Fetch today's completed transactions
  const todayTransactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: today },
      status: "COMPLETED",
    },
  });

  const todaySales = todayTransactions.reduce((acc: number, curr: { total: number }) => acc + curr.total, 0);
  const todayTransactionCount = todayTransactions.length;

  // 2. Fetch total active products
  const totalProducts = await prisma.product.count({
    where: { status: "ACTIVE" },
  });

  // Filter products where stock <= minimumStock
  const criticalStockList = (
    await prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: { category: true },
      orderBy: { stock: "asc" },
    })
  ).filter((p: { stock: number; minimumStock: number }) => p.stock <= p.minimumStock);

  // 4. Fetch recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      cashier: true,
      items: true,
    },
  });

  return (
    <AppLayout requiredRole="ADMIN">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Ringkasan Toko & Dasbor Pemilik
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Pantau omzet harian, performa transaksi kasir, dan status stok toko Anda.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/pos"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Buka Kasir (POS)</span>
            </Link>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Omzet Hari Ini */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Penjualan Hari Ini
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {formatRupiah(todaySales)}
              </p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                Real-time terhitung dari transaksi kasir
              </p>
            </div>
          </div>

          {/* Card 2: Jumlah Transaksi */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Transaksi Hari Ini
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {todayTransactionCount}{" "}
                <span className="text-sm font-semibold text-slate-500">
                  Struk
                </span>
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Transaksi berhasil diselesaikan
              </p>
            </div>
          </div>

          {/* Card 3: Total Produk */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Produk Aktif
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <PackageCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {totalProducts}{" "}
                <span className="text-sm font-semibold text-slate-500">
                  Item
                </span>
              </p>
              <Link
                href="/admin/products"
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold mt-1 inline-flex items-center gap-1"
              >
                <span>Kelola Produk</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 4: Stok Menipis */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Peringatan Stok Menipis
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-amber-600 tracking-tight">
                {criticalStockList.length}{" "}
                <span className="text-sm font-semibold text-slate-500">
                  Produk
                </span>
              </p>
              <Link
                href="/admin/inventory"
                className="text-xs text-amber-700 hover:text-amber-800 font-semibold mt-1 inline-flex items-center gap-1"
              >
                <span>Lihat & Restock</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* 2 Columns: Transaksi Terakhir & Stok Menipis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Recent Transactions */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Transaksi Terkini
                </h2>
                <p className="text-xs text-slate-500">
                  Daftar transaksi penjualan terbaru di kasir
                </p>
              </div>
              <Link
                href="/admin/transactions"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">
                  Belum Ada Transaksi
                </p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Buka mesin kasir untuk mulai transaksi pertama Anda.
                </p>
                <Link
                  href="/pos"
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 inline-flex items-center gap-2"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Buka Kasir
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">No. Invoice</th>
                      <th className="pb-3 font-semibold">Waktu</th>
                      <th className="pb-3 font-semibold">Kasir</th>
                      <th className="pb-3 font-semibold">Metode</th>
                      <th className="pb-3 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 font-mono font-bold text-xs text-slate-900">
                          {tx.invoiceNumber}
                        </td>
                        <td className="py-3 text-xs text-slate-500">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="py-3 text-xs font-medium text-slate-700">
                          {tx.cashier.name}
                        </td>
                        <td className="py-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              tx.paymentMethod === "CASH"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {tx.paymentMethod === "CASH" ? "Tunai" : "QRIS"}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900 text-sm">
                          {formatRupiah(tx.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right 1 Col: Critical Low Stock Alert */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Perlu Restock Segera
                    </h2>
                    <p className="text-xs text-slate-500">
                      Stok di bawah batas minimum
                    </p>
                  </div>
                </div>
              </div>

              {criticalStockList.length === 0 ? (
                <div className="text-center py-8 text-emerald-600 bg-emerald-50/50 rounded-xl border border-emerald-100 p-4">
                  <PackageCheck className="w-8 h-8 mx-auto mb-1 text-emerald-600" />
                  <p className="text-xs font-bold text-emerald-800">
                    Stok Semua Aman!
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">
                    Tidak ada produk yang menipis saat ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {criticalStockList.slice(0, 5).map((prod) => (
                    <div
                      key={prod.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                    >
                      <div className="overflow-hidden pr-2">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {prod.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Kategori: {prod.category.name}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-extrabold bg-red-100 text-red-700">
                          Sisa {prod.stock}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">
                          Min: {prod.minimumStock}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link
                href="/admin/inventory"
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                <Boxes className="w-4 h-4" />
                <span>Buka Menu Penyesuaian Stok</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
