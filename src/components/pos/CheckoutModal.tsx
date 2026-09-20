"use client";

import { useState, useEffect } from "react";
import { formatRupiah } from "@/lib/utils";
import {
  X,
  Banknote,
  QrCode,
  Check,
  Printer,
} from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  itemCount: number;
  onConfirmPayment: (
    paymentMethod: "CASH" | "QRIS",
    paidAmount: number,
    shouldPrint: boolean
  ) => void;
  isProcessing: boolean;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  total,
  itemCount,
  onConfirmPayment,
  isProcessing,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  const [customPaidAmount, setCustomPaidAmount] = useState<number | null>(null);
  const [shouldPrint, setShouldPrint] = useState<boolean>(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const paidAmount = customPaidAmount ?? total;
  const change = paymentMethod === "CASH" ? paidAmount - total : 0;
  const isUnderpaid = paymentMethod === "CASH" && paidAmount < total;

  // Preset cash shortcuts
  const cashPresets = [
    { label: "Uang Pas", value: total },
    { label: "Rp10.000", value: 10000 },
    { label: "Rp20.000", value: 20000 },
    { label: "Rp50.000", value: 50000 },
    { label: "Rp100.000", value: 100000 },
    { label: "Rp200.000", value: 200000 },
  ].filter((p) => p.value >= total || p.label === "Uang Pas");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnderpaid) return;
    onConfirmPayment(
      paymentMethod,
      paymentMethod === "QRIS" ? total : paidAmount,
      shouldPrint
    );
  };

  const handlePayWithSpecificPrint = (printChoice: boolean) => {
    if (isUnderpaid) return;
    onConfirmPayment(
      paymentMethod,
      paymentMethod === "QRIS" ? total : paidAmount,
      printChoice
    );
  };

  const handleClose = () => {
    setCustomPaidAmount(null);
    setPaymentMethod("CASH");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full my-6 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Pembayaran Kasir</h3>
            <p className="text-xs text-slate-500">
              Total belanja {itemCount} item barang
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Big Total Banner */}
          <div className="bg-slate-900 rounded-2xl p-4 text-white text-center shadow-lg relative overflow-hidden">
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-400">
              TOTAL TAGIHAN BELANJA
            </span>
            <div className="text-3xl sm:text-4xl font-black mt-1 text-white tracking-tight">
              {formatRupiah(total)}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Pilih Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("CASH");
                  setCustomPaidAmount(total);
                }}
                className={`py-3 px-4 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-bold text-sm transition cursor-pointer ${
                  paymentMethod === "CASH"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span>Tunai (Cash)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("QRIS")}
                className={`py-3 px-4 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-bold text-sm transition cursor-pointer ${
                  paymentMethod === "QRIS"
                    ? "border-blue-600 bg-blue-50 text-blue-800 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <QrCode className="w-5 h-5 text-blue-600" />
                <span>QRIS Nontunai</span>
              </button>
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === "CASH" ? (
            <div className="space-y-3">
              {/* Paid Amount Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Uang Diterima dari Pembeli (Rp)
                </label>
                <input
                  type="number"
                  min={total}
                  step="500"
                  required
                  value={paidAmount || ""}
                  onChange={(e) => setCustomPaidAmount(Number(e.target.value))}
                  autoFocus
                  placeholder="Masukkan jumlah uang"
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xl font-black text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
              </div>

              {/* Quick Cash Presets */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                  Pilihan Cepat Uang Tunai:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {cashPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCustomPaidAmount(preset.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        paidAmount === preset.value
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Change / Underpaid Feedback */}
              <div
                className={`p-3 rounded-xl border ${
                  isUnderpaid
                    ? "bg-red-50 border-red-200 text-red-800"
                    : "bg-emerald-50 border-emerald-200 text-emerald-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {isUnderpaid ? "Uang Masih Kurang:" : "Uang Kembalian:"}
                  </span>
                  <span className="text-xl font-black">
                    {formatRupiah(Math.abs(change))}
                  </span>
                </div>
                {isUnderpaid && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium">
                    Jumlah uang yang diterima tidak boleh kurang dari total tagihan.
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* QRIS Guidance */
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sm text-blue-800">
                <QrCode className="w-5 h-5 text-blue-600" />
                <span>Pencatatan Transaksi QRIS</span>
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">
                Tunjukkan barcode QRIS toko Anda kepada pembeli. Setelah pembeli menunjukkan bukti pembayaran berhasil di handphone, klik tombol di bawah untuk menyelesaikan transaksi.
              </p>
            </div>
          )}

          {/* Print Struk Option Toggle */}
          <div
            onClick={() => setShouldPrint(!shouldPrint)}
            className={`p-3 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition select-none ${
              shouldPrint
                ? "border-emerald-500 bg-emerald-50/50"
                : "border-slate-200 bg-slate-50 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl transition ${
                  shouldPrint
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <p
                  className={`text-xs font-bold ${
                    shouldPrint ? "text-emerald-950" : "text-slate-700"
                  }`}
                >
                  {shouldPrint ? "Cetak Struk Belanja (Aktif)" : "Tanpa Cetak Struk (Nonaktif)"}
                </p>
                <p className="text-[11px] text-slate-500">
                  {shouldPrint
                    ? "Dialog cetak struk nota akan otomatis dibuka"
                    : "Selesai transaksi lebih cepat tanpa dialog print"}
                </p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                shouldPrint
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "border-slate-300 bg-white"
              }`}
            >
              {shouldPrint && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Kembali
            </button>

            {/* Quick alternative button */}
            <button
              type="button"
              onClick={() => handlePayWithSpecificPrint(!shouldPrint)}
              disabled={isProcessing || isUnderpaid}
              className="w-full sm:w-auto px-4 py-3 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {shouldPrint ? (
                <span>Bayar Tanpa Cetak</span>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5 text-slate-700" />
                  <span>Bayar & Cetak</span>
                </>
              )}
            </button>

            {/* Main Submit Button */}
            <button
              type="submit"
              disabled={isProcessing || isUnderpaid}
              className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-black rounded-xl transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  {shouldPrint ? (
                    <Printer className="w-4 h-4" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>
                    {shouldPrint
                      ? "Bayar & Cetak Struk (Enter)"
                      : "Selesaikan Pembayaran (Enter)"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

