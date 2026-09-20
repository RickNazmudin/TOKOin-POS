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
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
}

interface ReportData {
  metrics: {
    totalRevenue: number;
    grossProfit: number;
    totalDiscount: number;
    totalItemsSold: number;
    transactionCount: number;
    averageOrderValue: number;
  };
  chartData: ChartItem[];
  bestSellers: BestSellerItem[];
  cashierPerformance: CashierPerfItem[];
}

interface SalesReportClientProps {
  initialData: ReportData;
}

export default function SalesReportClient({ initialData }: SalesReportClientProps) {
  const [data, setData] = useState<ReportData>(initialData);
  const [period, setPeriod] = useState<SalesReportFilter["period"]>("30_DAYS");
  const [isPending, startTransition] = useTransition();

  const handlePeriodChange = (newPeriod: SalesReportFilter["period"]) => {
    setPeriod(newPeriod);
    startTransition(async () => {
      const res = await getSalesReportData({ period: newPeriod });
      setData(res);
    });
  };

  const { metrics, chartData, bestSellers, cashierPerformance } = data;
  const maxSoldQty = bestSellers.length > 0 ? bestSellers[0].quantity : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            <span>Laporan Penjualan & Analitik Bisnis</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Analisis omzet penjualan, laba kotor, produk terlaris, dan kinerja kasir toko.
          </p>
        </div>

        {/* Period Selector Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-400 ml-2 mr-1 hidden sm:block" />
          {[
            { label: "Hari Ini", value: "TODAY" },
            { label: "Kemarin", value: "YESTERDAY" },
            { label: "7 Hari", value: "7_DAYS" },
            { label: "30 Hari", value: "30_DAYS" },
            { label: "Semua", value: "ALL" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => handlePeriodChange(item.value as SalesReportFilter["period"])}
              disabled={isPending}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
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

      {/* 4 Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Omzet */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Penjualan (Omzet)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {formatRupiah(metrics.totalRevenue)}
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-0.5">
            Bruto sebelum potongan diskon
          </p>
        </div>

        {/* Metric 2: Estimasi Laba Kotor */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Estimasi Laba Kotor
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-teal-600 mt-2">
            {formatRupiah(metrics.grossProfit)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Total Omzet &minus; Harga Modal Beli
          </p>
        </div>

        {/* Metric 3: Total Transaksi & Rata-rata */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Transaksi
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {metrics.transactionCount}{" "}
            <span className="text-sm font-semibold text-slate-500">Struk</span>
          </p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Rata-rata: {formatRupiah(metrics.averageOrderValue)} / transaksi
          </p>
        </div>

        {/* Metric 4: Total Barang Terjual */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Item Terjual
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-2">
            {metrics.totalItemsSold}{" "}
            <span className="text-sm font-semibold text-slate-500">Pcs</span>
          </p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Total diskon nota: {formatRupiah(metrics.totalDiscount)}
          </p>
        </div>
      </div>

      {/* Interactive Sales Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Grafik Tren Omzet & Laba
            </h2>
            <p className="text-xs text-slate-500">
              Visualisasi pendapatan harian toko Anda pada periode yang dipilih
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Omzet Penjualan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-teal-400" />
              <span>Estimasi Laba</span>
            </div>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <BarChart3 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">
              Belum Ada Data Grafik
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Data grafik akan otomatis terbentuk seiring bertambahnya transaksi kasir.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(val) => `Rp${(val / 1000).toLocaleString()}k`}
                />
                <Tooltip
                  formatter={(val) => [formatRupiah(Number(val) || 0), ""]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Omzet"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Laba"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 2 Columns: Peringkat Produk Terlaris & Performa Kasir */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Best Selling Products */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Peringkat 10 Produk Terlaris
                </h2>
                <p className="text-xs text-slate-500">
                  Urutan barang yang paling sering dibeli oleh pelanggan
                </p>
              </div>
            </div>
          </div>

          {bestSellers.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Package className="w-8 h-8 mx-auto mb-1 text-slate-300" />
              <p className="text-xs font-bold text-slate-600">Belum Ada Produk Terjual</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {bestSellers.map((item, idx) => {
                const percent = Math.round((item.quantity / maxSoldQty) * 100);

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 overflow-hidden pr-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            idx === 0
                              ? "bg-amber-100 text-amber-800 ring-2 ring-amber-400/30"
                              : idx === 1
                              ? "bg-slate-200 text-slate-700"
                              : idx === 2
                              ? "bg-orange-100 text-orange-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-3">
                        <span className="font-black text-emerald-700">
                          {item.quantity} Terjual
                        </span>
                        <span className="text-slate-500 font-semibold hidden sm:inline">
                          ({formatRupiah(item.revenue)})
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Performa Kasir */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-indigo-500" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Performa Petugas Kasir
                </h2>
                <p className="text-xs text-slate-500">
                  Kontribusi transaksi per kasir
                </p>
              </div>
            </div>

            {cashierPerformance.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">Belum Ada Data Kasir</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cashierPerformance.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{c.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {c.transactionCount} Transaksi Selesai
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-slate-900">
                        {formatRupiah(c.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
