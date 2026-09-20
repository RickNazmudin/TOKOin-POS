"use client";

import { useState } from "react";
import { adjustStock, type StockAdjustmentPayload } from "@/app/actions/inventory";
import {
  X,
  Boxes,
  PlusCircle,
  MinusCircle,
  Save,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku?: string | null;
  stock: number;
  category: { name: string };
}

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  selectedProduct?: Product | null;
  onSuccess: () => void;
}

function StockAdjustmentForm({
  onClose,
  products,
  selectedProduct,
  onSuccess,
}: Omit<StockAdjustmentModalProps, "isOpen">) {
  const [productId, setProductId] = useState(
    selectedProduct?.id || products[0]?.id || ""
  );
  const [type, setType] = useState<"ADD" | "REMOVE">("ADD");
  const [quantity, setQuantity] = useState<number | "">("");
  const [reason, setReason] = useState<StockAdjustmentPayload["reason"]>("Restock");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentProduct = products.find((p) => p.id === productId);
  const currentStock = currentProduct ? currentProduct.stock : 0;
  const numQty = typeof quantity === "number" ? quantity : 0;
  const projectedStock =
    type === "ADD" ? currentStock + numQty : currentStock - numQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || numQty <= 0) return;

    if (type === "REMOVE" && numQty > currentStock) {
      setErrorMsg(
        `Pengurangan (${numQty} unit) melebihi stok yang tersedia (${currentStock} unit).`
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await adjustStock({
      productId,
      type,
      quantity: numQty,
      reason,
      notes: notes.trim() || undefined,
    });

    setLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.message || "Gagal melakukan penyesuaian stok.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full my-6 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Penyesuaian & Mutasi Stok
              </h3>
              <p className="text-xs text-slate-500">
                Catat stok masuk (kulakan) atau stok keluar (rusak/hilang)
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
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 1. Pilih Produk */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Pilih Produk
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stok: {p.stock} Unit) - {p.category.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Tipe Penyesuaian (ADD vs REMOVE) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Jenis Mutasi Stok
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType("ADD");
                  setReason("Restock");
                }}
                className={`py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                  type === "ADD"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>Tambah Stok (Masuk)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType("REMOVE");
                  setReason("Damaged");
                }}
                className={`py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                  type === "REMOVE"
                    ? "border-amber-600 bg-amber-50 text-amber-900 shadow-sm"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <MinusCircle className="w-4 h-4 text-amber-600" />
                <span>Kurangi Stok (Keluar)</span>
              </button>
            </div>
          </div>

          {/* 3. Jumlah & Alasan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Jumlah Unit <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) =>
                  setQuantity(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="Contoh: 10"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Alasan Penyesuaian
              </label>
              <select
                value={reason}
                onChange={(e) =>
                  setReason(e.target.value as StockAdjustmentPayload["reason"])
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {type === "ADD" ? (
                  <>
                    <option value="Restock">Restock (Kulakan / Barang Masuk)</option>
                    <option value="Correction">Koreksi Opname Fisik (+)</option>
                    <option value="Other">Lainnya</option>
                  </>
                ) : (
                  <>
                    <option value="Damaged">Barang Rusak / Kadaluarsa</option>
                    <option value="Lost">Barang Hilang / Selisih Fisik</option>
                    <option value="Correction">Koreksi Opname Fisik (-)</option>
                    <option value="Other">Lainnya</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* 4. Catatan Opsional */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Catatan Keterangan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Dari Supplier Toko Grosir Jaya / Kemasan bocor"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
            />
          </div>

          {/* Stock Projection Preview */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">Stok Saat Ini:</span>
              <span className="font-extrabold text-slate-800 text-sm">
                {currentStock} Unit
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <ArrowRight className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="text-right">
              <span className="text-slate-500 block">Stok Baru Nanti:</span>
              <span
                className={`font-black text-sm ${
                  projectedStock < 0
                    ? "text-red-600"
                    : type === "ADD"
                    ? "text-emerald-700"
                    : "text-amber-700"
                }`}
              >
                {projectedStock} Unit
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || numQty <= 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Stok</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StockAdjustmentModal(props: StockAdjustmentModalProps) {
  if (!props.isOpen) return null;
  return (
    <StockAdjustmentForm
      key={props.selectedProduct?.id || "adjustment"}
      {...props}
    />
  );
}
