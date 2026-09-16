"use client";

import { useState } from "react";
import Sidebar, { SidebarContent } from "@/components/Sidebar";
import Header from "@/components/Header";

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
