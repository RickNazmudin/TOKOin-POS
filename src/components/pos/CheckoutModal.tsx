"use client";

import { useState, useEffect } from "react";
import { formatRupiah } from "@/lib/utils";
import {
  X,
  Banknote,
  QrCode,
  Check,
  Printer,
  BookOpen,
  UserPlus,
  Search,
  AlertCircle,
} from "lucide-react";

export interface CustomerOption {
  id: string;
  name: string;
  phone?: string | null;
  totalDebt: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  itemCount: number;
  customers?: CustomerOption[];
  onConfirmPayment: (
    paymentMethod: "CASH" | "QRIS" | "DEBT",
    paidAmount: number,
    shouldPrint: boolean,
    debtDetails?: {
      customerId?: string | null;
      newCustomerName?: string | null;
      newCustomerPhone?: string | null;
    }
  ) => void;
  isProcessing: boolean;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  total,
  itemCount,
  customers = [],
  onConfirmPayment,
  isProcessing,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS" | "DEBT">("CASH");
  const [customPaidAmount, setCustomPaidAmount] = useState<number | null>(null);
  const [shouldPrint, setShouldPrint] = useState<boolean>(true);

  // Debt Customer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [isNewCustomerMode, setIsNewCustomerMode] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>("");
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>("");
  const [debtDownPayment, setDebtDownPayment] = useState<number>(0);

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

  // Sisa hutang jika metode DEBT
  const debtRemaining = Math.max(0, total - debtDownPayment);

  // Filter customers for dropdown
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(customerSearch))
  );

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

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
    if (paymentMethod === "CASH" && isUnderpaid) return;

    if (paymentMethod === "DEBT") {
      if (!isNewCustomerMode && !selectedCustomerId) return;
      if (isNewCustomerMode && (!newCustomerName || newCustomerName.trim() === "")) return;
    }

    const finalPaid =
      paymentMethod === "QRIS"
        ? total
        : paymentMethod === "DEBT"
        ? debtDownPayment
        : paidAmount;

    onConfirmPayment(paymentMethod, finalPaid, shouldPrint, {
      customerId: !isNewCustomerMode ? selectedCustomerId : null,
      newCustomerName: isNewCustomerMode ? newCustomerName : null,
      newCustomerPhone: isNewCustomerMode ? newCustomerPhone : null,
    });
  };

  const handleClose = () => {
    setCustomPaidAmount(null);
    setPaymentMethod("CASH");
    setSelectedCustomerId("");
    setIsNewCustomerMode(false);
    setNewCustomerName("");
    setNewCustomerPhone("");
    setDebtDownPayment(0);
    onClose();
  };

  const isDebtSubmitDisabled =
    paymentMethod === "DEBT" &&
    ((!isNewCustomerMode && !selectedCustomerId) ||
      (isNewCustomerMode && (!newCustomerName || newCustomerName.trim() === "")));

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

          {/* Payment Method Selector (3 Options: Cash, QRIS, Debt) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Pilih Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {/* 1. Cash */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("CASH");
                  setCustomPaidAmount(total);
                }}
                className={`py-3 px-2 sm:px-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 font-bold text-xs sm:text-sm transition cursor-pointer ${
                  paymentMethod === "CASH"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span>Tunai (Cash)</span>
              </button>

              {/* 2. QRIS */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("QRIS");
                }}
                className={`py-3 px-2 sm:px-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 font-bold text-xs sm:text-sm transition cursor-pointer ${
                  paymentMethod === "QRIS"
                    ? "border-blue-600 bg-blue-50 text-blue-800 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <QrCode className="w-5 h-5 text-blue-600" />
                <span>QRIS</span>
              </button>

              {/* 3. Kasbon / Debt */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("DEBT");
                  setDebtDownPayment(0);
                }}
                className={`py-3 px-2 sm:px-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 font-bold text-xs sm:text-sm transition cursor-pointer ${
                  paymentMethod === "DEBT"
                    ? "border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-1 ring-amber-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <BookOpen className="w-5 h-5 text-amber-600" />
                <span>Kasbon / Bon</span>
              </button>
            </div>
          </div>

          {/* CASH DETAILS */}
          {paymentMethod === "CASH" && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nominal Uang Diterima (Rp)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-slate-400 text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={customPaidAmount ?? total}
                    onChange={(e) => {
                      const val = e.target.value === "" ? 0 : Number(e.target.value);
                      setCustomPaidAmount(val);
                    }}
                    min={0}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {cashPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setCustomPaidAmount(preset.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      paidAmount === preset.value
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Change / Underpaid Notice */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  {isUnderpaid ? "Uang Kurang:" : "Kembalian Kasir:"}
                </span>
                <span
                  className={`text-xl font-black ${
                    isUnderpaid ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {isUnderpaid
                    ? `- ${formatRupiah(total - paidAmount)}`
                    : formatRupiah(change)}
                </span>
              </div>
            </div>
          )}

          {/* QRIS DETAILS */}
          {paymentMethod === "QRIS" && (
            <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-600/20">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-blue-950">
                  Pembayaran Digital QRIS
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Arahkan pelanggan scan kode QR Toko sebesar{" "}
                  <strong className="font-black text-blue-950">
                    {formatRupiah(total)}
                  </strong>
                </p>
              </div>
            </div>
          )}

          {/* DEBT / KASBON DETAILS */}
          {paymentMethod === "DEBT" && (
            <div className="space-y-3.5 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  Identitas Pelanggan Kasbon:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewCustomerMode(!isNewCustomerMode);
                    setSelectedCustomerId("");
                  }}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isNewCustomerMode ? "Pilih Langganan" : "+ Pelanggan Baru"}</span>
                </button>
              </div>

              {/* Existing Customer Dropdown */}
              {!isNewCustomerMode ? (
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Cari nama langganan..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <Search className="w-4 h-4 text-amber-600 absolute left-3 top-2.5 pointer-events-none" />
                  </div>

                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Pilih Nama Pelanggan --</option>
                    {filteredCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""} - Kasbon:{" "}
                        {formatRupiah(c.totalDebt)}
                      </option>
                    ))}
                  </select>

                  {selectedCustomer && selectedCustomer.totalDebt > 0 && (
                    <div className="p-2.5 bg-amber-100/70 rounded-xl text-amber-950 text-xs flex items-center justify-between">
                      <span>Total Kasbon Belum Lunas Sebelumnya:</span>
                      <strong className="font-extrabold text-amber-900">
                        {formatRupiah(selectedCustomer.totalDebt)}
                      </strong>
                    </div>
                  )}
                </div>
              ) : (
                /* Add New Customer Inputs */
                <div className="space-y-2.5 bg-white p-3 rounded-xl border border-amber-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nama Pelanggan / Panggilan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Contoh: Pak Budi RT 03"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      No. WhatsApp (Opsional, untuk pengingat)
                    </label>
                    <input
                      type="text"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Down Payment (DP) Input */}
              <div className="pt-2 border-t border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Uang Muka / DP (Jika Ada):
                  </label>
                  <span className="text-[11px] text-slate-500">
                    (Ketik 0 jika kasbon penuh)
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={debtDownPayment}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(Number(e.target.value) || 0, total));
                      setDebtDownPayment(val);
                    }}
                    min={0}
                    max={total}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Debt Summary Banner */}
              <div className="p-3 bg-amber-500/15 rounded-xl border border-amber-400/40 flex items-center justify-between text-xs">
                <span className="font-bold text-amber-950 uppercase tracking-wide">
                  Sisa Hutang Nota Ini:
                </span>
                <span className="text-base font-black text-amber-900">
                  {formatRupiah(debtRemaining)}
                </span>
              </div>
            </div>
          )}

          {/* Checkbox Auto Print Receipt */}
          <div className="flex items-center justify-between py-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={shouldPrint}
                onChange={(e) => setShouldPrint(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span>Cetak Struk Transaksi</span>
            </label>
            <Printer className="w-4 h-4 text-slate-400" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-2xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={
                isProcessing ||
                (paymentMethod === "CASH" && isUnderpaid) ||
                isDebtSubmitDisabled
              }
              className={`flex-2 py-3.5 px-4 text-white text-sm font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                paymentMethod === "DEBT"
                  ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/30"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
              }`}
            >
              {isProcessing ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>
                    {paymentMethod === "DEBT"
                      ? "Catat Kasbon"
                      : "Konfirmasi & Selesai"}
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
