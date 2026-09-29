"use client";

import { useState } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  recordDebtPayment,
  type CustomerInput,
} from "@/app/actions/customers";
import { usePrinter } from "@/context/PrinterContext";
import { generateDebtPaymentReceiptEscPos } from "@/lib/escpos";
import {
  BookOpen,
  Users,
  CreditCard,
  Search,
  Plus,
  Phone,
  MessageCircle,
  Receipt,
  CheckCircle2,
  AlertCircle,
  History,
  DollarSign,
  ChevronRight,
  Printer,
  Calendar,
  User,
  X,
  Edit2,
  Trash2,
  ArrowDownLeft,
} from "lucide-react";

interface DebtorCustomer {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  totalDebt: number;
  transactions: {
    id: string;
    invoiceNumber: string;
    createdAt: string | Date;
    total: number;
    paidAmount: number;
    debtRemaining: number;
    status: string;
    cashier: { name: string };
    items: {
      id: string;
      productName: string;
      quantity: number;
      price: number;
      subtotal: number;
    }[];
  }[];
}

interface DebtTransaction {
  id: string;
  invoiceNumber: string;
  createdAt: string | Date;
  total: number;
  paidAmount: number;
  debtRemaining: number;
  status: string;
  customer?: { id: string; name: string; phone?: string | null } | null;
  customerName?: string | null;
  cashier: { name: string; username: string };
  items: {
    id: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
}

interface RecentPayment {
  id: string;
  amount: number;
  paymentMethod: string;
  notes?: string | null;
  createdAt: string | Date;
  customer: { id: string; name: string; phone?: string | null };
  cashier: { name: string; username: string };
  transaction?: { invoiceNumber: string; total: number } | null;
}

interface DebtClientProps {
  initialDebtors: DebtorCustomer[];
  initialDebtTransactions: DebtTransaction[];
  initialRecentPayments: RecentPayment[];
  initialAllCustomers: any[];
  stats: {
    totalOutstandingDebt: number;
    totalDebtorCount: number;
    totalPaymentsReceived: number;
  };
  storeSettings?: {
    storeName?: string;
    address?: string | null;
    phone?: string | null;
  } | null;
  isAdmin?: boolean;
}

export default function DebtClient({
  initialDebtors,
  initialDebtTransactions,
  initialRecentPayments,
  initialAllCustomers,
  stats,
  storeSettings,
  isAdmin = true,
}: DebtClientProps) {
  const { isConnected, printerMode } = usePrinter();

  const [activeTab, setActiveTab] = useState<"DEBTORS" | "TRANSACTIONS" | "PAYMENTS" | "CUSTOMERS">("DEBTORS");
  const [search, setSearch] = useState("");

  // Modals state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<DebtorCustomer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  // Customer Create/Edit Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [customerFormData, setCustomerFormData] = useState<CustomerInput>({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);

  // Detail Modal State
  const [detailCustomer, setDetailCustomer] = useState<DebtorCustomer | null>(null);

  // Alert Feedback
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Open Payment Modal
  const handleOpenPayModal = (debtor: DebtorCustomer) => {
    setSelectedDebtor(debtor);
    setPaymentAmount(debtor.totalDebt);
    setPaymentMethod("CASH");
    setPaymentNotes("");
    setIsPayModalOpen(true);
  };

  // Submit Debt Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtor) return;

    if (paymentAmount <= 0) {
      showAlert("error", "Nominal pembayaran harus lebih besar dari Rp 0.");
      return;
    }

    setIsSubmittingPay(true);
    const res = await recordDebtPayment({
      customerId: selectedDebtor.id,
      amount: paymentAmount,
      paymentMethod,
      notes: paymentNotes,
    });
    setIsSubmittingPay(false);

    if (res.success) {
      showAlert("success", res.message || "Pembayaran hutang berhasil dicatat!");
      setIsPayModalOpen(false);
      setSelectedDebtor(null);
    } else {
      showAlert("error", res.message || "Gagal mencatat pembayaran hutang.");
    }
  };

  // Open WhatsApp with friendly reminder message
  const handleSendWhatsApp = (debtor: DebtorCustomer) => {
    if (!debtor.phone) {
      showAlert("error", "Nomor WhatsApp pelanggan belum tercatat.");
      return;
    }

    const cleanPhone = debtor.phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("0")
      ? "62" + cleanPhone.substring(1)
      : cleanPhone;

    const storeName = storeSettings?.storeName || "TOKOin Warung";
    const text = `Halo Bapak/Ibu ${debtor.name}, kami dari ${storeName} ingin menginfokan bahwa terdapat catatan kasbon belanja sebesar ${formatRupiah(
      debtor.totalDebt
    )}. Mohon konfirmasinya jika sudah ada waktu untuk pelunasan ya. Terima kasih banyak 🙏`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // Save Customer (Create / Update)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerFormData.name.trim()) {
      showAlert("error", "Nama pelanggan wajib diisi.");
      return;
    }

    setIsSubmittingCustomer(true);
    let res;
    if (editingCustomer) {
      res = await updateCustomer(editingCustomer.id, customerFormData);
    } else {
      res = await createCustomer(customerFormData);
    }
    setIsSubmittingCustomer(false);

    if (res.success) {
      showAlert("success", res.message || "Data pelanggan berhasil disimpan!");
      setIsCustomerModalOpen(false);
      setEditingCustomer(null);
      setCustomerFormData({ name: "", phone: "", address: "", notes: "" });
    } else {
      showAlert("error", res.message || "Gagal menyimpan data pelanggan.");
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan pelanggan "${name}"?`)) return;
    const res = await deleteCustomer(id);
    if (res.success) {
      showAlert("success", res.message || "Pelanggan berhasil dinonaktifkan.");
    } else {
      showAlert("error", res.message || "Gagal menghapus pelanggan.");
    }
  };

  // Filtered lists
  const filteredDebtors = initialDebtors.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.phone && d.phone.includes(search))
  );

  const filteredTransactions = initialDebtTransactions.filter(
    (t) =>
      t.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (t.customer?.name && t.customer.name.toLowerCase().includes(search.toLowerCase())) ||
      (t.customerName && t.customerName.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredPayments = initialRecentPayments.filter(
    (p) =>
      p.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.transaction?.invoiceNumber &&
        p.transaction.invoiceNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredAllCustomers = initialAllCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alert && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm font-semibold animate-in fade-in ${
            alert.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {alert.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-amber-600" />
            <span>Buku Kasbon & Piutang Pelanggan</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Catatan bon belanja warung, penagihan, dan riwayat pembayaran cicilan
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setCustomerFormData({ name: "", phone: "", address: "", notes: "" });
            setIsCustomerModalOpen(true);
          }}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Pelanggan Baru</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Piutang Aktif */}
        <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Total Piutang Berjalan
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950 mt-2">
            {formatRupiah(stats.totalOutstandingDebt)}
          </div>
          <p className="text-xs text-amber-700 mt-1">
            Total kasbon yang belum lunas di warung
          </p>
        </div>

        {/* Pelanggan Berhutang */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Pelanggan Kasbon
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats.totalDebtorCount}{" "}
            <span className="text-sm font-semibold text-slate-500">Orang</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Memiliki sisa tagihan bon aktif
          </p>
        </div>

        {/* Total Pembayaran Diterima */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Cicilan / Pelunasan Diterima
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {formatRupiah(stats.totalPaymentsReceived)}
          </div>
          <p className="text-xs text-emerald-600 mt-1">
            Uang masuk dari pembayaran kasbon
          </p>
        </div>
      </div>

      {/* Main Content Area: Tabs + Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs & Search */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("DEBTORS")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                activeTab === "DEBTORS"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Buku Kasbon ({initialDebtors.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("TRANSACTIONS")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                activeTab === "TRANSACTIONS"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Nota Kasbon ({initialDebtTransactions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("PAYMENTS")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                activeTab === "PAYMENTS"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Cicilan ({initialRecentPayments.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("CUSTOMERS")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                activeTab === "CUSTOMERS"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Semua Pelanggan ({initialAllCustomers.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau no. WA..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* TAB 1: BUKU KASBON PELANGGAN */}
        {activeTab === "DEBTORS" && (
          <div className="overflow-x-auto">
            {filteredDebtors.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">Tidak Ada Kasbon Aktif</p>
                <p className="text-xs text-slate-500 mt-1">
                  Semua kasbon pelanggan telah lunas atau belum ada catatan hutang.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Pelanggan</th>
                    <th className="py-3.5 px-6">No. WhatsApp / HP</th>
                    <th className="py-3.5 px-6">Nota Belum Lunas</th>
                    <th className="py-3.5 px-6 text-right">Total Sisa Kasbon</th>
                    <th className="py-3.5 px-6 text-center">Aksi Pelunasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDebtors.map((debtor) => (
                    <tr key={debtor.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6">
                        <div className="font-black text-slate-900 text-sm">
                          {debtor.name}
                        </div>
                        {debtor.address && (
                          <div className="text-[11px] text-slate-500">{debtor.address}</div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {debtor.phone ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-700">{debtor.phone}</span>
                            <button
                              onClick={() => handleSendWhatsApp(debtor)}
                              title="Kirim Pesan Pengingat WhatsApp"
                              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Tagih WA</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Tidak ada nomor</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => setDetailCustomer(debtor)}
                          className="font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                        >
                          {debtor.transactions.length} Nota Transaksi
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="font-black text-sm text-amber-900 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                          {formatRupiah(debtor.totalDebt)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenPayModal(debtor)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Bayar / Cicil</span>
                          </button>
                          <button
                            onClick={() => setDetailCustomer(debtor)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                            title="Lihat Rincian"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: NOTA TRANSAKSI KASBON */}
        {activeTab === "TRANSACTIONS" && (
          <div className="overflow-x-auto">
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">Belum Ada Transaksi Kasbon</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-6">No. Nota & Waktu</th>
                    <th className="py-3.5 px-6">Pelanggan</th>
                    <th className="py-3.5 px-6">Total Belanja</th>
                    <th className="py-3.5 px-6">Dibayar (DP)</th>
                    <th className="py-3.5 px-6 text-right">Sisa Hutang</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6">
                        <div className="font-mono font-bold text-slate-900">
                          {tx.invoiceNumber}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {formatDate(tx.createdAt)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800">
                          {tx.customer?.name || tx.customerName || "Pelanggan Umum"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Kasir: {tx.cashier.name}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {formatRupiah(tx.total)}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {formatRupiah(tx.paidAmount)}
                      </td>
                      <td className="py-4 px-6 text-right font-black text-amber-900">
                        {formatRupiah(tx.debtRemaining)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            tx.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : tx.status === "PARTIAL"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {tx.status === "COMPLETED"
                            ? "Lunas"
                            : tx.status === "PARTIAL"
                            ? "Dicicil"
                            : "Belum Lunas"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 3: RIWAYAT PEMBAYARAN CICILAN */}
        {activeTab === "PAYMENTS" && (
          <div className="overflow-x-auto">
            {filteredPayments.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">Belum Ada Riwayat Pembayaran</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Waktu Pembayaran</th>
                    <th className="py-3.5 px-6">Pelanggan</th>
                    <th className="py-3.5 px-6">Metode</th>
                    <th className="py-3.5 px-6">Diterima Kasir</th>
                    <th className="py-3.5 px-6 text-right">Nominal Masuk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6 font-mono text-slate-600">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {p.customer.name}
                        {p.notes && (
                          <div className="text-[11px] text-slate-500 font-normal">
                            Catatan: {p.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-700">
                        {p.paymentMethod}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {p.cashier.name} (@{p.cashier.username})
                      </td>
                      <td className="py-4 px-6 text-right font-black text-sm text-emerald-700">
                        + {formatRupiah(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 4: DAFTAR SEMUA PELANGGAN */}
        {activeTab === "CUSTOMERS" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Nama Pelanggan</th>
                  <th className="py-3.5 px-6">No. WhatsApp / HP</th>
                  <th className="py-3.5 px-6">Alamat / Catatan</th>
                  <th className="py-3.5 px-6 text-right">Status Kasbon</th>
                  <th className="py-3.5 px-6 text-center">Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAllCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                      {cust.name}
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-600">
                      {cust.phone || "-"}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {cust.address || cust.notes || "-"}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {cust.totalDebt > 0 ? (
                        <span className="font-black text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          {formatRupiah(cust.totalDebt)}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg">
                          Tidak Ada Kasbon
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingCustomer(cust);
                            setCustomerFormData({
                              name: cust.name,
                              phone: cust.phone || "",
                              address: cust.address || "",
                              notes: cust.notes || "",
                            });
                            setIsCustomerModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                          title="Edit Pelanggan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition cursor-pointer"
                            title="Hapus Pelanggan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: BAYAR / CICIL HUTANG */}
      {isPayModalOpen && selectedDebtor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full my-6 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Catat Pembayaran Kasbon</h3>
                <p className="text-xs text-slate-400">
                  Pelanggan: <strong className="text-white">{selectedDebtor.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              {/* Total Outstanding Card */}
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Total Hutang Belum Lunas:
                </span>
                <span className="text-lg font-black text-amber-900">
                  {formatRupiah(selectedDebtor.totalDebt)}
                </span>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nominal Pembayaran Diterima (Rp)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-slate-400 text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                    min={1}
                    max={selectedDebtor.totalDebt}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                    required
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(selectedDebtor.totalDebt)}
                    className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition"
                  >
                    Lunas Semua ({formatRupiah(selectedDebtor.totalDebt)})
                  </button>
                  {selectedDebtor.totalDebt > 50000 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(50000)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                    >
                      Rp50.000
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="CASH">Tunai (Cash)</option>
                  <option value="QRIS">QRIS / Transfer Bank</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Contoh: Titip lewat tetangga / Transfer"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingPay ? "Menyimpan..." : "Simpan Pembayaran"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT PELANGGAN */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full my-6 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingCustomer ? "Edit Data Pelanggan" : "Tambah Pelanggan Baru"}
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nama Pelanggan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerFormData.name}
                  onChange={(e) =>
                    setCustomerFormData({ ...customerFormData, name: e.target.value })
                  }
                  placeholder="Contoh: Pak Budi RT 03"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  No. WhatsApp / HP
                </label>
                <input
                  type="text"
                  value={customerFormData.phone || ""}
                  onChange={(e) =>
                    setCustomerFormData({ ...customerFormData, phone: e.target.value })
                  }
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Alamat / Keterangan Rumah
                </label>
                <input
                  type="text"
                  value={customerFormData.address || ""}
                  onChange={(e) =>
                    setCustomerFormData({ ...customerFormData, address: e.target.value })
                  }
                  placeholder="Contoh: Rumah Biru Depan Musholla"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Catatan Khusus
                </label>
                <textarea
                  value={customerFormData.notes || ""}
                  onChange={(e) =>
                    setCustomerFormData({ ...customerFormData, notes: e.target.value })
                  }
                  placeholder="Catatan kebiasaan belanja atau batas kredit..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustomer}
                  className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCustomer ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RINCIAN KASBON PELANGGAN */}
      {detailCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full my-6 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Rincian Nota Kasbon</h3>
                <p className="text-xs text-slate-400">
                  Pelanggan: <strong className="text-white">{detailCustomer.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setDetailCustomer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">Total Sisa Tagihan:</span>
                <span className="text-lg font-black text-amber-900">
                  {formatRupiah(detailCustomer.totalDebt)}
                </span>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Daftar Transaksi Yang Belum Lunas:
                </span>

                {detailCustomer.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-mono font-bold text-slate-900">
                        {tx.invoiceNumber}
                      </span>
                      <span className="text-slate-500">{formatDate(tx.createdAt)}</span>
                    </div>

                    <div className="space-y-1 py-1">
                      {tx.items.map((it) => (
                        <div key={it.id} className="flex justify-between text-slate-700 text-[11px]">
                          <span>
                            {it.productName} ({it.quantity}x)
                          </span>
                          <span className="font-semibold">{formatRupiah(it.subtotal)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold">
                      <span className="text-slate-600">Sisa Hutang Nota Ini:</span>
                      <span className="text-amber-900 font-black">{formatRupiah(tx.debtRemaining)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setDetailCustomer(null)}
                className="py-2 px-5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  const deb = detailCustomer;
                  setDetailCustomer(null);
                  handleOpenPayModal(deb);
                }}
                className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Bayar Kasbon</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
