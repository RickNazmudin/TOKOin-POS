"use client";

import { useState } from "react";
import { createProduct, updateProduct } from "@/app/actions/products";
import { formatRupiah } from "@/lib/utils";
import {
  X,
  Package,
  Barcode,
  Sparkles,
  Save,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  categoryId: string;
  name: string;
  sku?: string | null;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minimumStock: number;
  status: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  productToEdit?: Product | null;
  onSuccess: () => void;
}

function ProductModalForm({
  onClose,
  categories,
  productToEdit,
  onSuccess,
}: Omit<ProductModalProps, "isOpen">) {
  const isEdit = !!productToEdit;

  const [name, setName] = useState(productToEdit?.name || "");
  const [categoryId, setCategoryId] = useState(
    productToEdit?.categoryId || categories[0]?.id || ""
  );
  const [sku, setSku] = useState(productToEdit?.sku || "");
  const [costPrice, setCostPrice] = useState<number | "">(
    productToEdit ? productToEdit.costPrice : ""
  );
  const [sellingPrice, setSellingPrice] = useState<number | "">(
    productToEdit ? productToEdit.sellingPrice : ""
  );
  const [stock, setStock] = useState<number | "">(
    productToEdit ? productToEdit.stock : 0
  );
  const [minimumStock, setMinimumStock] = useState<number>(
    productToEdit ? productToEdit.minimumStock : 5
  );
  const [status, setStatus] = useState(productToEdit?.status || "ACTIVE");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generate random 13-digit EAN barcode
  const generateBarcode = () => {
    const randomSuffix = Math.floor(1000000000 + Math.random() * 9000000000);
    setSku(`899${randomSuffix}`);
  };

  const numCost = typeof costPrice === "number" ? costPrice : 0;
  const numSell = typeof sellingPrice === "number" ? sellingPrice : 0;
  const profit = numSell - numCost;
  const marginPercent = numSell > 0 ? ((profit / numSell) * 100).toFixed(1) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("categoryId", categoryId);
    formData.append("sku", sku);
    formData.append("costPrice", String(costPrice || 0));
    formData.append("sellingPrice", String(sellingPrice || 0));
    formData.append("minimumStock", String(minimumStock));
    formData.append("status", status);

    if (!isEdit) {
      formData.append("stock", String(stock || 0));
      const res = await createProduct(formData);
      setLoading(false);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.message || "Gagal menyimpan produk.");
      }
    } else {
      const res = await updateProduct(productToEdit.id, formData);
      setLoading(false);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.message || "Gagal memperbarui produk.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEdit ? "Ubah Data Produk" : "Tambah Produk Baru"}
              </h3>
              <p className="text-xs text-slate-500">
                Lengkapi informasi barang dagangan warung/toko Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 1. Nama Produk */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kopi Kapal Api Spesial Mix 24g"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
            />
          </div>

          {/* 2. Kategori & SKU / Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="" disabled>
                  -- Pilih Kategori --
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Barcode / SKU
                </label>
                <button
                  type="button"
                  onClick={generateBarcode}
                  className="text-[11px] text-emerald-600 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Buat Barcode</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Barcode className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Scan barcode / ketik kode"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* 3. Harga Modal & Harga Jual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Harga Modal / Beli (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={costPrice}
                onChange={(e) =>
                  setCostPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Harga Jual ke Pelanggan (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="100"
                required
                value={sellingPrice}
                onChange={(e) =>
                  setSellingPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="Contoh: 3500"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Profit Preview Banner */}
          {numSell > 0 && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Estimasi Keuntungan Bersih:</span>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-emerald-700 text-sm">
                  +{formatRupiah(profit)}
                </span>
                <span className="text-[11px] text-emerald-600 ml-1.5 font-bold">
                  ({marginPercent}%)
                </span>
              </div>
            </div>
          )}

          {/* 4. Stok Awal (Create only) & Batas Minimum Stok */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!isEdit ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Stok Awal Fisik
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) =>
                    setStock(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Stok Saat Ini (Fisik)
                </label>
                <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-700">
                  {stock} Unit
                  <span className="text-[10px] text-slate-400 font-normal ml-2">
                    (Ubah di menu Stok & Mutasi)
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Batas Minimum Stok (Alert)
              </label>
              <input
                type="number"
                min="0"
                value={minimumStock}
                onChange={(e) => setMinimumStock(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Sistem akan memberi peringatan jika stok &le; angka ini.
              </p>
            </div>
          </div>

          {/* 5. Status Produk */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Status Penjualan
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={status === "ACTIVE"}
                  onChange={() => setStatus("ACTIVE")}
                  className="accent-emerald-600"
                />
                <span className="font-semibold text-emerald-700">
                  Aktif (Dapat Dijual di Kasir)
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="INACTIVE"
                  checked={status === "INACTIVE"}
                  onChange={() => setStatus("INACTIVE")}
                  className="accent-slate-600"
                />
                <span className="font-medium text-slate-500">
                  Nonaktif (Sembunyikan)
                </span>
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? "Simpan Perubahan" : "Simpan Produk"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProductModal(props: ProductModalProps) {
  if (!props.isOpen) return null;
  return <ProductModalForm key={props.productToEdit?.id || "new"} {...props} />;
}
