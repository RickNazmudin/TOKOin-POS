"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import { toggleProductStatus, deleteProduct } from "@/app/actions/products";
import ProductModal from "./ProductModal";
import CategoryModal from "./CategoryModal";
import {
  Search,
  Plus,
  Tag,
  Barcode,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
  CheckCircle2,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  status: string;
  _count?: { products: number };
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
  _count?: { transactionItems: number };
}

interface ProductListClientProps {
  initialProducts: Product[];
  categories: Category[];
}

export default function ProductListClient({
  initialProducts,
  categories,
}: ProductListClientProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Notification message
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filter products locally for instantaneous response
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

      const matchesCat =
        selectedCategory === "ALL" || p.categoryId === selectedCategory;

      const matchesStatus =
        selectedStatus === "ALL" || p.status === selectedStatus;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [initialProducts, search, selectedCategory, selectedStatus]);

  const handleToggleStatus = async (product: Product) => {
    const res = await toggleProductStatus(product.id, product.status);
    if (res.success) {
      setFeedback(res.message || "Status diubah.");
      router.refresh();
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleDelete = async (product: Product) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus atau menonaktifkan produk "${product.name}"?`
      )
    )
      return;

    const res = await deleteProduct(product.id);
    if (res.success) {
      setFeedback(res.message || "Produk berhasil dihapus.");
      router.refresh();
      setTimeout(() => setFeedback(null), 4000);
    } else {
      alert(res.message || "Gagal menghapus produk.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>Katalog & Manajemen Produk</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Kelola data barang dagangan, harga modal, harga jual, barcode, dan kategori.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer border border-slate-200"
          >
            <Tag className="w-4 h-4 text-slate-600" />
            <span>Kelola Kategori ({categories.length})</span>
          </button>

          <button
            onClick={() => {
              setProductToEdit(null);
              setIsProductModalOpen(true);
            }}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama produk atau scan barcode / SKU..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">Semua Status (Aktif & Nonaktif)</option>
            <option value="ACTIVE">Hanya Produk Aktif</option>
            <option value="INACTIVE">Hanya Produk Nonaktif</option>
          </select>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Kategori:
          </span>
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua ({initialProducts.length})
          </button>
          {categories.map((cat) => {
            const count = initialProducts.filter((p) => p.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Table List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">
              Tidak Ada Produk Ditemukan
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-5">
              {search || selectedCategory !== "ALL" || selectedStatus !== "ALL"
                ? "Tidak ada produk yang cocok dengan kriteria filter pencarian."
                : "Belum ada produk yang didaftarkan pada warung/toko Anda."}
            </p>
            <button
              onClick={() => {
                setProductToEdit(null);
                setIsProductModalOpen(true);
              }}
              className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Produk Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Nama Produk & Barcode</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4 text-right">Harga Modal</th>
                  <th className="py-3.5 px-4 text-right">Harga Jual</th>
                  <th className="py-3.5 px-4 text-center">Stok Fisik</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const profit = p.sellingPrice - p.costPrice;
                  const isLowStock = p.stock <= p.minimumStock;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition ${
                        p.status === "INACTIVE" ? "opacity-60 bg-slate-50/40" : ""
                      }`}
                    >
                      {/* Product Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {p.name}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mt-0.5">
                          <Barcode className="w-3.5 h-3.5" />
                          <span>{p.sku || "Tanpa Barcode"}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                          {p.category.name}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-500 text-xs">
                        {formatRupiah(p.costPrice)}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {formatRupiah(p.sellingPrice)}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                          Laba +{formatRupiah(profit)}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            p.stock === 0
                              ? "bg-red-100 text-red-800"
                              : isLowStock
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isLowStock && p.stock > 0 && (
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                          )}
                          {p.stock === 0 ? "Habis (0)" : `${p.stock} Unit`}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          Min: {p.minimumStock}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          title="Klik untuk mengubah status"
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition ${
                            p.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-300"
                          }`}
                        >
                          {p.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setProductToEdit(p);
                              setIsProductModalOpen(true);
                            }}
                            className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="Edit Data Produk"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        categories={categories}
        productToEdit={productToEdit}
        onSuccess={() => {
          setFeedback(
            productToEdit
              ? "Data produk berhasil diperbarui!"
              : "Produk baru berhasil ditambahkan!"
          );
          router.refresh();
          setTimeout(() => setFeedback(null), 3500);
        }}
      />

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onRefresh={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
