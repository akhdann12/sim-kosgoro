"use client";

import { useState } from "react";

export default function TambahEventModal({ guruList, onClose, onSubmit, saving = false }) {
  const [nama, setNama] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [checked, setChecked] = useState(() => {
    const initial = {};
    guruList.forEach((g) => (initial[g.id] = true)); // default semua dianggap hadir
    return initial;
  });

  function toggle(id) {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  }

  function toggleAll(value) {
    const next = {};
    guruList.forEach((g) => (next[g.id] = value));
    setChecked(next);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!nama.trim() || !tanggal) return;
    onSubmit({ nama: nama.trim(), tanggal, checked });
  }

  const jumlahHadir = Object.values(checked).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose}></div>

      <form onSubmit={handleSubmit} className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-slate-800 text-sm">
            <i className="fa-solid fa-calendar-plus text-[#1e3a8a] mr-2"></i> Tambah Event / Kegiatan Baru
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Kegiatan</label>
              <input
                type="text"
                required
                placeholder="Contoh: Rapat Dinas Bulanan"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none focus:border-blue-300"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none focus:border-blue-300"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Guru Hadir ({jumlahHadir} / {guruList.length})
              </label>
              <div className="space-x-2 text-[10px]">
                <button type="button" onClick={() => toggleAll(true)} className="text-blue-600 hover:underline">Centang Semua</button>
                <button type="button" onClick={() => toggleAll(false)} className="text-slate-400 hover:underline">Kosongkan</button>
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {guruList.map((g) => (
                <label key={g.id} className="flex items-center px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!checked[g.id]}
                    onChange={() => toggle(g.id)}
                    className="mr-3 h-3.5 w-3.5 accent-[#1e3a8a]"
                  />
                  <div>
                    <p className="font-medium text-slate-700">{g.nama}</p>
                    <p className="text-[10px] text-slate-400">{g.jabatan}</p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Yang tidak dicentang otomatis tercatat Alpa, bisa diubah lagi ke Izin/Sakit di tabel.</p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end space-x-2 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded border border-slate-200">
            Batal
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-xs font-medium text-white bg-[#1e3a8a] hover:bg-blue-900 rounded shadow-sm disabled:opacity-60">
            {saving ? "Menyimpan..." : "Simpan Kegiatan"}
          </button>
        </div>
      </form>
    </div>
  );
}
