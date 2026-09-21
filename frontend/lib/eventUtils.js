// Hitungan murni buat halaman Presensi Kegiatan (rekap per agenda + summary card).
// Dipakai baik waktu data pertama di-fetch, maupun waktu status diedit manual di tabel
// (biar angka rekapnya konsisten di kedua jalur itu).

const STATUS_FROM_BACKEND = { H: "hadir", I: "izin", A: "alpa", S: "hadir" };
const STATUS_TO_BACKEND = { hadir: "H", izin: "I", alpa: "A" };

export function statusFromBackend(kode) {
  return STATUS_FROM_BACKEND[kode] || "hadir";
}

export function statusToBackend(value) {
  return STATUS_TO_BACKEND[value] || "H";
}

export function computeAgendaList(agendaBase, guruEvent) {
  return agendaBase.map((ag, idx) => {
    const hadir = guruEvent.filter((g) => g.status[idx]?.value === "hadir").length;
    const total = guruEvent.length;
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

export function computeEventSummary(agendaList, guruEvent) {
  const totalHadirPenuh = guruEvent.filter((g) => g.status.every((s) => s.value === "hadir")).length;
  const guruDenganAlpa = guruEvent.filter((g) => g.status.filter((s) => s.value === "alpa").length >= 1);
  const totalSlot = agendaList.reduce((sum, a) => sum + a.total, 0);
  const totalHadirSlot = agendaList.reduce((sum, a) => sum + a.hadir, 0);
  const overallHadirPersen = totalSlot > 0 ? Math.round((totalHadirSlot / totalSlot) * 1000) / 10 : 0;

  return [
    {
      label: "Tingkat Kehadiran Event", icon: "fa-solid fa-person-chalkboard", iconBoxClass: "bg-emerald-700 text-white",
      borderClass: "border-l-emerald-500", value: `${overallHadirPersen}%`,
      valueClass: overallHadirPersen >= 90 ? "text-emerald-600" : "text-amber-600",
      note: "Target Sekolah: \u2265 90.0%",
    },
    {
      label: "Agenda Terjadwal", icon: "fa-regular fa-calendar-check", iconClass: "text-blue-500",
      borderClass: "border-l-blue-400", value: String(agendaList.length), unit: "Agenda Resmi", valueClass: "text-slate-800",
      note: agendaList.length ? `${agendaList.map((a) => a.namaAsli).join(", ")}\nStatus: Berjalan Sesuai Kalender` : "Belum ada agenda tercatat",
    },
    {
      label: "Disiplin Penuh (100%)", icon: "fa-solid fa-award", iconClass: "text-[#1e3a8a]",
      borderClass: "border-l-[#1e3a8a]", value: String(totalHadirPenuh), unit: `/ ${guruEvent.length} Guru Inti`,
      valueClass: "text-[#1e3a8a]",
      note: `${guruEvent.length ? Math.round((totalHadirPenuh / guruEvent.length) * 1000) / 10 : 0}% tenaga pendidik tertib\nPresensi nihil absen di ${agendaList.length} agenda`,
    },
    {
      label: "Catatan Alpa & Perlu Konfirmasi", icon: "fa-solid fa-exclamation", iconClass: "text-red-500",
      borderClass: "border-l-red-500", labelClass: "text-red-500", value: String(guruDenganAlpa.length),
      unit: "Guru Memiliki Alpa", valueClass: "text-red-600",
      note: guruDenganAlpa.length
        ? `${guruDenganAlpa.map((g) => g.nama.split(",")[0]).join(" & ")}\nMemerlukan SP-1 Waka Kurikulum`
        : "Tidak ada catatan alpa pada periode ini",
    },
  ];
}

export function computeRekapPerAgenda(agendaList) {
  return agendaList.map((ag) => ({
    hadir: ag.hadir, total: ag.total,
    note: ag.hadir === ag.total ? "100% Hadir" : `${ag.total - ag.hadir} Tidak Hadir`,
  }));
}
