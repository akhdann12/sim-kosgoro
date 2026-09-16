"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);

// User default buat demo tampilan (nanti diganti hasil fetch GET /api/user setelah login Breeze beneran)
const DEMO_USER = {
  nama: "Kharisma Larasyudha, S.Kom",
  initial: "KL",
  role: "Waka. Bid. Kurikulum",
  email: "kharisma@smk-kosgoro.sch.id",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO_USER);
  const router = useRouter();

  async function logout() {
    try {
      // Begitu backend Laravel Breeze aktif, ganti/uncomment baris ini:
      // await apiPost("/logout", {});
    } catch (err) {
      console.error("Gagal logout ke server:", err);
    } finally {
      setUser(null);
      router.push("/login");
    }
  }

  return <AuthContext.Provider value={{ user, setUser, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}
