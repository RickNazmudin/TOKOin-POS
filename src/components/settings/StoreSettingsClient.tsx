"use client";

import { useState } from "react";
import { updateStoreSettings } from "@/app/actions/settings";
import {
  Settings,
  Store,
  MapPin,
  Phone,
  Receipt,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";

interface StoreSettings {
  id: string;
  storeName: string;
  address?: string | null;
  phone?: string | null;
  receiptFooter?: string | null;
}

interface StoreSettingsClientProps {
  initialSettings?: StoreSettings | null;
}

export default function StoreSettingsClient({
  initialSettings,
}: StoreSettingsClientProps) {
  const [storeName, setStoreName] = useState(
    initialSettings?.storeName || "TOKOin Warung Pintar"
  );
  const [address, setAddress] = useState(
    initialSettings?.address || "Jl. Niaga Raya No. 88, UMKM Central"
  );
  const [phone, setPhone] = useState(
    initialSettings?.phone || "0812-3456-7890"
  );
  const [receiptFooter, setReceiptFooter] = useState(
    initialSettings?.receiptFooter || "Terima kasih telah berbelanja di TOKOin! Semoga berkah."
  );

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("storeName", storeName);
    formData.append("address", address);
    formData.append("phone", phone);
    formData.append("receiptFooter", receiptFooter);

    const res = await updateStoreSettings(formData);
    setLoading(false);

    if (res.success) {
      setFeedback(res.message || "Pengaturan toko berhasil diperbarui!");
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setErrorMsg(res.message || "Gagal menyimpan pengaturan.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-600" />
          <span>Pengaturan Identitas Toko & Format Struk</span>
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Atur nama toko, alamat, kontak, dan footer nota yang akan dicetak pada setiap struk transaksi kasir.
        </p>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2 Columns: Settings Form & Live Receipt Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Store Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nama Toko / Usaha Warung <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Store className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Contoh: TOKO MAKMUR JAYA"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Alamat Toko Lengkap
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-3.5 flex items-start pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Pasar Baru No. 12, RT 01/RW 02"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nomor Telepon / WhatsApp Toko
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-3456-7890"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Receipt Footer */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Catatan Footer Struk (Pesan Terima Kasih)
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-3.5 flex items-start pointer-events-none text-slate-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <textarea
                  rows={3}
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="Terima kasih telah berbelanja! Barang yang sudah dibeli tidak dapat ditukar."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading || !storeName.trim()}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan Toko</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Receipt Preview */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Eye className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Pratinjau Tampilan Struk Kasir
              </h2>
            </div>

            {/* Mini Receipt Preview Paper */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-300 font-mono text-[11px] text-slate-700 space-y-2.5 shadow-inner">
              <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-slate-300">
                <p className="font-black text-xs uppercase text-slate-900">
                  {storeName || "NAMA TOKO"}
                </p>
                <p className="text-[10px] text-slate-500">{address || "Alamat Toko"}</p>
                <p className="text-[10px] text-slate-500">Telp: {phone || "-"}</p>
              </div>

              <div className="space-y-0.5 text-[10px] text-slate-500 pb-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>INV-20260920-0001</span>
                  <span>20/09/2026 21:00</span>
                </div>
                <div>Kasir: Budi</div>
              </div>

              <div className="space-y-1 py-1">
                <div className="flex justify-between">
                  <span>Indomie Goreng x2</span>
                  <span>Rp7.000</span>
                </div>
                <div className="flex justify-between">
                  <span>Aqua 600ml x1</span>
                  <span>Rp3.500</span>
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-slate-300 space-y-0.5">
                <div className="flex justify-between font-bold text-xs text-slate-900">
                  <span>TOTAL</span>
                  <span className="text-emerald-700">Rp10.500</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Tunai (Cash)</span>
                  <span>Rp20.000</span>
                </div>
                <div className="flex justify-between text-[10px] font-semibold text-slate-800">
                  <span>Kembalian</span>
                  <span>Rp9.500</span>
                </div>
              </div>

              <div className="text-center pt-2.5 border-t border-dashed border-slate-300 text-[10px] text-slate-500 font-medium">
                <p>{receiptFooter || "Terima kasih telah berbelanja!"}</p>
                <p className="text-slate-400 mt-0.5">--- TOKOin POS ---</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center mt-4">
            Struk akan otomatis dicetak sesuai format di atas saat transaksi kasir selesai.
          </p>
        </div>
      </div>
    </div>
  );
}
