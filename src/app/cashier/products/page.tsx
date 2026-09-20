import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";
import {
  Package,
  Barcode,
  ShoppingCart,
} from "lucide-react";

export default async function CashierProductsPage() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="w-6 h-6 text-emerald-600" />
              <span>Katalog Produk & Harga (Kasir)</span>
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Cek harga jual dan ketersediaan stok fisik barang toko terkini.
            </p>
          </div>
          <Link
            href="/pos"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Buka Kasir (POS)</span>
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                    {p.category.name}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      p.stock === 0
                        ? "bg-red-100 text-red-800"
                        : p.stock <= p.minimumStock
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {p.stock === 0 ? "Stok Habis" : `Stok: ${p.stock}`}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {p.name}
                </h3>

                {p.sku && (
                  <div className="flex items-center gap-1 text-xs text-slate-400 font-mono mt-1">
                    <Barcode className="w-3.5 h-3.5" />
                    <span>{p.sku}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Harga Jual
                  </span>
                  <span className="text-lg font-black text-emerald-600">
                    {formatRupiah(p.sellingPrice)}
                  </span>
                </div>

                <Link
                  href="/pos"
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition"
                >
                  Jual di POS &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
