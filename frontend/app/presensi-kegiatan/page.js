"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import TambahEventModal from "@/components/TambahEventModal";
import { useTahunAjaran } from "@/lib/context/TahunAjaranContext";
import { exportRowsToExcel, exportMultiSectionPDF } from "@/lib/exportUtils";

const STATUS_OPTIONS = [
  { value: "hadir", label: "Hadir" },
  { value: "izin", label: "Izin" },
  { value: "alpa", label: "Alpa" },
];

const statusSelectClass = {
  hadir: "text-emerald-600 bg-emerald-50 border-emerald-200",
  alpa: "text-red-600 bg-red-50 border-red-200 font-bold",
  izin: "text-blue-600 bg-blue-50 border-blue-200 font-bold",
};

export default function PresensiKegiatanPage() {
  const { data, current } = useTahunAjaran();
  const [agendaList, setAgendaList] = useState(data.event.agendaList);
  const [guruEvent, setGuruEvent] = useState(data.event.guruEvent);
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | agenda key
  const [showModal, setShowModal] = useState(false);

  // Kalau TA diganti di sidebar, reset data lokal (biar ikutan berubah tapi status yang udah diedit manual di-refresh dari data TA baru)
  useEffect(() => {
    setAgendaList(data.event.agendaList);
    setGuruEvent(data.event.guruEvent);
    setActiveFilter("all");
  }, [data.event]);

  function recalcAgenda(nextGuruEvent, agendaSource) {
    return agendaSource.map((ag, idx) => {
      const hadir = nextGuruEvent.filter((g) => g.status[idx].value === "hadir").length;
      const total = nextGuruEvent.length;
      const tidakHadir = total - hadir;
      const persenNum = total > 0 ? Math.round((hadir / total) * 1000) / 10 : 0;
      return {
        ...ag,
        hadir, total, persenNum,
        persen: tidakHadir === 0 ? "100% Hadir" : `${persenNum}% (${tidakHadir} Tidak Hadir)`,
        barClass: tidakHadir === 0 ? "bg-emerald-500" : persenNum >= 90 ? "bg-red-400" : "bg-red-500",
        textClass: tidakHadir === 0 ? "text-emerald-600" : persenNum >= 90 ? "text-red-500" : "text-red-600",
      };
    });
  }

  function updateStatus(guruId, agendaIdx, newValue) {
    let reason = "";
    if (newValue !== "hadir") {
      reason = window.prompt("Alasan tidak hadir (opsional, buat catatan di rekap):", "") || "Tanpa keterangan";
    }
    setGuruEvent((prev) => {
      const next = prev.map((g) => {
        if (g.id !== guruId) return g;
        const status = [...g.status];
        status[agendaIdx] = { value: newValue, reason };
        return { ...g, status };
      });
      setAgendaList((prevAgenda) => recalcAgenda(next, prevAgenda));
      return next;
    });
  }

  function handleTambahEvent({ nama, tanggal, checked }) {
    const dateObj = new Date(tanggal);
    const tanggalLabel = isNaN(dateObj)
      ? tanggal
      : dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

    const newAgenda = {
      key: `agenda-custom-${Date.now()}`,
      label: nama.toUpperCase(),
      namaAsli: nama,
      tanggal: tanggalLabel,
    };

    const nextGuruEvent = guruEvent.map((g) => ({
      ...g,
      status: [...g.status, checked[g.id] ? { value: "hadir", reason: "" } : { value: "alpa", reason: "Tanpa keterangan" }],
    }));

    const nextAgendaList = recalcAgenda(nextGuruEvent, [...agendaList, newAgenda]);

    setGuruEvent(nextGuruEvent);
    setAgendaList(nextAgendaList);
    setActiveFilter("all");
    setShowModal(false);
  }

  const visibleAgendaIdx = agendaList
    .map((a, idx) => idx)
    .filter((idx) => activeFilter === "all" || agendaList[idx].key === activeFilter);

  const rekapPerAgenda = agendaList.map((ag) => ({
    hadir: ag.hadir, total: ag.total,
    note: ag.hadir === ag.total ? "100% Hadir" : `${ag.total - ag.hadir} Tidak Hadir`,
  }));

  return (
    <>
      <AppShell>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Page Title & Actions */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1e3a8a] mb-1">Jurnal & Log Kehadiran Guru Per Kegiatan</h2>
              <p className="text-xs text-slate-500">Catatan kehadiran harian / per kegiatan resmi sekolah SMK Kosgoro Kota Bogor</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 lg:mt-0 text-sm">
              <span className="flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-600">
                <i className="fa-regular fa-calendar mr-2 text-blue-500"></i> {current.label}
              </span>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center px-3 py-1.5 bg-[#1e3a8a] text-white rounded font-medium hover:bg-blue-900 shadow-sm"
              >
                <i className="fa-solid fa-plus mr-2"></i> Tambah Event Baru
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mb-4 text-sm font-medium">
            <ExportLogButton agendaList={agendaList} guruEvent={guruEvent} taLabel={current.label} />
            <CetakRekapButton agendaList={agendaList} guruEvent={guruEvent} taLabel={current.label} />
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {data.event.summaryCards.map((c) => (
              <div key={c.label} className={`bg-white p-4 rounded-lg border border-slate-200 shadow-sm border-l-4 ${c.borderClass} flex flex-col justify-between h-32 relative`}>
                <div className="flex justify-between items-start">
                  <p className={`text-[10px] font-bold uppercase tracking-wide ${c.labelClass || "text-slate-500"}`}>{c.label}</p>
                  {c.iconBoxClass ? (
                    <div className={`${c.iconBoxClass} p-1 rounded text-xs`}><i className={c.icon}></i></div>
                  ) : (
                    <i className={`${c.icon} ${c.iconClass}`}></i>
                  )}
                </div>
                <div>
                  <div className="flex items-baseline space-x-2">
                    <h3 className={`text-3xl font-bold ${c.valueClass}`}>{c.value}</h3>
                    {c.unit && <span className="text-sm text-slate-500 font-medium">{c.unit}</span>}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 leading-tight whitespace-pre-line pt-1 border-t border-slate-100">{c.note}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Section - agenda beneran bisa diklik buat filter kolom */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 space-y-3 md:space-y-0">
            <div className="flex items-center space-x-2 text-xs flex-wrap gap-y-2">
              <span className="text-slate-400 font-semibold uppercase mr-2 tracking-wider">Agenda:</span>
              <button
                onClick={() => setActiveFilter("all")}
                className={activeFilter === "all" ? "bg-[#1e3a8a] text-white px-3 py-1.5 rounded shadow-sm font-medium" : "bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded hover:bg-slate-50"}
              >
                Semua Kegiatan ({agendaList.length})
              </button>
              {agendaList.map((ag) => (
                <button
                  key={ag.key}
                  title={`${ag.namaAsli} \u2022 ${ag.tanggal} \u2022 ${ag.hadir}/${ag.total} hadir (${ag.persenNum}%)`}
                  onClick={() => setActiveFilter(ag.key)}
                  className={activeFilter === ag.key ? "bg-[#1e3a8a] text-white px-3 py-1.5 rounded shadow-sm font-medium" : "bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded hover:bg-slate-50"}
                >
                  {ag.namaAsli}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-4 text-[11px]">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">Status:</span>
              <span className="flex items-center text-slate-600"><i className="fa-regular fa-circle-check text-emerald-500 mr-1 text-sm"></i> Hadir</span>
              <span className="flex items-center text-slate-600"><i className="fa-regular fa-circle-xmark text-red-500 mr-1 text-sm"></i> Alpa</span>
              <span className="flex items-center text-slate-600"><i className="fa-regular fa-circle-info text-blue-500 mr-1 text-sm"></i> Izin</span>
              <span className="text-slate-400 italic">Klik status di tabel buat ubah</span>
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white border border-slate-200 rounded-t-lg shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#0f172a]">
                  <th colSpan={3} className="p-2"></th>
                  <th colSpan={visibleAgendaIdx.length} className="p-2 text-right text-white text-[10px] uppercase tracking-wider font-semibold pr-6">
                    <i className="fa-regular fa-calendar-check mr-1 text-slate-300"></i> Agenda Resmi {current.label}
                  </th>
                </tr>
                <tr className="bg-[#f1f5f9] border-b border-slate-200 text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="p-3 font-semibold text-center w-10">No</th>
                  <th className="p-3 font-semibold w-64">Nama Guru & NIP</th>
                  <th className="p-3 font-semibold w-56">Jabatan</th>
                  {visibleAgendaIdx.map((idx) => {
                    const a = agendaList[idx];
                    return (
                      <th key={a.key} title={`${a.namaAsli} \u2022 ${a.tanggal}`} className="p-3 font-semibold text-center align-top w-28 cursor-help">
                        <div className="text-[#1e3a8a] font-bold mb-1">{a.label}</div>
                        <div className="text-[9px] text-slate-400 mb-1">{a.tanggal}</div>
                        <div className={`w-full h-0.5 mb-1 ${a.barClass}`}></div>
                        <div className={`text-[9px] normal-case font-medium ${a.textClass}`}>{a.persen}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                {guruEvent.map((g) => {
                  const alpaCount = g.status.filter((s) => s.value === "alpa").length;
                  return (
                    <tr key={g.id} className={alpaCount >= 2 ? "bg-red-50/20 hover:bg-red-50/40" : alpaCount === 1 ? "bg-red-50/10 hover:bg-red-50/30" : "hover:bg-slate-50"}>
                      <td className={`p-3 text-center ${alpaCount >= 1 ? "text-red-500 font-bold" : "text-slate-400"}`}>{g.no}</td>
                      <td className="p-3">
                        <div className={`font-bold text-sm ${alpaCount >= 2 ? "text-red-600" : "text-slate-800"}`}>{g.nama}</div>
                        <div className={`text-[10px] ${alpaCount >= 1 ? "text-red-500" : "text-slate-400"}`}>
                          NIP: {g.nip}{alpaCount >= 2 ? " \u2022 Perlu Konfirmasi" : ""}
                        </div>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">{g.jabatan}</td>
                      {visibleAgendaIdx.map((idx) => {
                        const s = g.status[idx];
                        return (
                          <td key={idx} className="p-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <select
                                value={s.value}
                                onChange={(e) => updateStatus(g.id, idx, e.target.value)}
                                className={`text-[11px] font-semibold rounded px-1.5 py-0.5 border outline-none cursor-pointer ${statusSelectClass[s.value]}`}
                              >
                                {STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                              {s.value !== "hadir" && s.reason && (
                                <i className="fa-solid fa-circle-info text-slate-400 text-[10px] cursor-help" title={s.reason}></i>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer Recap */}
          <div className="bg-[#f8fafc] border-x border-b border-slate-200 rounded-b-lg p-3 flex flex-col md:flex-row justify-between items-center text-xs">
            <div className="flex items-center text-slate-500">
              <i className="fa-regular fa-circle-check text-slate-400 mr-2"></i> SMK Kosgoro Bogor
              <span className="ml-2 text-[10px] hidden md:inline">Komp. Kosgoro Jl. Pajajaran No.217, Kota Bogor</span>
            </div>
            <div className="flex items-center font-semibold mt-3 md:mt-0 flex-wrap">
              <span className="mr-6 text-slate-600">Rekapitulasi Kehadiran Per Kegiatan:</span>
              {rekapPerAgenda.map((r, idx) => (
                <div key={idx} className={`w-28 text-center text-[#1e3a8a] ${idx < rekapPerAgenda.length - 1 ? "border-r border-slate-300" : ""}`}>
                  {r.hadir} / {r.total} <br />
                  <span className={`text-[9px] font-normal ${r.hadir === r.total ? "text-slate-400" : "text-red-500"}`}>{r.note}</span>
                </div>
              ))}
            </div>
          </div>

          <br /><br />
        </div>
      </AppShell>

      {showModal && (
        <TambahEventModal
          guruList={guruEvent.map((g) => ({ id: g.id, nama: g.nama, jabatan: g.jabatan }))}
          onClose={() => setShowModal(false)}
          onSubmit={handleTambahEvent}
        />
      )}
    </>
  );
}

function ExportLogButton({ agendaList, guruEvent, taLabel }) {
  async function handleExport() {
    const headers = ["No", "Nama Guru", "NIP", "Jabatan", ...agendaList.map((a) => a.namaAsli)];
    const rows = guruEvent.map((g) => [
      g.no, g.nama, g.nip, g.jabatan,
      ...g.status.map((s) => (s.value === "hadir" ? "Hadir" : s.value === "izin" ? `Izin (${s.reason})` : `Alpa (${s.reason})`)),
    ]);
    await exportRowsToExcel({ headers, rows, fileName: `log-kegiatan-${taLabel.replace(/\s+/g, "-")}.xlsx`, sheetName: "Log Kegiatan" });
  }

  return (
    <button onClick={handleExport} className="text-blue-600 hover:text-blue-800 flex items-center">
      <i className="fa-solid fa-file-export mr-1.5"></i> Export Log Kegiatan
    </button>
  );
}

const STATUS_LABEL = { izin: "Izin", alpa: "Alpa" };

function CetakRekapButton({ agendaList, guruEvent, taLabel }) {
  const [open, setOpen] = useState(false);
  const [withHeader, setWithHeader] = useState(true);

  async function handleCetak() {
    setOpen(false);

    const rekapHeaders = ["Nama Kegiatan", "Tanggal", "Hadir", "Total", "% Kehadiran"];
    const rekapRows = agendaList.map((a) => [a.namaAsli, a.tanggal, a.hadir, a.total, `${a.persenNum}%`]);

    // Daftar guru yang gak hadir per kegiatan + alasannya
    const absensiRows = [];
    agendaList.forEach((ag, idx) => {
      guruEvent.forEach((g) => {
        const s = g.status[idx];
        if (s.value !== "hadir") {
          absensiRows.push([ag.namaAsli, g.nama, STATUS_LABEL[s.value] || s.value, s.reason || "-"]);
        }
      });
    });
    if (absensiRows.length === 0) {
      absensiRows.push(["-", "-", "-", "Tidak ada guru yang absen pada periode ini"]);
    }

    await exportMultiSectionPDF({
      title: "Rekap Presensi Kegiatan",
      subtitle: `${taLabel} \u2022 SMK Kosgoro Kota Bogor`,
      sections: [
        { heading: "Rekap Kehadiran per Kegiatan", headers: rekapHeaders, rows: rekapRows },
        { heading: "Daftar Guru Tidak Hadir & Alasan", headers: ["Nama Kegiatan", "Nama Guru", "Status", "Alasan"], rows: absensiRows },
      ],
      fileName: `rekap-absensi-kegiatan.pdf`,
      orientation: "portrait",
      withLetterhead: withHeader,
    });
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="text-slate-600 hover:text-slate-800 flex items-center">
        <i className="fa-solid fa-print mr-1.5"></i> Cetak Rekap Absensi
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 mt-1 w-60 bg-white border border-slate-200 rounded-lg shadow-lg z-20 text-xs overflow-hidden">
            <label className="flex items-center px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" checked={withHeader} onChange={(e) => setWithHeader(e.target.checked)} className="mr-2 accent-[#1e3a8a]" />
              <span className="text-slate-600">Sertakan kop surat sekolah</span>
            </label>
            <button onClick={handleCetak} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-t border-slate-100 font-medium text-slate-700 flex items-center">
              <i className="fa-solid fa-file-pdf mr-2 text-red-500"></i> Download PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
