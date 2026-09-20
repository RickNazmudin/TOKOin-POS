"use client";

import { useEffect } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Printer, CheckCircle2, ShoppingCart, X } from "lucide-react";

interface ReceiptItem {
  id?: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface TransactionData {
  id: string;
  invoiceNumber: string;
  createdAt: string | Date;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paidAmount: number;
  changeAmount: number;
  cashier: {
    name: string;
  };
  items: ReceiptItem[];
}

interface StoreSettingsData {
  storeName?: string;
  address?: string | null;
  phone?: string | null;
  receiptFooter?: string | null;
}

interface ReceiptModalProps {
  isOpen: boolean;
  transaction: TransactionData | null;
  storeSettings?: StoreSettingsData | null;
  autoPrint?: boolean;
  onNewTransaction: () => void;
}

export default function ReceiptModal({
  isOpen,
  transaction,
  storeSettings,
  autoPrint = false,
  onNewTransaction,
}: ReceiptModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape" || (e.key === "Enter" && !e.ctrlKey)) {
        onNewTransaction();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onNewTransaction]);

  // Auto-trigger print dialog if requested
  useEffect(() => {
    if (isOpen && autoPrint && transaction) {
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, transaction]);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const storeName = storeSettings?.storeName || "TOKOin Warung";
  const address = storeSettings?.address || "Jl. Niaga Raya No. 88, UMKM Central";
  const phone = storeSettings?.phone || "0812-3456-7890";
  const footer = storeSettings?.receiptFooter || "Terima kasih telah berbelanja di TOKOin!";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full my-6 overflow-hidden">
        {/* Success Alert Header */}
        <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                Transaksi Berhasil Disimpan!
              </h3>
              <p className="text-emerald-100 text-xs">
                Stok barang telah otomatis diperbarui
              </p>
            </div>
          </div>
          <button
            onClick={onNewTransaction}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Change Banner if Cash */}
        {transaction.paymentMethod === "CASH" && (
          <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
              Uang Kembalian Kasir:
            </span>
            <span className="text-xl font-black text-emerald-700">
              {formatRupiah(transaction.changeAmount)}
            </span>
          </div>
        )}

        {/* Receipt Body (Printable element) */}
        <div className="p-6 bg-slate-50/50">
          <div
            id="receipt-printable"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm font-mono text-xs text-slate-800 space-y-3"
          >
            {/* Store Header */}
            <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-slate-300">
              <h4 className="font-black text-sm uppercase tracking-wide text-slate-900">
                {storeName}
              </h4>
              <p className="text-[11px] text-slate-500">{address}</p>
              <p className="text-[11px] text-slate-500">Telp: {phone}</p>
            </div>

            {/* Meta Info */}
            <div className="text-[11px] space-y-0.5 pb-2 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Nota:</span>
                <span className="font-bold text-slate-900">{transaction.invoiceNumber}</span>
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

            {/* Items List */}
            <div className="space-y-1.5 py-1">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
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

            {/* Totals & Calculations */}
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
                <span className="text-emerald-700">{formatRupiah(transaction.total)}</span>
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

            {/* Footer Message */}
            <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
              <p className="font-semibold">{footer}</p>
              <p className="mt-0.5 text-slate-400">--- TOKOin POS UMKM ---</p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk (Print)</span>
          </button>
          <button
            onClick={onNewTransaction}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>+ Transaksi Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
}
