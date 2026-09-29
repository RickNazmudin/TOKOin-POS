"use client";

import { usePrinter } from "@/context/PrinterContext";
import { Bluetooth, Usb, Printer, Settings } from "lucide-react";

interface PrinterStatusBadgeProps {
  onOpenSettings: () => void;
  className?: string;
}

export default function PrinterStatusBadge({
  onOpenSettings,
  className = "",
}: PrinterStatusBadgeProps) {
  const { isConnected, printerMode, deviceName } = usePrinter();

  return (
    <button
      onClick={onOpenSettings}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-sm cursor-pointer ${
        isConnected
          ? printerMode === "BLUETOOTH"
            ? "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
            : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
      } ${className}`}
      title="Klik untuk mengubah pengaturan printer"
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected
              ? "bg-emerald-500 animate-pulse"
              : "bg-slate-400"
          }`}
        />
        {printerMode === "BLUETOOTH" ? (
          <Bluetooth className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        ) : printerMode === "USB" ? (
          <Usb className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        ) : (
          <Printer className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        )}
      </div>

      <span className="truncate max-w-[120px] sm:max-w-[150px]">
        {isConnected && deviceName
          ? deviceName
          : printerMode === "BLUETOOTH"
          ? "BT Thermal (Offline)"
          : printerMode === "USB"
          ? "USB Thermal (Offline)"
          : "Cetak Browser"}
      </span>

      <Settings className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
    </button>
  );
}
