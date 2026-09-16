"use client";

import { useState } from "react";
import { useNotifications } from "@/lib/context/NotificationContext";
import { useAuth } from "@/lib/context/AuthContext";

function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "Baru saja";
  if (min < 60) return `${min} menit lalu`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} jam lalu`;
  return new Date(date).toLocaleDateString("id-ID");
}

export default function Header({ onMenuClick }) {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-6 shrink-0 relative">
      {/* Hamburger - mobile only */}
      <button onClick={onMenuClick} className="md:hidden p-2 -ml-1 mr-1 text-slate-600 shrink-0">
        <i className="fa-solid fa-bars text-lg"></i>
      </button>

      {/* Left: Context - disembunyikan di layar kecil biar gak sempit */}
      <div className="hidden lg:flex items-center text-xs text-slate-500 space-x-2 divide-x divide-slate-300 shrink-0">
        <span>SMK Kosgoro</span>
        <span className="pl-2 font-medium text-slate-700">Waka Kurikulum</span>
        <span className="pl-2">Semester Ganjil 2026/2027 &bull; Kota Bogor</span>
      </div>

      {/* Center: Search - disembunyikan di mobile */}
      <div className="hidden md:block flex-1 max-w-md mx-6">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-sm"></i>
          <input
            type="text"
            placeholder="Cari guru, NIP, mapel, atau tanggal..."
            className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* di mobile, judul app nongol di tengah sebagai gantinya search bar */}
      <div className="md:hidden flex-1 flex items-center justify-center space-x-2">
        <img src="/logo-kosgoro.png" alt="Logo" className="w-9 h-9 object-contain" />
        <span className="font-bold text-[#1e3a8a] text-sm">SIM KOSGORO</span>
      </div>

      {/* Right: Notifikasi & Profile */}
      <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
        {/* NOTIFIKASI - popup, gak pindah halaman */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="relative p-2 text-slate-400 hover:text-slate-600"
          >
            <i className="fa-regular fa-bell text-lg"></i>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-slate-200 rounded-lg shadow-xl z-40 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
                  <h4 className="font-bold text-sm text-slate-700">Notifikasi</h4>
                  {notifications.length > 0 && (
                    <button onClick={markAllRead} className="text-[11px] text-blue-600 hover:underline">
                      Tandai semua dibaca
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    <i className="fa-regular fa-bell-slash text-2xl mb-2 block"></i>
                    Belum ada notifikasi
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-3 text-xs ${n.read ? "" : "bg-blue-50/50"}`}>
                        <div className="flex items-start">
                          <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                            <i className="fa-solid fa-table-list text-[11px]"></i>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-700">{n.title}</p>
                            <p className="text-slate-500 mt-0.5">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.time)}</p>
                          </div>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 ml-1 shrink-0"></span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* PROFILE - dropdown logout */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center border-l pl-2 md:pl-4 border-slate-200"
          >
            <div className="text-right mr-3 hidden md:block">
              <p className="text-sm font-semibold text-slate-700 leading-none">{user?.nama?.split(",")[0] || "Tamu"},</p>
              <p className="text-xs text-slate-500 mt-1">{user?.nama?.split(",")[1]?.trim() || ""}</p>
            </div>
            <div className="w-9 h-9 bg-[#1e3a8a] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.initial || "?"}
            </div>
            <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 ml-2 hidden md:inline"></i>
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-xl z-40 overflow-hidden">
                <div className="p-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-700">{user?.nama}</p>
                  <p className="text-[11px] text-slate-500">{user?.role}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs text-red-600 hover:bg-red-50 flex items-center"
                >
                  <i className="fa-solid fa-arrow-right-from-bracket mr-2"></i> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
