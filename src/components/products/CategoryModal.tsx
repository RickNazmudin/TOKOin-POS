"use client";

import { useState } from "react";
import { createCategory, updateCategory, deleteCategory } from "@/app/actions/categories";
import { X, Plus, Edit2, Trash2, Tag, Check, AlertCircle } from "lucide-react";

interface Category {
  id: string;
  name: string;
  status: string;
  _count?: { products: number };
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onRefresh: () => void;
}

export default function CategoryModal({
  isOpen,
  onClose,
  categories,
  onRefresh,
}: CategoryModalProps) {
  const [newCatName, setNewCatName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("name", newCatName.trim());

    const res = await createCategory(formData);
    setLoading(false);
    if (res.success) {
      setNewCatName("");
      setMessage({ type: "success", text: res.message || "Kategori ditambahkan." });
      onRefresh();
    } else {
      setMessage({ type: "error", text: res.message || "Gagal menambah kategori." });
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("name", editingName.trim());

    const res = await updateCategory(id, formData);
    setLoading(false);
    if (res.success) {
      setEditingId(null);
      setMessage({ type: "success", text: res.message || "Kategori diperbarui." });
      onRefresh();
    } else {
      setMessage({ type: "error", text: res.message || "Gagal memperbarui." });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus kategori "${name}"?`)) return;
    setLoading(true);
    setMessage(null);

    const res = await deleteCategory(id);
    setLoading(false);
    if (res.success) {
      setMessage({ type: "success", text: res.message || "Kategori dihapus." });
      onRefresh();
    } else {
      setMessage({ type: "error", text: res.message || "Gagal menghapus." });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Kelola Kategori Produk</h3>
              <p className="text-xs text-slate-500">Kelola kelompok jenis barang di toko Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Add Category Form */}
        <div className="p-6 border-b border-slate-100">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Nama Kategori Baru (misal: Sembako, Rokok, Minuman)..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={loading || !newCatName.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </form>
        </div>

        {/* Category List */}
        <div className="p-6 max-h-72 overflow-y-auto space-y-2">
          {categories.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">Belum ada kategori terdaftar.</p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition"
              >
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs bg-white border border-emerald-400 rounded-lg focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdate(cat.id)}
                      disabled={loading}
                      className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                    <span className="ml-2 text-[10px] text-slate-400 font-medium">
                      ({cat._count?.products || 0} Produk)
                    </span>
                  </div>
                )}

                {editingId !== cat.id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditingName(cat.name);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                      title="Ubah Nama"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
