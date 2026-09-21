"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useTahunAjaran } from "@/lib/context/TahunAjaranContext";
import { PERIODE_OPTIONS } from "@/lib/periodUtils";
import { exportRowsToExcel, exportRowsToPDF } from "@/lib/exportUtils";

const predikatBadge = {
  "Sangat Baik": "bg-blue-50 text-blue-700 border-blue-100",
  "Perlu Pembinaan": "bg-red-100 text-red-600 border-red-200 font-bold",
  Cukup: "bg-blue-100 text-blue-700 border-blue-200",
};
const predikatDot = {
  "Sangat Baik": "bg-blue-500",
  "Perlu Pembinaan": "bg-red-500",
  Cukup: "bg-blue-500",
};

function buildHeadersRows(guruRekap) {
  const headers = ["No", "Nama Guru", "NIP", "Jabatan", "H", "I", "S", "A", "Total", "% Kehadiran", "Predikat"];
  const rows = guruRekap.map((g) => [g.no, g.nama, g.nip || "-", g.jabatan, g.h, g.i, g.s, g.a, g.total, g.persen, g.predikat]);
  return { headers, rows };
}

export default function DashboardPage() {
  const { data, current, loading, error, refresh } = useTahunAjaran();
  const { summaryCards, guruRekap } = data.dashboard; // default: tampilan tabel tetap pakai rekap satu semester penuh

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading && (
            <div className="mb-4 text-xs text-slate-400 flex items-center">
              <i className="fa-solid fa-spinner fa-spin mr-2"></i> Memuat data dari server...
            </div>
          )}
          {error && (
            <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2 flex items-center justify-between">
              <span><i className="fa-solid fa-circle-exclamation mr-1.5"></i> {error}</span>
              <button onClick={refresh} className="font-semibold underline">Coba lagi</button>
            </div>
          )}
          {/* Page Title & Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
            <div>
              <h2 className="text-2xl font-bold text-[#1e3a8a] mb-1">Rekapitulasi Kehadiran Guru Mengajar</h2>
              <p className="text-xs text-slate-500">
                Tahun Ajaran {current.tahun} &bull; Pemantauan Beban & Disiplin Akademik SMKS Kosgoro Kota Bogor
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded text-slate-600">
                <i className="fa-regular fa-calendar mr-2 text-slate-400"></i> {current.label}
              </span>
              <ExportButton dashboardByPeriod={data.dashboardByPeriod} periodRanges={data.periodRanges} taLabel={current.label} />
              <CetakLaporanButton dashboardByPeriod={data.dashboardByPeriod} periodRanges={data.periodRanges} taLabel={current.label} />
            </div>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {summaryCards.map((c) => (
              <div key={c.label} className={`bg-white p-4 rounded-lg border border-slate-200 shadow-sm border-l-4 ${c.borderClass} flex flex-col justify-between h-32`}>
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{c.label}</p>
                  <i className={`${c.icon} ${c.iconClass} p-1.5 rounded`}></i>
                </div>
                <div>
                  <div className="flex items-baseline space-x-2">
                    <h3 className={`text-3xl font-bold ${c.valueClass}`}>{c.value}</h3>
                    {c.unit && <span className="text-sm text-slate-500">{c.unit}</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {c.note} {c.noteHighlight && <span className="text-slate-600 font-semibold ml-2">{c.noteHighlight}</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* TABLE SECTION */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#1e3a8a] text-white rounded flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-table-list"></i>
                </div>
                <div>
                  <h4 className="font-bold text-[#1e3a8a] text-sm">Rekapitulasi Absensi Guru Mengajar</h4>
                  <p className="text-[11px] text-slate-500">Sumber sinkronisasi otomatis dari buku presensi KBM harian SMKS Kosgoro Bogor</p>
                </div>
              </div>
              <div className="flex space-x-2 text-xs font-semibold">
                <span className="bg-white border border-slate-200 px-3 py-1.5 rounded text-slate-600">{guruRekap.length} Data Tervalidasi</span>
                <span className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded text-emerald-700">
                  {guruRekap.filter((g) => g.a === 0).length} Nihil Alpa
                </span>
              </div>
            </div>

            <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100">
              <div className="flex items-center space-x-3 w-full sm:w-1/2">
                <div className="relative flex-1">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-300 text-xs"></i>
                  <input type="text" placeholder="Cari nama guru, jabatan, atau predikat..." className="w-full text-xs bg-slate-50 border border-slate-200 rounded py-2 pl-8 pr-3 outline-none focus:border-blue-300" />
                </div>
                <button className="text-xs px-4 py-2 border border-slate-200 rounded text-slate-500 bg-white hover:bg-slate-50 flex items-center whitespace-nowrap">
                  Semua Predikat <i className="fa-solid fa-chevron-down ml-2 text-[10px]"></i>
                </button>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center">
                Menampilkan {guruRekap.length} dari {guruRekap.length} Guru
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[#0f172a] text-white text-[10px] uppercase tracking-wider">
                    <th className="p-3 font-medium text-center w-12">No</th>
                    <th className="p-3 font-medium">Nama Guru & Gelar</th>
                    <th className="p-3 font-medium">Jabatan / Tugas</th>
                    <th className="p-3 font-medium text-center">H</th>
                    <th className="p-3 font-medium text-center">I</th>
                    <th className="p-3 font-medium text-center">S</th>
                    <th className="p-3 font-medium text-center">A</th>
                    <th className="p-3 font-medium text-center leading-tight">Total<br />Wajib</th>
                    <th className="p-3 font-medium text-center">%<br />Kehadiran</th>
                    <th className="p-3 font-medium">Evaluasi /<br />Predikat</th>

                  </tr>
                </thead>
                <tbody className="text-xs text-slate-600 divide-y divide-slate-100">
                  {guruRekap.map((g) => (
                    <tr
                      key={g.no}
                      className={
                        g.problem
                          ? "bg-red-50/30 hover:bg-red-50/60 border-l-4 border-l-red-500"
                          : g.caution
                          ? "bg-blue-50/30 hover:bg-blue-50/60 border-l-4 border-l-blue-400"
                          : "hover:bg-slate-50"
                      }
                    >
                      <td className={`p-3 text-center ${g.problem ? "text-red-500 font-bold" : g.caution ? "font-bold text-blue-600" : "text-slate-400"}`}>{g.no}</td>
                      <td className="p-3">
                        <p className={`font-bold text-sm ${g.problem ? "text-red-600" : g.caution ? "text-slate-800" : "text-[#1e3a8a]"}`}>{g.nama}</p>
                        {g.nip && <p className="text-[10px] text-slate-400 mt-0.5">NIP. {g.nip}</p>}
                        {g.warning && (
                          <p className={`text-[10px] mt-0.5 ${g.problem ? "text-red-500" : "text-blue-600"}`}>
                            {g.problem && <i className="fa-solid fa-circle-exclamation mr-1"></i>}
                            {g.warning}
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        {g.jabatanStyle ? (
                          <span className={g.jabatanStyle === "navy" ? "bg-[#1e3a8a] text-white px-2 py-1 rounded text-[10px] font-medium" : "bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-medium border border-blue-100"}>
                            {g.jabatan}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">{g.jabatan}</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-medium text-slate-700">{g.h}</td>
                      <td className="p-3 text-center text-slate-500">{g.i || 0}</td>
                      <td className="p-3 text-center text-slate-500">{g.s || 0}</td>
                      <td className={`p-3 text-center font-bold ${g.a ? (g.problem ? "text-red-500 bg-red-100 rounded" : "text-blue-600 bg-blue-100 rounded") : "text-slate-300"}`}>{g.a || 0}</td>
                      <td className="p-3 text-center font-bold text-slate-700">{g.total}</td>
                      <td className={`p-3 text-center font-bold ${g.problem ? "text-red-600" : g.caution ? "text-[#1e3a8a]" : "text-slate-700"}`}>{g.persen}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${predikatBadge[g.predikat]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${predikatDot[g.predikat]}`}></span> {g.predikat}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 rounded-b-lg">
              <div className="flex items-center text-[10px] text-slate-500">
                <i className="fa-solid fa-fingerprint mr-2 text-slate-300"></i> Perekapan dieksekusi berdasarkan SK Supervisi Akademik No. 421.5/082/SMK-KSG/VII/2026
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Keterangan: <span className="text-slate-700 font-bold ml-1">H</span> (Hadir) &nbsp;
                <span className="text-slate-700 font-bold">I</span> (Izin) &nbsp;
                <span className="text-slate-700 font-bold">S</span> (Sakit) &nbsp;
                <span className="text-slate-700 font-bold">A</span> (Alpa)
              </div>
            </div>
          </div>

          <br /><br />
        </div>
    </AppShell>
  );
}

// Popover pilih periode -> lalu pilih Excel atau PDF. Rentang tanggal & kop surat otomatis disisipkan ke dokumen.
function ExportButton({ dashboardByPeriod, periodRanges, taLabel }) {
  const [open, setOpen] = useState(false);
  const [withHeader, setWithHeader] = useState(true);

  async function handleExcel(periodKey) {
    setOpen(false);
    const { guruRekap } = dashboardByPeriod[periodKey];
    const { headers, rows } = buildHeadersRows(guruRekap);
    await exportRowsToExcel({ headers, rows, fileName: `rekap-kehadiran-guru-${periodKey}.xlsx`, sheetName: "Rekap Kehadiran" });
  }

  async function handlePdf(periodKey) {
    setOpen(false);
    const { guruRekap } = dashboardByPeriod[periodKey];
    const { headers, rows } = buildHeadersRows(guruRekap);
    const range = periodRanges[periodKey];
    await exportRowsToPDF({
      title: "Rekapitulasi Kehadiran Guru Mengajar",
      subtitle: `${taLabel} \u2022 SMK Kosgoro Kota Bogor\nPeriode data: ${range.startLabel} \u2014 ${range.endLabel}`,
      headers, rows,
      fileName: `rekap-kehadiran-guru-${periodKey}.pdf`,
      withLetterhead: withHeader,
    });
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center px-3 py-2 text-green-600 hover:text-green-700 font-medium">
        <i className="fa-solid fa-file-excel mr-2"></i> Ekspor Excel / PDF
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-20 text-xs overflow-hidden">
            <label className="flex items-center px-4 py-2.5 bg-slate-50 border-b border-slate-100 cursor-pointer">
              <input type="checkbox" checked={withHeader} onChange={(e) => setWithHeader(e.target.checked)} className="mr-2 accent-[#1e3a8a]" />
              <span className="text-slate-600">Sertakan kop surat sekolah (PDF)</span>
            </label>
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">Pilih Periode Data</div>
            {PERIODE_OPTIONS.map((p) => {
              const range = periodRanges[p.key];
              return (
                <div key={p.key} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="font-medium text-slate-700">{p.label}</p>
                    <p className="text-[9px] text-slate-400">{range.startLabel} \u2014 {range.endLabel}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button title="Download Excel" onClick={() => handleExcel(p.key)} className="text-emerald-600 hover:text-emerald-700 px-1.5">
                      <i className="fa-solid fa-file-excel"></i>
                    </button>
                    <button title="Download PDF" onClick={() => handlePdf(p.key)} className="text-red-500 hover:text-red-600 px-1.5">
                      <i className="fa-solid fa-file-pdf"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Cetak Laporan Supervisi -> pilih periode -> langsung generate PDF (kop surat + rentang tanggal otomatis)
function CetakLaporanButton({ dashboardByPeriod, periodRanges, taLabel }) {
  const [open, setOpen] = useState(false);
  const [withHeader, setWithHeader] = useState(true);

  async function handleCetak(periodKey) {
    setOpen(false);
    const { guruRekap } = dashboardByPeriod[periodKey];
    const { headers, rows } = buildHeadersRows(guruRekap);
    const range = periodRanges[periodKey];
    await exportRowsToPDF({
      title: "Laporan Supervisi Akademik \u2014 Kehadiran Guru Mengajar",
      subtitle: `${taLabel} \u2022 SMK Kosgoro Kota Bogor\nPeriode data: ${range.startLabel} \u2014 ${range.endLabel}\nDitujukan kepada: Kepala Sekolah SMK Kosgoro Bogor`,
      headers, rows,
      fileName: `laporan-supervisi-kepala-sekolah-${periodKey}.pdf`,
      withLetterhead: withHeader,
    });
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center px-4 py-2 bg-[#0f172a] text-white rounded font-medium hover:bg-slate-800 shadow-sm">
        <i className="fa-solid fa-print mr-2"></i> Cetak Laporan Supervisi
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-20 text-xs overflow-hidden">
            <label className="flex items-center px-4 py-2.5 bg-slate-50 border-b border-slate-100 cursor-pointer">
              <input type="checkbox" checked={withHeader} onChange={(e) => setWithHeader(e.target.checked)} className="mr-2 accent-[#1e3a8a]" />
              <span className="text-slate-600">Sertakan kop surat sekolah</span>
            </label>
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">Pilih Periode Laporan</div>
            {PERIODE_OPTIONS.map((p) => {
              const range = periodRanges[p.key];
              return (
                <button key={p.key} onClick={() => handleCetak(p.key)} className="w-full text-left flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="font-medium text-slate-700">{p.label}</p>
                    <p className="text-[9px] text-slate-400">{range.startLabel} \u2014 {range.endLabel}</p>
                  </div>
                  <i className="fa-solid fa-file-pdf text-red-500"></i>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
