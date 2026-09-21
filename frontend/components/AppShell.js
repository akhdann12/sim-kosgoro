"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar, { SidebarContent } from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/lib/context/AuthContext";

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, checkingSession } = useAuth();
  const router = useRouter();

  // Kalau belum login (dan udah selesai ngecek token tersimpan), lempar ke halaman login
  useEffect(() => {
    if (!checkingSession && !user) {
      router.replace("/login");
    }
  }, [checkingSession, user, router]);

  if (checkingSession) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-sm text-slate-400">
        <i className="fa-solid fa-spinner fa-spin mr-2"></i> Memeriksa sesi login...
      </div>
    );
  }

  if (!user) {
    return null; // lagi di-redirect ke /login
  }

  return (
    <>
      {/* Drawer mobile - cuma muncul di layar < md */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)}></div>
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-white shadow-xl">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Sidebar statis - cuma muncul di layar >= md */}
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(true)} />
        {children}
      </main>
    </>
  );
}
