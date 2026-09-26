"use client";

import { useState } from "react";

export default function TambahTahunAjaranModal({ onClose, onSubmit, saving = false }) {
  const thisYear = new Date().getFullYear();
  const [nama, setNama] = useState(`${thisYear}/${thisYear + 1}`);
  const [semester, setSemester] = useState("ganjil");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [jadikanAktif, setJadikanAktif] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg(null);
    if (!nama.trim() || !tanggalMulai || !tanggalSelesai) return;
    if (tanggalSelesai < tanggalMulai) {
      setErrorMsg("Tanggal selesai gak boleh sebelum tanggal mulai.");
      return;
    }
    onSubmit({
      nama: nama.trim(),
      semester,
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai,
      aktif: jadikanAktif,
    }).catch((err) => setErrorMsg(err.message || "Gagal menyimpan Tahun Ajaran."));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose}></div>

      <form onSubmit={handleSubmit} className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">
            <i className="fa-regular fa-calendar-plus text-[#1e3a8a] mr-2"></i> Tambah Tahun Ajaran
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-[11px] text-slate-500 -mt-1">
            Tentukan sendiri periode tahun ajaran/semester berjalan. Semua rekap Dashboard, Presensi Kegiatan &
            Ketidakhadiran akan dihitung berdasarkan rentang tanggal ini.
          </p>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Tahun Ajaran</label>
            <input
              type="text"
              required
              placeholder="Contoh: 2027/2028"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none focus:border-blue-300"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none focus:border-blue-300"
            >
              <option value="ganjil">Ganjil</option>
              <option value="genap">Genap</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tanggal Mulai</label>
              <input
                type="date"
                required
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none focus:border-blue-300"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tanggal Selesai</label>
              <input
                type="date"
                required
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none focus:border-blue-300"
              />
            </div>
          </div>

          <label className="flex items-center text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={jadikanAktif}
              onChange={(e) => setJadikanAktif(e.target.checked)}
              className="mr-2 h-3.5 w-3.5 accent-[#1e3a8a]"
            />
            Jadikan Tahun Ajaran aktif (langsung dipakai sebagai tampilan default)
          </label>

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
            {saving ? "Menyimpan..." : "Simpan Tahun Ajaran"}
          </button>
        </div>
      </form>
    </div>
  );
}
