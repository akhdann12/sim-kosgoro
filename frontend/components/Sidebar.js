"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTahunAjaran } from "@/lib/context/TahunAjaranContext";

const menuKurikulum = [
  { href: "/dashboard", label: "Dashboard", icon: "fa-solid fa-border-all" },
  { href: "/presensi-kegiatan", label: "Presensi Kegiatan", icon: "fa-regular fa-calendar-check" },
  { href: "/ketidakhadiran", label: "Ketidakhadiran", icon: "fa-solid fa-user-xmark" },
];

const menuMaster = [
  { href: "/data-master-guru", label: "Data Master Guru", icon: "fa-solid fa-users-gear" },
];

// Isi sidebar dipisah jadi komponen sendiri supaya bisa dipakai ulang di drawer mobile (lihat AppShell.js)
export function SidebarContent({ onNavigate }) {
  const pathname = usePathname();
  const { options, current, setTaId } = useTahunAjaran();
  const [taOpen, setTaOpen] = useState(false);

  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <img src="/logo-kosgoro.png" alt="Logo SMK Kosgoro" className="w-9 h-9 mr-3 object-contain shrink-0" />
          <div>
            <h1 className="font-bold text-[#1e3a8a] leading-tight">SIM KOSGORO</h1>
            <p className="text-[10px] text-slate-500">Kurikulum & Presensi</p>
          </div>
        </div>

        <div className="px-5 py-4">
          {/* TAHUN AJARAN SELECTOR - fungsional, ngubah data di semua halaman */}
          <div className="relative mb-6">
            <button
              onClick={() => setTaOpen((v) => !v)}
              className="w-full bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-2 rounded flex justify-between items-center hover:bg-blue-100 transition"
            >
              <span>{current.label}</span>
              <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${taOpen ? "rotate-180" : ""}`}></i>
            </button>

            {taOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setTaOpen(false)}></div>
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto py-1">
                  {options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setTaId(opt.id);
                        setTaOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-center justify-between ${
                        opt.id === current.id ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600"
                      }`}
                    >
                      {opt.label}
                      {opt.id === current.id && <i className="fa-solid fa-check text-[10px]"></i>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Menu Kurikulum */}
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Menu Kurikulum</p>
          <nav className="space-y-1 mb-6">
            {menuKurikulum.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={
                    active
                      ? "flex items-center px-3 py-2.5 text-sm text-[#1e3a8a] bg-blue-50 rounded-md font-medium"
                      : "flex items-center px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-md"
                  }
                >
                  <i className={`${item.icon} w-6 text-center`}></i> {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Master & Pengaturan */}
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Master & Pengaturan</p>
          <nav className="space-y-1">
            {menuMaster.map((item) => (
              <Link key={item.label} href={item.href} onClick={onNavigate} className="flex items-center px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-md">
                <i className={`${item.icon} w-6 text-center`}></i> {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer Sidebar */}
      <div className="p-5 border-t border-slate-200">
        <div className="flex items-center text-xs text-slate-500 mb-2">
          <i className="fa-regular fa-circle-check text-green-500 mr-2"></i> SMK Kosgoro Bogor
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">Komp. Kosgoro Jl. Pajajaran No.217, Kota Bogor</p>
      </div>
    </div>
  );
}

// Wrapper buat versi desktop - selalu kelihatan di layar md ke atas
export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex shrink-0">
      <SidebarContent />
    </aside>
  );
}
