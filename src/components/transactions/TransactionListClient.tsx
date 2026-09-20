"use client";

import { useState, useMemo } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import TransactionDetailModal from "./TransactionDetailModal";
import {
  Receipt,
  Search,
  Eye,
  TrendingUp,
  Banknote,
  QrCode,
  ShoppingCart,
} from "lucide-react";

interface TransactionItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Transaction {
  id: string;
  invoiceNumber: string;
  createdAt: string | Date;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paidAmount: number;
  changeAmount: number;
  status: string;
  cashier: {
    name: string;
    username: string;
  };
  items: TransactionItem[];
}

interface StoreSettings {
  storeName?: string;
  address?: string | null;
  phone?: string | null;
  receiptFooter?: string | null;
}

interface TransactionListClientProps {
  initialTransactions: Transaction[];
  storeSettings?: StoreSettings | null;
  isAdmin?: boolean;
}

export default function TransactionListClient({
  initialTransactions,
  storeSettings,
  isAdmin = true,
}: TransactionListClientProps) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("SEMUA");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");

  // Selected Transaction for modal
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();

    return initialTransactions.filter((tx) => {
      const txDate = new Date(tx.createdAt);

      // Date filtering
      if (dateFilter === "HARI_INI") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (txDate < today) return false;
      } else if (dateFilter === "7_HARI") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (txDate < sevenDaysAgo) return false;
      } else if (dateFilter === "30_HARI") {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (txDate < thirtyDaysAgo) return false;
      }

      // Payment method filtering
      if (paymentFilter !== "ALL" && tx.paymentMethod !== paymentFilter) {
        return false;
      }

      // Search query filtering
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesInvoice = tx.invoiceNumber.toLowerCase().includes(q);
        const matchesCashier = tx.cashier.name.toLowerCase().includes(q);
        const matchesItem = tx.items.some((i) =>
          i.productName.toLowerCase().includes(q)
        );
        if (!matchesInvoice && !matchesCashier && !matchesItem) return false;
      }

      return true;
    });
  }, [initialTransactions, search, dateFilter, paymentFilter]);

  // Summary Metrics
  const totalRevenue = useMemo(
    () => filteredTransactions.reduce((acc, curr) => acc + curr.total, 0),
    [filteredTransactions]
  );

  const totalCount = filteredTransactions.length;
  const averageTicket = totalCount > 0 ? totalRevenue / totalCount : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            <span>{isAdmin ? "Riwayat Semua Transaksi Penjualan" : "Riwayat Transaksi Saya"}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Daftar seluruh nota pembayaran, rincian produk yang terjual, dan cetak ulang struk.
          </p>
        </div>
      </div>

      {/* 3 Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Omzet Terfilter
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {formatRupiah(totalRevenue)}
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-0.5">
            Dari {totalCount} transaksi
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Jumlah Transaksi (Struk)
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {totalCount}{" "}
            <span className="text-sm font-semibold text-slate-500">Struk</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Status: Selesai (Completed)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rata-rata Nilai Belanja
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-2">
            {formatRupiah(averageTicket)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Rata-rata per pelanggan
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari no. faktur / nama kasir / nama barang..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="SEMUA">Semua Tanggal</option>
            <option value="HARI_INI">Hari Ini Saja</option>
            <option value="7_HARI">7 Hari Terakhir</option>
            <option value="30_HARI">30 Hari Terakhir</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">Semua Pembayaran</option>
            <option value="CASH">Hanya Tunai (Cash)</option>
            <option value="QRIS">Hanya QRIS</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-700">
              Tidak Ada Transaksi
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tidak ditemukan data transaksi yang sesuai dengan kriteria filter pencarian.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">No. Invoice</th>
                  <th className="py-3.5 px-4">Waktu Transaksi</th>
                  {isAdmin && <th className="py-3.5 px-4">Kasir</th>}
                  <th className="py-3.5 px-4 text-center">Jumlah Barang</th>
                  <th className="py-3.5 px-4">Metode Bayar</th>
                  <th className="py-3.5 px-4 text-right">Total Transaksi</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => {
                  const itemCount = tx.items.reduce((acc, curr) => acc + curr.quantity, 0);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                        {tx.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                          {tx.cashier.name}
                        </td>
                      )}
                      <td className="py-3.5 px-4 text-center text-xs text-slate-600">
                        <span className="font-bold text-slate-800">{itemCount}</span> Item
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            tx.paymentMethod === "CASH"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {tx.paymentMethod === "CASH" ? (
                            <Banknote className="w-3.5 h-3.5" />
                          ) : (
                            <QrCode className="w-3.5 h-3.5" />
                          )}
                          <span>{tx.paymentMethod === "CASH" ? "Tunai" : "QRIS"}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                        {formatRupiah(tx.total)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Rincian & Struk</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
        storeSettings={storeSettings}
      />
    </div>
  );
}
