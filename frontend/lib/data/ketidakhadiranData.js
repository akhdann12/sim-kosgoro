export const summaryCards = [
  { label: "Total Insiden", icon: "fa-regular fa-clipboard", iconClass: "text-blue-500", borderClass: "border-l-blue-600", value: "9", unit: "Catatan", note: "Periode 29 Jul - 10 Ags 2026" },
  { label: "Guru Sakit (S)", icon: "fa-solid fa-briefcase-medical", iconClass: "text-amber-500", borderClass: "border-l-amber-500", value: "6", unit: "Kasus", note: "66.7% dari total absen" },
  { label: "Guru Izin (I)", icon: "fa-regular fa-calendar-minus", iconClass: "text-blue-500", borderClass: "border-l-blue-400", value: "3", unit: "Kasus", note: "Kepentingan dinas & keluarga" },
  { label: "Tugas Terdisposisi", icon: "fa-solid fa-file-signature", iconClass: "text-emerald-500", borderClass: "border-l-emerald-500", value: "7", unit: "Kelas", note: "Tugas Mandiri/LKPD aktif" },
  { label: "Inval Guru Terisi", icon: "fa-solid fa-person-chalkboard", iconClass: "text-purple-500", borderClass: "border-l-purple-500", value: "2", unit: "Sesi", note: "Inval: Nuh Yazisi (X Gab/RPL)" },
];

// status: "S" (Sakit - amber), "I" (Izin - blue), "A" (Alpa - red), "D" (Dinas Luar)
export const daftarKetidakhadiran = [
  { no: 1, nama: "Laras Dwi Febriyani, A.Md.Kom", mapel: "DDRPL", hari: "Rabu", tanggal: "29/07/2026", jam: "Jam 1 - 4", kelas: ["X Gabungan"], status: "S" },
  { no: 7, nama: "Lukman Hakim, Lc", mapel: "BTQ", hari: "Senin", tanggal: "10/08/2026", jam: "Jam 1 - 2", kelas: ["XI TKJ"], status: "I" },
  { no: 8, nama: "Dhama Shinta Noya Azzahra, S.Pd", mapel: "BK", hari: "Senin", tanggal: "10/08/2026", jam: "Jam 1 - 10", kelas: ["X TKJ", "X RPL", "X DKV"], status: "S" },
  { no: 9, nama: "Holilah Rahmawati, S.Si, M.Pd", mapel: "MTK", hari: "Senin", tanggal: "10/08/2026", jam: "Jam 1 - 3", kelas: ["X KKR"], status: "S" },
];

export const statusStyle = {
  S: { label: "S", desc: "(Sakit)", box: "bg-amber-50 text-amber-700 border-amber-200" },
  I: { label: "I", desc: "(Izin)", box: "bg-blue-50 text-blue-600 border-blue-200" },
  A: { label: "A", desc: "(Alpa)", box: "bg-red-50 text-red-600 border-red-200" },
  D: { label: "D", desc: "(Dinas Luar)", box: "bg-slate-100 text-slate-600 border-slate-200" },
};
