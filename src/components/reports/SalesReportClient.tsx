"use client";

import { useState, useTransition } from "react";
import { formatRupiah } from "@/lib/utils";
import { getSalesReportData, type SalesReportFilter } from "@/app/actions/reports";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Receipt,
  Package,
  Award,
  Users,
  Calendar,
  Banknote,
  QrCode,
  BookOpen,
  ArrowDownLeft,
  Wallet,
  CheckCircle2,
  Filter,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface BestSellerItem {
  name: string;
  categoryName: string;
  quantity: number;
  revenue: number;
  profit: number;
}

interface CashierPerfItem {
  name: string;
  transactionCount: number;
  revenue: number;
}

interface ChartItem {
  date: string;
  revenue: number;
  count: number;
  profit: number;
  cashInflow: number;
}

interface ReportData {
  metrics: {
    totalRevenue: number;
    totalCashInflow: number;
    grossProfit: number;
    totalDiscount: number;
    totalItemsSold: number;
    transactionCount: number;
    averageOrderValue: number;
    breakdown: {
      cashRevenue: number;
      qrisRevenue: number;
      debtSalesTotal: number;
      debtDownPaymentTotal: number;
      unpaidDebtInPeriod: number;
      totalDebtPaymentsCollected: number;
    };
  };
  chartData: ChartItem[];
  bestSellers: BestSellerItem[];
  cashierPerformance: CashierPerfItem[];
  recentDebtPayments?: any[];
}

interface SalesReportClientProps {
  initialData: ReportData;
}

export default function SalesReportClient({ initialData }: SalesReportClientProps) {
  const [data, setData] = useState<ReportData>(initialData);
  const [period, setPeriod] = useState<SalesReportFilter["period"]>("30_DAYS");
  const [paymentMethod, setPaymentMethod] = useState<SalesReportFilter["paymentMethod"]>("ALL");
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (
    newPeriod: SalesReportFilter["period"],
    newPaymentMethod: SalesReportFilter["paymentMethod"] = paymentMethod
  ) => {
    setPeriod(newPeriod);
    setPaymentMethod(newPaymentMethod);
    startTransition(async () => {
      const res = await getSalesReportData({
        period: newPeriod,
        paymentMethod: newPaymentMethod,
      });
      setData(res as any);
    });
  };

  const { metrics, chartData, bestSellers, cashierPerformance } = data;
  const maxSoldQty = bestSellers.length > 0 ? bestSellers[0].quantity : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-emerald-600" />
            <span>Laporan Penjualan & Arus Kas Bisnis</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Analisis omzet barang keluar, uang kas riil masuk, laba kotor, dan rekap piutang kasbon.
          </p>
        </div>

        {/* Filters: Period & Payment Method */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Payment Method Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <select
              value={paymentMethod}
              onChange={(e) =>
                handleFilterChange(
                  period,
                  e.target.value as SalesReportFilter["paymentMethod"]
                )
              }
              disabled={isPending}
              className="bg-transparent text-xs font-bold text-slate-700 pr-2 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Metode</option>
              <option value="CASH">Hanya Tunai</option>
              <option value="QRIS">Hanya QRIS</option>
              <option value="DEBT">Hanya Kasbon</option>
            </select>
          </div>

          {/* Period Selector Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1 hidden sm:block" />
            {[
              { label: "Hari Ini", value: "TODAY" },
              { label: "Kemarin", value: "YESTERDAY" },
              { label: "7 Hari", value: "7_DAYS" },
              { label: "30 Hari", value: "30_DAYS" },
              { label: "Semua", value: "ALL" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() =>
                  handleFilterChange(
                    item.value as SalesReportFilter["period"],
                    paymentMethod
                  )
                }
                disabled={isPending}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  period === item.value
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Omzet Penjualan (Nilai Barang Terjual) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Omzet Penjualan
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatRupiah(metrics.totalRevenue)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Nilai seluruh barang yang keluar / laku
          </p>
        </div>

        {/* 2. Arus Kas Riil Masuk (Real Cash Flow) */}
        <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Uang Kas Riil Diterima
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {formatRupiah(metrics.totalCashInflow)}
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            Uang fisik di kasir + QRIS + pelunasan kasbon
          </p>
        </div>

        {/* 3. Estimasi Laba Kotor */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Estimasi Laba Kotor
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatRupiah(metrics.grossProfit)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Margin:{" "}
            <strong className="text-blue-700">
              {metrics.totalRevenue > 0
                ? Math.round((metrics.grossProfit / metrics.totalRevenue) * 100)
                : 0}
              %
            </strong>{" "}
            dari omzet penjualan
          </p>
        </div>

        {/* 4. Total Transaksi & Item Terjual */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Volume Penjualan
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {metrics.transactionCount}{" "}
            <span className="text-sm font-semibold text-slate-500">Nota</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total {metrics.totalItemsSold} pcs produk terjual
          </p>
        </div>
      </div>

      {/* Payment Method Breakdown Box (Tunai, QRIS, Kasbon Baru, Pelunasan Kasbon) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Banknote className="w-4 h-4 text-emerald-600" />
          <span>Rincian Pembayaran & Piutang Kasbon Periode Ini</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Tunai (Cash) */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
              <Banknote className="w-4 h-4" />
              <span>Penjualan Tunai (Cash)</span>
            </div>
            <div className="mt-2 text-xl font-black text-emerald-900">
              {formatRupiah(metrics.breakdown.cashRevenue)}
            </div>
            <span className="text-[11px] text-emerald-700 mt-1">Uang fisik kasir langsung</span>
          </div>

          {/* 2. QRIS */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-blue-800 text-xs font-bold">
              <QrCode className="w-4 h-4" />
              <span>Penjualan QRIS</span>
            </div>
            <div className="mt-2 text-xl font-black text-blue-900">
              {formatRupiah(metrics.breakdown.qrisRevenue)}
            </div>
            <span className="text-[11px] text-blue-700 mt-1">Masuk rekening digital / bank</span>
          </div>

          {/* 3. Kasbon Baru */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Kasbon Baru Terbentuk</span>
            </div>
            <div className="mt-2 text-xl font-black text-amber-950">
              {formatRupiah(metrics.breakdown.debtSalesTotal)}
            </div>
            <span className="text-[11px] text-amber-800 mt-1">
              Sisa belum lunas: {formatRupiah(metrics.breakdown.unpaidDebtInPeriod)}
            </span>
          </div>

          {/* 4. Pelunasan Kasbon Masuk */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-purple-800 text-xs font-bold">
              <ArrowDownLeft className="w-4 h-4 text-purple-600" />
              <span>Pelunasan Kasbon Diterima</span>
            </div>
            <div className="mt-2 text-xl font-black text-purple-900">
              + {formatRupiah(metrics.breakdown.totalDebtPaymentsCollected)}
            </div>
            <span className="text-[11px] text-purple-700 mt-1">Uang cicilan kasbon yang masuk</span>
          </div>
        </div>
      </div>

      {/* Main Trend Chart: Omzet vs Arus Kas */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Tren Penjualan & Penerimaan Kas Harian
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbandingan grafik pergerakan omzet barang vs uang kas yang masuk
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Belum ada data transaksi pada periode yang dipilih.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCashInflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) =>
                    v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${v / 1000}rb` : v
                  }
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip
                  formatter={(val: any) => [formatRupiah(Number(val) || 0), ""]}
                  labelStyle={{ fontWeight: "bold", color: "#0f172a" }}
                  contentStyle={{
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Omzet Barang"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
                <Area
                  type="monotone"
                  dataKey="cashInflow"
                  name="Uang Kas Diterima"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCashInflow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Two Column Layout: Top 10 Best Sellers & Cashier Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Best Sellers */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>10 Produk Paling Laris</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Berdasarkan Qty Terjual</span>
          </div>

          {bestSellers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Belum ada data produk terjual pada periode ini.
            </div>
          ) : (
            <div className="space-y-3.5">
              {bestSellers.map((prod, idx) => {
                const percentage = Math.round((prod.quantity / maxSoldQty) * 100);

                return (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden pr-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            idx === 0
                              ? "bg-amber-100 text-amber-800"
                              : idx === 1
                              ? "bg-slate-200 text-slate-700"
                              : idx === 2
                              ? "bg-orange-100 text-orange-800"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 truncate">{prod.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                          {prod.categoryName}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-900">{prod.quantity} terjual</span>
                        <span className="text-slate-400 text-[10px] block">
                          {formatRupiah(prod.revenue)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cashier Performance */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Kontribusi Kinerja Kasir</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Berdasarkan Total Omzet</span>
          </div>

          {cashierPerformance.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Belum ada data transaksi kasir pada periode ini.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {cashierPerformance.map((c, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {c.transactionCount} Transaksi Selesai
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm text-emerald-700">{formatRupiah(c.revenue)}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Rata-rata: {formatRupiah(c.transactionCount > 0 ? c.revenue / c.transactionCount : 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
