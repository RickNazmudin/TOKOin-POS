"use client";

import { useState } from "react";
import { usePrinter, type PrinterMode } from "@/context/PrinterContext";
import {
  X,
  Printer,
  Bluetooth,
  Usb,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Smartphone,
  Laptop,
  RefreshCw,
  PowerOff,
  Check,
} from "lucide-react";

interface PrinterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrinterSettingsModal({
  isOpen,
  onClose,
}: PrinterSettingsModalProps) {
  const {
    printerMode,
    setPrinterMode,
    isConnected,
    deviceName,
    autoPrint,
    setAutoPrint,
    isConnecting,
    isPrinting,
    error,
    isSupportedBluetooth,
    isSupportedUsb,
    connectBluetooth,
    connectUsb,
    disconnect,
    testPrint,
    clearError,
  } = usePrinter();

  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestPrint = async () => {
    setTestResult(null);
    const result = await testPrint();
    setTestResult(result);
    setTimeout(() => {
      setTestResult(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full my-6 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                Pengaturan Printer Thermal
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Pilih koneksi HP (Bluetooth), PC (USB), atau Dialog Browser
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800 font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Test Print Alert */}
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                testResult.success
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-amber-50 border border-amber-200 text-amber-800"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Connection Status Card */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isConnected
                ? "bg-emerald-50/60 border-emerald-200"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected
                      ? "bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50"
                      : "bg-slate-400"
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Status Printer:
                    </span>
                    <span
                      className={`text-xs font-black ${
                        isConnected ? "text-emerald-700" : "text-slate-600"
                      }`}
                    >
                      {isConnected ? "TERHUBUNG (SIAP)" : "BELUM TERHUBUNG"}
                    </span>
                  </div>
                  {isConnected && deviceName && (
                    <p className="text-sm font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
                      {printerMode === "BLUETOOTH" ? (
                        <Bluetooth className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <Usb className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      <span>{deviceName}</span>
                    </p>
                  )}
                </div>
              </div>

              {isConnected && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestPrint}
                    disabled={isPrinting}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isPrinting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Tes Cetak</span>
                  </button>
                  <button
                    onClick={disconnect}
                    className="p-1.5 bg-slate-200 hover:bg-red-100 hover:text-red-700 text-slate-600 rounded-xl transition cursor-pointer"
                    title="Putuskan Koneksi"
                  >
                    <PowerOff className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mode Selector Cards */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Pilih Metode Koneksi:
            </label>

            {/* 1. Direct Web Bluetooth (HP / Tablet) */}
            <div
              onClick={() => setPrinterMode("BLUETOOTH")}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                printerMode === "BLUETOOTH"
                  ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      printerMode === "BLUETOOTH"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Bluetooth className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        Direct Web Bluetooth
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Smartphone className="w-3 h-3" /> HP & Tablet
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Cetak nirkabel langsung ke printer VSC TM-58V via Bluetooth tanpa aplikasi tambahan & tanpa watermark.
                    </p>
                  </div>
                </div>
                {printerMode === "BLUETOOTH" && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {printerMode === "BLUETOOTH" && (
                <div className="mt-4 pt-3 border-t border-blue-100 flex items-center justify-between">
                  <span className="text-xs text-blue-900 font-medium">
                    {isSupportedBluetooth
                      ? "Web Bluetooth siap digunakan"
                      : "Gunakan Google Chrome Android/PC"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      connectBluetooth();
                    }}
                    disabled={isConnecting || (isConnected && printerMode === "BLUETOOTH")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {isConnecting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Bluetooth className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isConnected && printerMode === "BLUETOOTH"
                        ? "Sudah Terhubung"
                        : "Hubungkan Bluetooth"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. Direct WebUSB (PC / Windows) */}
            <div
              onClick={() => setPrinterMode("USB")}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                printerMode === "USB"
                  ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      printerMode === "USB"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Usb className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        Direct WebUSB
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Laptop className="w-3 h-3" /> Windows / PC
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Cetak kabel USB langsung dari browser Chrome di PC Windows tanpa perlu setting driver Windows yang rumit.
                    </p>
                  </div>
                </div>
                {printerMode === "USB" && (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {printerMode === "USB" && (
                <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between">
                  <span className="text-xs text-emerald-900 font-medium">
                    {isSupportedUsb
                      ? "WebUSB siap digunakan di Chrome/Edge"
                      : "Gunakan Google Chrome di PC"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      connectUsb();
                    }}
                    disabled={isConnecting || (isConnected && printerMode === "USB")}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {isConnecting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Usb className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isConnected && printerMode === "USB"
                        ? "Sudah Terhubung"
                        : "Hubungkan USB"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Browser Print (Dialog System / PDF) */}
            <div
              onClick={() => setPrinterMode("BROWSER")}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                printerMode === "BROWSER"
                  ? "border-slate-800 bg-slate-50 ring-2 ring-slate-800/20"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      printerMode === "BROWSER"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        Dialog Cetak Browser (Standar)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Menggunakan jendela print standar bawaan browser (cocok untuk simpan PDF atau jika memakai driver Windows POS-58).
                    </p>
                  </div>
                </div>
                {printerMode === "BROWSER" && (
                  <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Auto Print Setting Toggle */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Cetak Struk Otomatis (Auto-Print)
              </span>
              <span className="text-[11px] text-slate-500">
                Langsung kirim ke printer setelah pembayaran transaksi selesai
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoPrint}
                onChange={(e) => setAutoPrint(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
