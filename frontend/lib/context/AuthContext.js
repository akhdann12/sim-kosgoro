"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, getToken, setToken } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  // Waktu app pertama dibuka, cek apakah ada token tersimpan dari sesi sebelumnya
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCheckingSession(false);
      return;
    }
    fetch("/api/user", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setUser({ nama: data.name, email: data.email, initial: initials(data.name) }))
      .catch(() => setToken(null))
      .finally(() => setCheckingSession(false));
  }, []);

  async function login(email, password) {
    const result = await apiPost("/login", { email, password });
    setToken(result.token);
    setUser({ nama: result.user.name, email: result.user.email, initial: initials(result.user.name) });
    return result;
  }

  async function logout() {
    try {
      await apiPost("/logout", {});
    } catch (err) {
      console.error("Gagal logout ke server:", err);
    } finally {
      setToken(null);
      setUser(null);
      router.push("/login");
    }
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, checkingSession }}>
      {children}
    </AuthContext.Provider>
  );
}

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}
