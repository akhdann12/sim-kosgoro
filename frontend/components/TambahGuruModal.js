"use client";

import { useState } from "react";

const JABATAN_PRESET = [
  "Guru Mapel",
  "Guru BK",
  "Kepala Sekolah",
  "Waka. Bid. Kurikulum",
  "Waka. Bid. Kesiswaan",
  "Waka. Bid. Adm. Sarpras",
  "Tenaga Administrasi",
  "Tenaga Kebersihan",
  "Lainnya",
];

export default function TambahGuruModal({ onClose, onSubmit }) {
  const [nama, setNama] = useState("");
  const [jabatanPreset, setJabatanPreset] = useState("Guru Mapel");
  const [jabatanCustom, setJabatanCustom] = useState("");
  const [mapel, setMapel] = useState("");
  const [nip, setNip] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const jabatan = jabatanPreset === "Lainnya" ? jabatanCustom.trim() : jabatanPreset;
    if (!nama.trim() || !jabatan) return;
    onSubmit({ nama: nama.trim(), jabatan, mapel: mapel.trim(), nip: nip.trim() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose}></div>

      <form onSubmit={handleSubmit} className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">
            <i className="fa-solid fa-user-plus text-[#1e3a8a] mr-2"></i> Tambah Guru / Tenaga Kependidikan
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Lengkap & Gelar</label>
            <input
              type="text"
              required
              placeholder="Contoh: Budi Santoso, S.Pd"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none focus:border-blue-300"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jabatan</label>
            <select
              value={jabatanPreset}
              onChange={(e) => setJabatanPreset(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none focus:border-blue-300"
            >
              {JABATAN_PRESET.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
            {jabatanPreset === "Lainnya" && (
              <input
                type="text"
                required
                placeholder="Tulis jabatan lain..."
                value={jabatanCustom}
                onChange={(e) => setJabatanCustom(e.target.value)}
                className="w-full mt-2 text-sm bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none focus:border-blue-300"
              />
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mata Pelajaran (opsional)</label>
            <input
              type="text"
              placeholder="Contoh: Matematika, PJOK, BK"
              value={mapel}
              onChange={(e) => setMapel(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none focus:border-blue-300"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">NIP / ID (opsional)</label>
            <input
              type="text"
              placeholder="Kosongin aja kalau belum ada, ID internal otomatis dibuat"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none focus:border-blue-300"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded border border-slate-200">
            Batal
          </button>
          <button type="submit" className="px-4 py-2 text-xs font-medium text-white bg-[#1e3a8a] hover:bg-blue-900 rounded shadow-sm">
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
