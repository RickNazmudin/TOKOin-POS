"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah, formatDate } from "@/lib/utils";
import StockAdjustmentModal from "./StockAdjustmentModal";
import {
  Boxes,
  Layers,
  History,
  AlertTriangle,
  Search,
  PlusCircle,
  SlidersHorizontal,
  Package,
  CheckCircle2,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  categoryId: string;
  category: { id: string; name: string };
  name: string;
  sku?: string | null;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minimumStock: number;
  status: string;
}

interface StockMovement {
  id: string;
  productId: string;
  product: { name: string; sku?: string | null; category: { name: string } };
  userId: string;
  user: { name: string };
  type: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  referenceType?: string | null;
  referenceId?: string | null;
  reason?: string | null;
  createdAt: string | Date;
}

interface InventoryClientProps {
  products: Product[];
  categories: Category[];
  movements: StockMovement[];
}

export default function InventoryClient({
  products,
  categories,
  movements,
}: InventoryClientProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"stocks" | "history">("stocks");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [stockFilter, setStockFilter] = useState<string>("ALL"); // ALL, LOW, OUT

  // Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Summary KPIs
  const totalUnits = useMemo(
    () => products.reduce((acc, curr) => acc + curr.stock, 0),
    [products]
  );

  const totalAssetValue = useMemo(
    () => products.reduce((acc, curr) => acc + curr.costPrice * curr.stock, 0),
    [products]
  );

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= p.minimumStock).length,
    [products]
  );

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

      const matchesCat =
        selectedCategory === "ALL" || p.categoryId === selectedCategory;

      let matchesStock = true;
      if (stockFilter === "LOW") {
        matchesStock = p.stock > 0 && p.stock <= p.minimumStock;
      } else if (stockFilter === "OUT") {
        matchesStock = p.stock === 0;
      }

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, search, selectedCategory, stockFilter]);

  // Filter movements
  const filteredMovements = useMemo(() => {
    if (!search.trim()) return movements;
    const q = search.toLowerCase();
    return movements.filter(
      (m) =>
        m.product.name.toLowerCase().includes(q) ||
        (m.product.sku && m.product.sku.toLowerCase().includes(q)) ||
        (m.reason && m.reason.toLowerCase().includes(q)) ||
        m.user.name.toLowerCase().includes(q)
    );
  }, [movements, search]);

  const openAdjustment = (product?: Product) => {
    setSelectedProductForAdjust(product || null);
    setIsAdjustModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-600" />
            <span>Manajemen Stok & Mutasi Barang</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Pantau saldo fisik barang, nilai aset persediaan, dan catat penyesuaian stok masuk/keluar.
          </p>
        </div>

        <button
          onClick={() => openAdjustment()}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Penyesuaian Stok (Adjustment)</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 3 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Total Unit Fisik Toko
          </span>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {totalUnits.toLocaleString("id-ID")}{" "}
            <span className="text-sm font-semibold text-slate-500">Unit</span>
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Dari {products.length} macam produk aktif
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Estimasi Nilai Aset Persediaan
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            {formatRupiah(totalAssetValue)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Dihitung dari total (Stok Fisik &times; Harga Modal)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Peringatan Stok Menipis
          </span>
          <p className="text-2xl font-black text-amber-600 mt-2">
            {lowStockCount}{" "}
            <span className="text-sm font-semibold text-slate-500">Produk</span>
          </p>
          <p className="text-xs text-amber-700 font-medium mt-0.5">
            Stok &le; batas minimum toko
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("stocks")}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === "stocks"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Daftar Stok Produk ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === "history"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Buku Kartu Stok & Mutasi ({movements.length})</span>
        </button>
      </div>

      {/* TAB 1: DAFTAR STOK PRODUK */}
      {activeTab === "stocks" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama barang atau barcode..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Stock Status Filter */}
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="ALL">Semua Kondisi Stok</option>
                <option value="LOW">Peringatan: Stok Menipis</option>
                <option value="OUT">Peringatan: Stok Habis (0)</option>
              </select>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                  selectedCategory === "ALL"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Semua Kategori
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                    selectedCategory === c.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-bold text-slate-700">
                  Tidak Ada Data Stok Ditemukan
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Nama Barang & SKU</th>
                      <th className="py-3.5 px-4">Kategori</th>
                      <th className="py-3.5 px-4 text-right">Harga Modal</th>
                      <th className="py-3.5 px-4 text-center">Stok Fisik</th>
                      <th className="py-3.5 px-4 text-right">Nilai Aset</th>
                      <th className="py-3.5 px-4 text-right">Aksi Penyesuaian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p) => {
                      const isLow = p.stock <= p.minimumStock;
                      const assetValue = p.costPrice * p.stock;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-sm">
                              {p.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {p.sku || "Tanpa Barcode"}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg">
                              {p.category.name}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-xs text-slate-600 font-medium">
                            {formatRupiah(p.costPrice)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                                p.stock === 0
                                  ? "bg-red-100 text-red-800"
                                  : isLow
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {isLow && p.stock > 0 && (
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                              )}
                              {p.stock === 0 ? "Habis (0)" : `${p.stock} Unit`}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              Batas Min: {p.minimumStock}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-sm">
                            {formatRupiah(assetValue)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => openAdjustment(p)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                              <span>Sesuaikan Stok</span>
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
        </div>
      )}

      {/* TAB 2: BUKU MUTASI STOK (HISTORY) */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari mutasi barang, alasan, atau nama petugas..."
                className="w-full pl-10 pr-4 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Menampilkan {filteredMovements.length} catatan mutasi
            </span>
          </div>

          {filteredMovements.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">
                Belum Ada Catatan Mutasi Stok
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Waktu</th>
                    <th className="py-3.5 px-4">Nama Barang</th>
                    <th className="py-3.5 px-4">Jenis Mutasi</th>
                    <th className="py-3.5 px-4 text-center">Perubahan</th>
                    <th className="py-3.5 px-4 text-center">Saldo Stok</th>
                    <th className="py-3.5 px-4">Keterangan / Alasan</th>
                    <th className="py-3.5 px-4">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMovements.map((m) => {
                    const isPositive = m.quantity > 0;

                    let typeLabel = "Penjualan Kasir";
                    let typeBadge = "bg-blue-50 text-blue-700 border-blue-200";

                    if (m.type === "RESTOCK") {
                      typeLabel = "Restock Masuk";
                      typeBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    } else if (m.type === "ADJUSTMENT_ADD") {
                      typeLabel = "Koreksi Tambah (+)";
                      typeBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    } else if (m.type === "ADJUSTMENT_REMOVE") {
                      typeLabel = "Stok Keluar / Rusak (-)";
                      typeBadge = "bg-amber-50 text-amber-700 border-amber-200";
                    }

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition text-xs">
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {formatDate(m.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {m.product.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeBadge}`}
                          >
                            {typeLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`font-black text-sm ${
                              isPositive ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {isPositive ? `+${m.quantity}` : m.quantity}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                          {m.stockBefore} &rarr;{" "}
                          <span className="font-bold text-slate-900">
                            {m.stockAfter}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {m.reason || "-"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {m.user.name}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setSelectedProductForAdjust(null);
        }}
        products={products}
        selectedProduct={selectedProductForAdjust}
        onSuccess={() => {
          setFeedback("Penyesuaian stok berhasil disimpan dan dicatat ke kartu stok.");
          router.refresh();
          setTimeout(() => setFeedback(null), 3500);
        }}
      />
    </div>
  );
}
