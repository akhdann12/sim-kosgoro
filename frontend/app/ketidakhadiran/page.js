"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import GoogleSheetSyncPanel from "@/components/GoogleSheetSyncPanel";
import { useTahunAjaran } from "@/lib/context/TahunAjaranContext";

const statusStyle = {
  S: { label: "S", desc: "(Sakit)", box: "bg-amber-50 text-amber-700 border-amber-200" },
  I: { label: "I", desc: "(Izin)", box: "bg-blue-50 text-blue-600 border-blue-200" },
  A: { label: "A", desc: "(Alpa)", box: "bg-red-50 text-red-600 border-red-200" },
  D: { label: "D", desc: "(Dinas Luar)", box: "bg-slate-100 text-slate-600 border-slate-200" },
};

const todayId = new Date().toLocaleDateString("id-ID", { weekday: "long" });
const todayStr = new Date().toLocaleDateString("id-ID");

export default function KetidakhadiranPage() {
  const { data, current } = useTahunAjaran();
  const { guruList } = data;

  const [daftar, setDaftar] = useState(data.ketidakhadiran.daftarKetidakhadiran);

  useEffect(() => {
    setDaftar(data.ketidakhadiran.daftarKetidakhadiran);
  }, [data.ketidakhadiran]);

  const [form, setForm] = useState({
    guru_id: "",
    mapel: "",
    hari: todayId,
    tanggal: todayStr,
    jam_ke: "",
    kelas: "",
    kode: "S",
    pengganti: "",
    catatan: "",
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function submitForm(e) {
    e.preventDefault();
    const guru = guruList.find((g) => String(g.id) === String(form.guru_id));
    if (!guru) return;

    const kelasArr = form.kelas ? form.kelas.split(",").map((k) => k.trim()).filter(Boolean) : ["-"];

    setDaftar((prev) => [
      {
        no: prev.length + 1,
        guru_id: guru.id,
        nama: guru.nama,
        mapel: form.mapel || guru.mapel || "-",
        hari: form.hari,
        tanggal: form.tanggal,
        jam: form.jam_ke || "-",
        kelas: kelasArr,
        status: form.kode,
        pengganti: form.pengganti,
        catatan: form.catatan,
      },
      ...prev,
    ]);

    setForm((f) => ({ ...f, guru_id: "", mapel: "", jam_ke: "", kelas: "", pengganti: "", catatan: "" }));
  }

  const summaryCards = [
    { label: "Total Insiden", icon: "fa-regular fa-clipboard", iconClass: "text-blue-500", borderClass: "border-l-blue-600", value: String(daftar.length), unit: "Catatan", note: `Periode ${current.label}` },
    { label: "Guru Sakit (S)", icon: "fa-solid fa-briefcase-medical", iconClass: "text-amber-500", borderClass: "border-l-amber-500", value: String(daftar.filter((d) => d.status === "S").length), unit: "Kasus", note: "Rekap otomatis dari jurnal harian" },
    { label: "Guru Izin (I)", icon: "fa-regular fa-calendar-minus", iconClass: "text-blue-500", borderClass: "border-l-blue-400", value: String(daftar.filter((d) => d.status === "I").length), unit: "Kasus", note: "Kepentingan dinas & keluarga" },
    { label: "Guru Alpa (A)", icon: "fa-solid fa-user-xmark", iconClass: "text-red-500", borderClass: "border-l-red-500", value: String(daftar.filter((d) => d.status === "A").length), unit: "Kasus", note: "Perlu tindak lanjut Waka Kurikulum" },
    { label: "Dinas Luar (D)", icon: "fa-solid fa-briefcase", iconClass: "text-purple-500", borderClass: "border-l-purple-500", value: String(daftar.filter((d) => d.status === "D").length), unit: "Kasus", note: "Tugas / undangan dinas resmi" },
  ];

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Page Title & Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">Data Ketidakhadiran Guru Mengajar & Pengganti (Inval)</h2>
              <p className="text-xs text-slate-500">
                SMK Kosgoro Kota Bogor &bull; {current.label} &bull; Rekapitulasi Presensi & Disposisi Penugasan Kelas
              </p>
            </div>
          </div>

          {/* 5 Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
            {summaryCards.map((c) => (
              <div key={c.label} className={`bg-white p-3 rounded-lg border border-slate-200 shadow-sm border-l-4 ${c.borderClass} flex flex-col justify-between`}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{c.label}</p>
                  <i className={`${c.icon} ${c.iconClass}`}></i>
                </div>
                <div>
                  <div className="flex items-baseline space-x-1">
                    <h3 className="text-2xl font-bold text-slate-800">{c.value}</h3>
                    <span className="text-xs text-slate-500">{c.unit}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{c.note}</p>
                </div>
              </div>
            ))}
          </div>

          {/* SINKRONISASI GOOGLE SPREADSHEET (live sync) */}
          <GoogleSheetSyncPanel onImport={(rows) => setDaftar(rows)} />

          {/* FAST INPUT FORM */}
          <form onSubmit={submitForm} className="bg-white border border-slate-200 rounded-lg shadow-sm mb-6">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
                  <i className="fa-solid fa-bolt"></i>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 text-sm">Input Cepat Ketidakhadiran & Penugasan Inval</h4>
                  <p className="text-[10px] text-slate-500">Isi form ini buat catat guru izin/sakit hari ini</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Guru</label>
                  <select
                    required
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded py-2 px-3 text-slate-700 outline-none"
                    value={form.guru_id}
                    onChange={(e) => update("guru_id", e.target.value)}
                  >
                    <option value="">-- Pilih Guru Berhalangan --</option>
                    {guruList.map((g) => (
                      <option key={g.id} value={g.id}>{g.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mata Pelajaran</label>
                  <input type="text" placeholder="Contoh: DDRPL, Matematika, BK" className="w-full text-xs bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none" value={form.mapel} onChange={(e) => update("mapel", e.target.value)} />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hari</label>
                  <input type="text" className="w-full text-xs bg-slate-50 border border-slate-200 rounded py-2 px-3 text-slate-700 font-medium outline-none" value={form.hari} readOnly />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tanggal</label>
                  <input type="text" className="w-full text-xs bg-slate-50 border border-slate-200 rounded py-2 px-3 text-slate-700 font-medium outline-none" value={form.tanggal} readOnly />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jam Ke- / Kelas</label>
                  <div className="flex space-x-1">
                    <input type="text" placeholder="Jam 1 - 4" className="w-1/2 text-xs bg-slate-50 border border-slate-200 rounded py-2 px-2 outline-none text-center" value={form.jam_ke} onChange={(e) => update("jam_ke", e.target.value)} />
                    <input type="text" placeholder="X RPL, XI TKJ" className="w-1/2 text-xs bg-slate-50 border border-slate-200 rounded py-2 px-2 outline-none text-center" value={form.kelas} onChange={(e) => update("kelas", e.target.value)} />
                  </div>
                </div>
              </div>
              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Keterangan Kode</label>
                  <select className="w-full text-xs bg-slate-50 border border-slate-200 rounded py-2 px-3 text-slate-700 outline-none" value={form.kode} onChange={(e) => update("kode", e.target.value)}>
                    <option value="S">S - Sakit (Surat Dokter/Pemberitahuan)</option>
                    <option value="I">I - Izin</option>
                    <option value="D">D - Dinas Luar</option>
                    <option value="A">A - Alpa</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Guru Pengganti / Tugas</label>
                  <input type="text" placeholder="Inval: Nama Guru atau 'Tugas Mandiri'" className="w-full text-xs bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none" value={form.pengganti} onChange={(e) => update("pengganti", e.target.value)} />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Catatan Keterangan / Alasan</label>
                  <input type="text" placeholder="Contoh: Istirahat Dokter, Anter anak sakit..." className="w-full text-xs bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none" value={form.catatan} onChange={(e) => update("catatan", e.target.value)} />
                </div>
                <div className="col-span-1 flex items-end">
                  <button type="submit" className="w-full bg-[#1e3a8a] text-white text-xs font-medium py-2 px-4 rounded hover:bg-blue-900 transition shadow-sm h-[34px]">
                    Simpan Disposisi
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* TABLE SECTION */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-white rounded-t-lg space-y-3 md:space-y-0">
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-slate-800 text-sm">Daftar Rekapitulasi Sesuai Buku Jurnal Kurikulum</h4>
                <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded font-medium border border-blue-100">{current.semester === "ganjil" ? "Semester Ganjil" : "Semester Genap"}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#0f172a] text-white text-[10px] uppercase tracking-wider">
                    <th className="p-3 font-medium text-center w-12">No</th>
                    <th className="p-3 font-medium">Nama Guru Berhalangan</th>
                    <th className="p-3 font-medium">Mata<br />Pelajaran</th>
                    <th className="p-3 font-medium">Hari</th>
                    <th className="p-3 font-medium">Tanggal</th>
                    <th className="p-3 font-medium">Jam Ke-</th>
                    <th className="p-3 font-medium">Kelas</th>
                    <th className="p-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-600 divide-y divide-slate-100">
                  {daftar.map((row, idx) => {
                    const s = statusStyle[row.status];
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 text-center text-slate-400">{row.no}</td>
                        <td className="p-3 flex items-center">
                          <i className="fa-regular fa-user text-slate-300 mr-2"></i>
                          <span className="font-bold text-slate-700">{row.nama}</span>
                        </td>
                        <td className="p-3 font-medium">{row.mapel}</td>
                        <td className="p-3">{row.hari}</td>
                        <td className="p-3">{row.tanggal}</td>
                        <td className="p-3">{row.jam}</td>
                        <td className="p-3">
                          {row.kelas.length > 1 ? (
                            <div className="flex flex-wrap gap-1">
                              {row.kelas.map((k, i) => (
                                <span key={i} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">{k}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px]">{row.kelas[0]}</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className={`inline-flex flex-col items-center px-2 py-0.5 rounded border font-bold w-16 ${s.box}`}>
                            <span>{s.label}</span>
                            <span className="text-[9px] font-normal">{s.desc}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center rounded-b-lg">
              <div className="text-[11px] text-slate-400">Menampilkan {daftar.length} catatan jurnal KBM {current.label}</div>
            </div>
          </div>

          {/* Global Footer Info */}
          <div className="mt-4 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-500 bg-white p-3 rounded border border-slate-200 shadow-sm">
            <div className="flex items-center">
              <i className="fa-solid fa-circle-info mr-2 text-slate-400"></i> Perekaman data inval dan ketidakhadiran disinkronkan langsung dengan Jurnal KBM Harian SMK Kosgoro {current.label}.
            </div>
            <div className="flex items-center mt-2 md:mt-0 space-x-4">
              <div>
                Keterangan Kode:
                <span className="font-bold text-slate-700 ml-1">S</span> (Sakit)
                <span className="font-bold text-slate-700 ml-2">I</span> (Izin)
                <span className="font-bold text-slate-700 ml-2">A</span> (Alpa)
                <span className="font-bold text-slate-700 ml-2">D</span> (Dinas Luar)
              </div>
            </div>
          </div>

          <br /><br />
        </div>
    </AppShell>
  );
}
