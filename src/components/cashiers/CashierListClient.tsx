"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCashier,
  updateCashier,
  toggleCashierStatus,
  resetCashierPassword,
} from "@/app/actions/cashiers";
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShoppingCart,
  Edit2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
} from "lucide-react";

interface CashierUser {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  role: string;
  status: string;
  createdAt: string | Date;
  _count?: { transactions: number };
}

interface CashierListClientProps {
  initialUsers: CashierUser[];
  currentUserId: string;
}

export default function CashierListClient({
  initialUsers,
  currentUserId,
}: CashierListClientProps) {
  const router = useRouter();

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CashierUser | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<CashierUser | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CASHIER");
  const [status, setStatus] = useState("ACTIVE");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingUser(null);
    setName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setRole("CASHIER");
    setStatus("ACTIVE");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: CashierUser) => {
    setEditingUser(u);
    setName(u.name);
    setUsername(u.username);
    setEmail(u.email || "");
    setPassword("");
    setRole(u.role);
    setStatus(u.status);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openResetModal = (u: CashierUser) => {
    setResetTargetUser(u);
    setNewPassword("");
    setErrorMsg(null);
    setIsResetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("username", username);
    formData.append("email", email);
    formData.append("role", role);
    formData.append("status", status);

    if (!editingUser) {
      formData.append("password", password);
      const res = await createCashier(formData);
      setLoading(false);
      if (res.success) {
        setIsModalOpen(false);
        setFeedback(res.message || "Akun kasir berhasil dibuat.");
        router.refresh();
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setErrorMsg(res.message || "Gagal membuat akun.");
      }
    } else {
      const res = await updateCashier(editingUser.id, formData);
      setLoading(false);
      if (res.success) {
        setIsModalOpen(false);
        setFeedback(res.message || "Data kasir diperbarui.");
        router.refresh();
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setErrorMsg(res.message || "Gagal memperbarui.");
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !newPassword) return;

    setLoading(true);
    setErrorMsg(null);

    const res = await resetCashierPassword(resetTargetUser.id, newPassword);
    setLoading(false);
    if (res.success) {
      setIsResetOpen(false);
      setFeedback(`Kata sandi untuk ${resetTargetUser.name} berhasil direset.`);
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setErrorMsg(res.message || "Gagal mereset kata sandi.");
    }
  };

  const handleToggleStatus = async (u: CashierUser) => {
    if (u.id === currentUserId) {
      alert("Anda tidak dapat menonaktifkan akun sendiri!");
      return;
    }
    const res = await toggleCashierStatus(u.id, u.status);
    if (res.success) {
      setFeedback(res.message || "Status akun berhasil diubah.");
      router.refresh();
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Manajemen Pengguna & Akun Kasir</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Kelola akses staf kasir toko, atur hak akses role, dan reset kata sandi.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Tambah Akun Kasir Baru</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Cashier List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Nama Petugas</th>
                <th className="py-3.5 px-4">Username & Email</th>
                <th className="py-3.5 px-4">Hak Akses (Role)</th>
                <th className="py-3.5 px-4 text-center">Total Transaksi</th>
                <th className="py-3.5 px-4 text-center">Status Akun</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialUsers.map((u) => {
                const isAdmin = u.role === "ADMIN";
                const isSelf = u.id === currentUserId;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-semibold">
                            (Anda)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-mono font-semibold text-slate-800">
                        @{u.username}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {u.email || "-"}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          isAdmin
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {isAdmin ? (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        ) : (
                          <ShoppingCart className="w-3.5 h-3.5" />
                        )}
                        <span>{isAdmin ? "Pemilik / Admin" : "Kasir POS"}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800 text-xs">
                      {u._count?.transactions || 0} Transaksi
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={isSelf}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          u.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-300"
                        }`}
                      >
                        {u.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="Edit Profil Kasir"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openResetModal(u)}
                          className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          title="Reset Kata Sandi"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full my-6 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-base font-bold text-slate-900">
                {editingUser ? "Ubah Profil Pengguna" : "Tambah Akun Kasir Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nama Lengkap Petugas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Siti Aisyah"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Username Login <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: sitikasir"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email (Opsional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="siti@tokoin.local"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Kata Sandi Awal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Peran & Hak Akses (Role)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 cursor-pointer bg-slate-50 hover:bg-slate-100">
                    <input
                      type="radio"
                      name="role"
                      value="CASHIER"
                      checked={role === "CASHIER"}
                      onChange={() => setRole("CASHIER")}
                      className="accent-emerald-600"
                    />
                    <div>
                      <span className="font-bold text-xs block text-slate-900">
                        Kasir (POS)
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Hanya akses penjualan & kasir
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 cursor-pointer bg-slate-50 hover:bg-slate-100">
                    <input
                      type="radio"
                      name="role"
                      value="ADMIN"
                      checked={role === "ADMIN"}
                      onChange={() => setRole("ADMIN")}
                      className="accent-emerald-600"
                    />
                    <div>
                      <span className="font-bold text-xs block text-slate-900">
                        Pemilik / Admin
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Akses penuh semua fitur
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingUser ? "Simpan Perubahan" : "Buat Akun Kasir"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetOpen && resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Reset Kata Sandi
                </h3>
              </div>
              <button
                onClick={() => setIsResetOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Ketik kata sandi baru untuk akun kasir <strong>{resetTargetUser.name}</strong> (@{resetTargetUser.username}).
            </p>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Kata Sandi Baru (Min. 6 Karakter)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || !newPassword}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  {loading ? "Mereset..." : "Reset Kata Sandi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
