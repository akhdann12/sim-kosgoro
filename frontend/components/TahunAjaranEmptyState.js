"use client";

export default function TahunAjaranEmptyState({ onAdd }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md text-center bg-white border border-slate-200 rounded-lg shadow-sm p-8">
        <div className="w-14 h-14 bg-blue-50 text-[#1e3a8a] rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fa-regular fa-calendar-plus text-2xl"></i>
        </div>
        <h3 className="font-bold text-slate-800 mb-2">Belum Ada Tahun Ajaran</h3>
        <p className="text-xs text-slate-500 mb-5">
          Sistem belum punya data Tahun Ajaran. Buat Tahun Ajaran dulu (nama, semester, tanggal mulai & selesai)
          sebelum bisa melihat Dashboard, Presensi Kegiatan, atau Ketidakhadiran.
        </p>
        <button
          onClick={onAdd}
          className="inline-flex items-center px-4 py-2 bg-[#1e3a8a] text-white rounded font-medium hover:bg-blue-900 shadow-sm text-sm"
        >
          <i className="fa-solid fa-plus mr-2"></i> Tambah Tahun Ajaran
        </button>
      </div>
    </div>
  );
}
