"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/context/AuthContext";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

function formatTanggalID(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function TambahAkunModal({ onClose, onSubmit, saving }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [errorMsg, setErrorMsg] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg(null);
    if (!name.trim() || !email.trim() || password.length < 8) {
      setErrorMsg("Password minimal 8 karakter.");
      return;
    }
    onSubmit({ name: name.trim(), email: email.trim(), password, role }).catch((err) => setErrorMsg(err.message || "Gagal menyimpan akun."));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose}></div>
      <form onSubmit={handleSubmit} className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm"><i className="fa-solid fa-user-plus text-[#1e3a8a] mr-2"></i> Tambah Akun</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full text-sm bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none focus:border-blue-300" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-sm bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none focus:border-blue-300" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Password</label>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full text-sm bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none focus:border-blue-300" placeholder="Minimal 8 karakter" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full text-sm bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none focus:border-blue-300">
              <option value="admin">Admin (cuma bisa lihat & export/cetak PDF)</option>
              <option value="super_admin">Super Admin (bisa edit semua)</option>
            </select>
          </div>
          {errorMsg && (
            <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2"><i className="fa-solid fa-circle-exclamation mr-1"></i> {errorMsg}</p>
          )}
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded border border-slate-200">Batal</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-xs font-medium text-white bg-[#1e3a8a] hover:bg-blue-900 rounded shadow-sm disabled:opacity-60">
            {saving ? "Menyimpan..." : "Simpan Akun"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ManajemenUserPage() {
  const { user, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  function load() {
    setLoading(true);
    apiGet("/users")
      .then(setUsers)
      .catch((err) => setError(err.message || "Gagal memuat daftar akun."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (isSuperAdmin) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  async function handleTambah(payload) {
    setSaving(true);
    try {
      await apiPost("/users", payload);
      setShowModal(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleUbahRole(u, role) {
    setBusyId(u.id);
    try {
      await apiPut(`/users/${u.id}`, { role });
      load();
    } catch (err) {
      alert(err.message || "Gagal mengubah role.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleHapus(u) {
    if (!window.confirm(`Hapus akun "${u.name}"? Akun ini gak akan bisa login lagi.`)) return;
    setBusyId(u.id);
    try {
      await apiDelete(`/users/${u.id}`);
      load();
    } catch (err) {
      alert(err.message || "Gagal menghapus akun.");
    } finally {
      setBusyId(null);
    }
  }

  if (!isSuperAdmin) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-sm text-center bg-white border border-slate-200 rounded-lg shadow-sm p-8">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-lock text-2xl"></i>
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Khusus Super Admin</h3>
            <p className="text-xs text-slate-500">Akun Anda (Admin) gak punya izin buat mengelola akun lain.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#1e3a8a] mb-1">Manajemen Akun</h2>
            <p className="text-xs text-slate-500">
              Super Admin bisa edit/hapus/import semua data. Admin cuma bisa lihat data & export/cetak PDF.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-[#1e3a8a] text-white rounded font-medium hover:bg-blue-900 shadow-sm text-sm whitespace-nowrap"
          >
            <i className="fa-solid fa-user-plus mr-2"></i> Tambah Akun
          </button>
        </div>

        {error && (
          <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2 flex items-center justify-between">
            <span><i className="fa-solid fa-circle-exclamation mr-1.5"></i> {error}</span>
            <button onClick={load} className="font-semibold underline">Coba lagi</button>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f172a] text-white text-[10px] uppercase tracking-wider">
                <th className="p-3 font-medium">Nama</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium w-48">Role</th>
                <th className="p-3 font-medium">Dibuat</th>
                <th className="p-3 font-medium text-right pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600 divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400"><i className="fa-solid fa-spinner fa-spin mr-2"></i>Memuat...</td></tr>
              )}
              {!loading && users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-700">
                    {u.name} {u.id === user?.id && <span className="text-[9px] text-slate-400 font-normal">(Anda)</span>}
                  </td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      disabled={busyId === u.id}
                      onChange={(e) => handleUbahRole(u, e.target.value)}
                      className={`text-[11px] font-semibold rounded px-2 py-1 border outline-none cursor-pointer disabled:opacity-50 ${u.role === "super_admin" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}
                    >
                      <option value="admin">Admin (View Only)</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </td>
                  <td className="p-3 text-slate-400">{formatTanggalID(u.created_at)}</td>
                  <td className="p-3 text-right pr-6">
                    <button
                      onClick={() => handleHapus(u)}
                      disabled={busyId === u.id || u.id === user?.id}
                      className="text-red-500 hover:text-red-700 text-[11px] font-medium disabled:opacity-30"
                      title={u.id === user?.id ? "Gak bisa hapus akun sendiri" : "Hapus akun"}
                    >
                      <i className="fa-solid fa-trash-can mr-1"></i> Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Belum ada akun.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-[10px] text-slate-500 bg-white p-3 rounded border border-slate-200 shadow-sm">
          <i className="fa-solid fa-circle-info mr-1.5 text-slate-400"></i>
          <b>Admin</b> hanya bisa melihat Dashboard, tabel Ketidakhadiran, Presensi Kegiatan, dan Data Master Guru,
          plus tetap bisa Export/Cetak PDF - tapi gak bisa nambah/ubah/hapus/import data apapun.
        </div>

        <br /><br />
      </div>

      {showModal && <TambahAkunModal onClose={() => setShowModal(false)} onSubmit={handleTambah} saving={saving} />}
    </AppShell>
  );
}
