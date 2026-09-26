// Util murni buat urusan rentang tanggal periode (minggu/bulan/3 bulan/semester) di dalam SATU
// Tahun Ajaran yang lagi dipilih user. Gak ada data tahun ajaran statis di sini lagi - daftar
// tahun ajaran & tanggal mulai/selesainya sekarang 100% berasal dari database (lihat
// TahunAjaranContext.js yang fetch dari GET /api/tahun-ajaran), user yang bikin sendiri lewat
// halaman "Tambah Tahun Ajaran".

export const PERIODE_OPTIONS = [
  { key: "week", label: "Minggu Ini" },
  { key: "month", label: "Bulan Ini" },
  { key: "months3", label: "3 Bulan Terakhir" },
  { key: "semester", label: "Satu Semester Ini" },
];

const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function fmtDate(d) {
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function clipDate(date, min, max) {
  if (date < min) return new Date(min);
  if (date > max) return new Date(max);
  return date;
}

// semStart & semEnd: Date, diambil LANGSUNG dari record Tahun Ajaran yang dipilih user
// (tanggal_mulai / tanggal_selesai) - bukan dihitung dari rumus/tebakan kalender lagi.
export function getPeriodRange(semStart, semEnd, period) {
  const today = new Date();
  const referenceEnd = today >= semStart && today <= semEnd ? today : semEnd;

  if (period === "semester") {
    return {
      start: semStart, end: semEnd,
      startLabel: fmtDate(semStart), endLabel: fmtDate(semEnd),
      startISO: toISODate(semStart), endISO: toISODate(semEnd),
    };
  }

  let start = new Date(referenceEnd);
  if (period === "week") start.setDate(start.getDate() - 6);
  else if (period === "month") start.setMonth(start.getMonth() - 1);
  else if (period === "months3") start.setMonth(start.getMonth() - 3);

  start = clipDate(start, semStart, semEnd);
  const end = clipDate(referenceEnd, semStart, semEnd);
  return { start, end, startLabel: fmtDate(start), endLabel: fmtDate(end), startISO: toISODate(start), endISO: toISODate(end) };
}
