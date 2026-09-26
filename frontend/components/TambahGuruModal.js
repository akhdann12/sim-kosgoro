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

export default function TambahGuruModal({ onClose, onSubmit, saving = false, defaultTanggalBergabung = null }) {
  const [nama, setNama] = useState("");
  const [jabatanPreset, setJabatanPreset] = useState("Guru Mapel");
  const [jabatanCustom, setJabatanCustom] = useState("");
  const [mapel, setMapel] = useState("");
  const [nip, setNip] = useState("");
  const [tanggalBergabung, setTanggalBergabung] = useState(defaultTanggalBergabung || "");
  const [errorMsg, setErrorMsg] = useState(null);

  // Selama mode setup Tahun Ajaran aktif, tanggal bergabung dikunci ke tanggal mulai TA itu -
  // di luar mode itu, guru baru WAJIB diisi tanggal bergabungnya sendiri (gak boleh nebak-nebak).
  const terkunci = Boolean(defaultTanggalBergabung);

  function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg(null);
    const jabatan = jabatanPreset === "Lainnya" ? jabatanCustom.trim() : jabatanPreset;
    if (!nama.trim() || !jabatan) return;
    if (!terkunci && !tanggalBergabung) {
      setErrorMsg("Tanggal bergabung wajib diisi kalau bukan lagi setup awal Tahun Ajaran.");
      return;
    }
    onSubmit({ nama: nama.trim(), jabatan, mapel: mapel.trim(), nip: nip.trim(), tanggal_bergabung: tanggalBergabung || null });
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

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Tanggal Bergabung {terkunci ? "" : <span className="text-red-500">*wajib</span>}
            </label>
            <input
              type="date"
              required={!terkunci}
              disabled={terkunci}
              value={tanggalBergabung}
              onChange={(e) => setTanggalBergabung(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none focus:border-blue-300 disabled:opacity-70 disabled:bg-slate-100"
            />
            {terkunci ? (
              <p className="text-[10px] text-emerald-600 mt-1">
                <i className="fa-solid fa-lock mr-1"></i> Otomatis diisi tanggal mulai Tahun Ajaran yang lagi di-setup.
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 mt-1">
                Tanggal guru ini resmi mulai mengajar - Dashboard gak akan menghitung dia "Hadir" untuk hari-hari
                sebelum tanggal ini.
              </p>
            )}
          </div>

          {errorMsg && (
            <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
              <i className="fa-solid fa-circle-exclamation mr-1"></i> {errorMsg}
            </p>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded border border-slate-200">
            Batal
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-xs font-medium text-white bg-[#1e3a8a] hover:bg-blue-900 rounded shadow-sm disabled:opacity-60">
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
