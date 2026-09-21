"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Login gagal, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo-kosgoro.png" alt="Logo SMK Kosgoro" className="w-14 h-14 object-contain mb-3" />
          <h1 className="font-bold text-[#1e3a8a] text-lg">SIM KOSGORO</h1>
          <p className="text-xs text-slate-500">Kurikulum & Presensi &bull; SMK Kosgoro Kota Bogor</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@smk-kosgoro.sch.id"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded py-2.5 px-3 outline-none focus:border-blue-300"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded py-2.5 px-3 outline-none focus:border-blue-300"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2">
              <i className="fa-solid fa-circle-exclamation mr-1"></i> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white text-sm font-medium py-2.5 rounded shadow-sm disabled:opacity-60"
          >
            {loading ? "Memeriksa..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
