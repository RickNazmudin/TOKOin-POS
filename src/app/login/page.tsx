"use client";

import { useState, useActionState } from "react";
import { loginServerAction } from "@/app/actions/auth";
import {
  Store,
  UserCheck,
  Lock,
  User,
  Eye,
  EyeOff,
} from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginServerAction, null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 mb-4 ring-4 ring-emerald-500/20">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            TOKO<span className="text-emerald-400">in</span>
          </h1>
          <p className="text-slate-300 text-sm mt-1.5 font-medium">
            Sistem Kasir & Manajemen Toko UMKM Pintar
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Masuk ke Aplikasi</h2>
            <p className="text-slate-500 text-sm mt-1">
              Silakan masukkan akun kasir atau pemilik toko Anda
            </p>
          </div>

          {state?.message && !state?.success && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 animate-in fade-in">
              <span className="font-semibold">Perhatian:</span> {state.message}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            {/* Username Input */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Nama Pengguna / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan nama pengguna"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memeriksa Akun...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-5 h-5" />
                  <span>Masuk ke TOKOin</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          TOKOin POS UMKM &bull; Cepat, Ringan & Akurat
        </p>
      </div>
    </div>
  );
}
