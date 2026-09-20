"use client";

import { useEffect } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { X, Printer, Receipt } from "lucide-react";

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

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  storeSettings?: {
    storeName?: string;
    address?: string | null;
    phone?: string | null;
    receiptFooter?: string | null;
  } | null;
}

export default function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
  storeSettings,
}: TransactionDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const storeName = storeSettings?.storeName || "TOKOin Warung Pintar";
  const address = storeSettings?.address || "Jl. Niaga Raya No. 88, UMKM Central";
  const phone = storeSettings?.phone || "0812-3456-7890";
  const footer = storeSettings?.receiptFooter || "Terima kasih telah berbelanja di TOKOin!";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full my-6 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Rincian Nota Transaksi
              </h3>
              <p className="text-xs font-mono text-emerald-700 font-bold">
                {transaction.invoiceNumber}
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

        {/* Printable Receipt Area */}
        <div className="p-6 bg-slate-50/50">
          <div
            id="receipt-printable"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm font-mono text-xs text-slate-800 space-y-3"
          >
            {/* Store Header */}
            <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-slate-300">
              <h4 className="font-black text-sm uppercase text-slate-900">
                {storeName}
              </h4>
              <p className="text-[11px] text-slate-500">{address}</p>
              <p className="text-[11px] text-slate-500">Telp: {phone}</p>
            </div>

            {/* Meta Info */}
            <div className="text-[11px] space-y-0.5 pb-2 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Nota:</span>
                <span className="font-bold text-slate-900">
                  {transaction.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu:</span>
                <span>{formatDate(transaction.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir:</span>
                <span className="font-semibold">{transaction.cashier.name}</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-1.5 py-1">
              {transaction.items.map((item) => (
                <div key={item.id} className="flex justify-between text-[11px]">
                  <div className="overflow-hidden pr-2">
                    <p className="font-semibold text-slate-900 truncate">
                      {item.productName}
                    </p>
                    <p className="text-slate-500 text-[10px]">
                      {item.quantity} x {formatRupiah(item.price)}
                    </p>
                  </div>
                  <div className="font-bold text-slate-900 shrink-0 text-right">
                    {formatRupiah(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatRupiah(transaction.subtotal)}</span>
              </div>
              {transaction.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Diskon Nota</span>
                  <span>-{formatRupiah(transaction.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL AKHIR</span>
                <span className="text-emerald-700">
                  {formatRupiah(transaction.total)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1">
                <span>Metode Pembayaran</span>
                <span className="font-bold uppercase">
                  {transaction.paymentMethod === "CASH" ? "Tunai (Cash)" : "QRIS"}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Diterima / Bayar</span>
                <span>{formatRupiah(transaction.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold">
                <span>Kembalian</span>
                <span>{formatRupiah(transaction.changeAmount)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
              <p className="font-semibold">{footer}</p>
              <p className="mt-0.5 text-slate-400">--- TOKOin POS UMKM ---</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Ulang Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
}
