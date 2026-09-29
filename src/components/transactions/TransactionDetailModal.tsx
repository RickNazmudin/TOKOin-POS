"use client";

import { useEffect, useState } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { usePrinter } from "@/context/PrinterContext";
import PrinterSettingsModal from "@/components/pos/PrinterSettingsModal";
import {
  X,
  Printer,
  Receipt,
  Bluetooth,
  Usb,
  Settings,
  RefreshCw,
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
  const { printReceipt, isConnected, printerMode, deviceName, isPrinting } =
    usePrinter();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [printFeedback, setPrintFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || isSettingsOpen) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSettingsOpen, onClose]);

  if (!isOpen || !transaction) return null;

  const handlePrint = async () => {
    if (!transaction) return;
    setPrintFeedback(null);

    const formattedData = {
      invoiceNumber: transaction.invoiceNumber,
      createdAt: transaction.createdAt,
      subtotal: transaction.subtotal,
      discount: transaction.discount,
      total: transaction.total,
      paymentMethod: transaction.paymentMethod,
      paidAmount: transaction.paidAmount,
      changeAmount: transaction.changeAmount,
      cashierName: transaction.cashier.name,
      items: transaction.items.map((it) => ({
        productName: it.productName,
        quantity: it.quantity,
        price: it.price,
        subtotal: it.subtotal,
      })),
    };

    const res = await printReceipt(formattedData, storeSettings);
    setPrintFeedback(res);
    setTimeout(() => setPrintFeedback(null), 4000);
  };

  const storeName = storeSettings?.storeName || "TOKOin Warung Pintar";
  const address = storeSettings?.address || "Jl. Niaga Raya No. 88, UMKM Central";
  const phone = storeSettings?.phone || "0812-3456-7890";
  const footer = storeSettings?.receiptFooter || "Terima kasih telah berbelanja di TOKOin!";

  return (
    <>
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

          {/* Active Printer Mode Bar */}
          <div className="px-6 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                }`}
              />
              {printerMode === "BLUETOOTH" ? (
                <Bluetooth className="w-3.5 h-3.5 text-blue-600" />
              ) : printerMode === "USB" ? (
                <Usb className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Printer className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span className="font-bold">
                {isConnected && deviceName
                  ? deviceName
                  : printerMode === "BLUETOOTH"
                  ? "Bluetooth (Offline)"
                  : printerMode === "USB"
                  ? "USB (Offline)"
                  : "Cetak Browser"}
              </span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Settings className="w-3 h-3" />
              <span>Ganti</span>
            </button>
          </div>

          {/* Print Feedback Banner */}
          {printFeedback && (
            <div
              className={`px-6 py-2 text-xs font-semibold ${
                printFeedback.success
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {printFeedback.message}
            </div>
          )}

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
                  <span className="font-semibold">
                    {transaction.cashier.name} (@{transaction.cashier.username})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-600">
                    {transaction.status}
                  </span>
                </div>
              </div>

              {/* Items List */}
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
                  <span className="text-emerald-700">
                    {formatRupiah(transaction.total)}
                  </span>
                </div>
                {transaction.paymentMethod === "DEBT" ? (
                  <>
                    <div className="flex justify-between text-amber-900 font-bold pt-1">
                      <span>Metode Pembayaran</span>
                      <span className="uppercase">KASBON / HUTANG</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Uang Muka (DP)</span>
                      <span>{formatRupiah(transaction.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between text-amber-900 font-black pt-1 border-t border-dashed border-slate-200">
                      <span>SISA HUTANG NOTA</span>
                      <span>
                        {formatRupiah(
                          (transaction as any).debtRemaining ??
                            transaction.total - transaction.paidAmount
                        )}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
              disabled={isPrinting}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              {isPrinting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : printerMode === "BLUETOOTH" ? (
                <Bluetooth className="w-4 h-4 text-white" />
              ) : printerMode === "USB" ? (
                <Usb className="w-4 h-4 text-white" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>
                {isPrinting
                  ? "Mencetak..."
                  : isConnected
                  ? `Cetak Langsung (${printerMode})`
                  : "Cetak Ulang Struk"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Printer Configuration Submodal */}
      <PrinterSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
