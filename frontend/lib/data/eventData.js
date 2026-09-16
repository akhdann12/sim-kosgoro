export const summaryCards = [
  {
    label: "Tingkat Kehadiran Event",
    icon: "fa-solid fa-person-chalkboard",
    iconBoxClass: "bg-emerald-700 text-white",
    borderClass: "border-l-emerald-500",
    value: "92.4%",
    valueClass: "text-emerald-600",
    badge: "+1.8%",
    note: "Target Sekolah: ≥ 90.0%",
  },
  {
    label: "Agenda Terjadwal",
    icon: "fa-regular fa-calendar-check",
    iconClass: "text-blue-500",
    borderClass: "border-l-blue-400",
    value: "4",
    unit: "Agenda Resmi",
    valueClass: "text-slate-800",
    note: "IHT, Maulid Nabi, Workshop, Raker\nStatus: Berjalan Sesuai Kalender",
  },
  {
    label: "Disiplin Penuh (100%)",
    icon: "fa-solid fa-award",
    iconClass: "text-[#1e3a8a]",
    borderClass: "border-l-[#1e3a8a]",
    value: "15",
    unit: "/ 17 Guru Inti",
    valueClass: "text-[#1e3a8a]",
    note: "88.2% Total tenaga pendidik tertib\nPresensi nihil absen di 4 agenda",
  },
  {
    label: "Catatan Alpa & Perlu Konfirmasi",
    icon: "fa-solid fa-exclamation",
    iconClass: "text-red-500",
    borderClass: "border-l-red-500",
    labelClass: "text-red-500",
    value: "2",
    unit: "Guru Memiliki Alpa",
    valueClass: "text-red-600",
    note: "Pak Iksan (3 alpa) & Bu Dida (2 alpa)\nMemerlukan SP-1 Waka Kurikulum",
  },
];

export const agendaList = [
  { key: "iht1", label: "IHT HARI 1", tanggal: "14 Jul 2026", persen: "100% Hadir", barClass: "bg-emerald-500", textClass: "text-emerald-600" },
  { key: "iht2", label: "IHT HARI 2", tanggal: "15 Jul 2026", persen: "94.1% (1 Alpa)", barClass: "bg-red-400", textClass: "text-red-500" },
  { key: "maulid", label: "MAULID NABI", tanggal: "10 Sep 2026", persen: "88.2% (2 Alpa)", barClass: "bg-red-500", textClass: "text-red-600" },
];

// status per guru per agenda: "hadir" | "alpa" | "izin"
export const guruEvent = [
  { no: 1, nama: "Deden Hendradi, S.Kom, M.Pd.", nip: "19780512 203801 1 004", jabatan: "Kepala Sekolah", status: ["hadir", "hadir", "hadir"] },
  { no: 2, nama: "Kharisma Larasyudha, S.Kom", nip: "19850320 201101 1 009", jabatan: "Waka. Bid. Kurikulum", status: ["hadir", "hadir", "hadir"] },
  { no: 3, nama: "Risma Rosita A. S. S.Th", nip: "19900914 201602 2 015", jabatan: "Guru Mapel PAI", status: ["hadir", "hadir", "hadir"] },
  { no: 4, nama: "Nur Siti Masrofjah, S.Pd", nip: "19890412 201504 2 008", jabatan: "Guru Mapel Bahasa Indonesia", status: ["hadir", "hadir", "hadir"] },
  { no: 7, nama: "Ahmad Subandi, SE., MM.", nip: "19800615 200504 1 012", jabatan: "Kepala HUBINMAS", status: ["hadir", "hadir", "hadir"] },
  { no: 14, nama: "Laras Dwi Febriani, A.Md.Kom", nip: "19960228 202102 2 004", jabatan: "Guru Mapel / Staff Kurikulum", status: ["hadir", "hadir", "hadir"] },
  { no: 15, nama: "Iksan Zen Fadli, S.Pd", nip: "19930718 202001 1 009", jabatan: "Guru Mapel PJOK", problem: true, note: "Perlu Konfirmasi", status: ["hadir", "alpa", "alpa"] },
  { no: 16, nama: "Dida Widiani, SE.", nip: "19830419 201103 2 005", jabatan: "Guru Mapel Akuntansi & Keuangan", note: "Izin Terlambat", status: ["hadir", "hadir", "alpa"] },
  { no: 17, nama: "Mardiah, S.Pd", nip: "19881204 201502 2 009", jabatan: "Guru Mapel Bahasa Inggris", status: ["hadir", "hadir", "hadir"] },
];

export const rekapPerAgenda = [
  { hadir: 17, total: 17, note: "100% Hadir" },
  { hadir: 16, total: 17, note: "1 Alpa" },
  { hadir: 15, total: 17, note: "2 Alpa" },
];
