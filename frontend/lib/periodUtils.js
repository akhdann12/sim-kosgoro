// Util murni buat urusan Tahun Ajaran & rentang tanggal periode (minggu/bulan/3 bulan/semester).
// Gak ada data fiktif di sini - cuma perhitungan tanggal, dipakai buat nentuin query
// start/end yang dikirim ke backend (GET /api/dashboard/rekap?start=...&end=...).

export function taOptions() {
  const years = [2026, 2025, 2024, 2023];
  const opts = [];
  years.forEach((y) => {
    ["ganjil", "genap"].forEach((sem) => {
      opts.push({
        id: `${y}-${sem}`,
        label: `TA ${y}/${y + 1} \u2022 ${sem.toUpperCase()}`,
        tahun: `${y}/${y + 1}`,
        semester: sem,
      });
    });
  });
  return opts;
}

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

// Ganjil = 1 Jul - 31 Des tahun berjalan, Genap = 1 Jan - 30 Jun tahun setelahnya
export function semesterBounds(year, isGanjil) {
  if (isGanjil) return { start: new Date(year, 6, 1), end: new Date(year, 11, 31) };
  return { start: new Date(year + 1, 0, 1), end: new Date(year + 1, 5, 30) };
}

// Tanggal mulai efektif data beneran per TA, kalau beda dari awal semester "teoretis" di atas
// (misal: sekolah baru mulai catat data mulai pertengahan bulan). Tambahin baris baru di sini
// tiap ada TA baru yang datanya gak mulai persis dari 1 Juli / 1 Januari.
const TA_EFFECTIVE_START_OVERRIDE = {
  "2026-ganjil": new Date(2026, 6, 22), // data mulai dicatat dari 22 Juli 2026
};

function getEffectiveSemesterBounds(taId, year, isGanjil) {
  const bounds = semesterBounds(year, isGanjil);
  const override = TA_EFFECTIVE_START_OVERRIDE[taId];
  if (override && override > bounds.start) {
    return { start: override, end: bounds.end };
  }
  return bounds;
}

function clipDate(date, min, max) {
  if (date < min) return new Date(min);
  if (date > max) return new Date(max);
  return date;
}

export function getPeriodRange(taId, period) {
  const [yearStr, semester] = taId.split("-");
  const year = Number(yearStr);
  const isGanjil = semester === "ganjil";
  const { start: semStart, end: semEnd } = getEffectiveSemesterBounds(taId, year, isGanjil);
  const today = new Date();
  const referenceEnd = today >= semStart && today <= semEnd ? today : semEnd;

  if (period === "semester") {
    return { start: semStart, end: semEnd, startLabel: fmtDate(semStart), endLabel: fmtDate(semEnd), startISO: toISODate(semStart), endISO: toISODate(semEnd) };
  }

  let start = new Date(referenceEnd);
  if (period === "week") start.setDate(start.getDate() - 6);
  else if (period === "month") start.setMonth(start.getMonth() - 1);
  else if (period === "months3") start.setMonth(start.getMonth() - 3);

  start = clipDate(start, semStart, semEnd);
  const end = clipDate(referenceEnd, semStart, semEnd);
  return { start, end, startLabel: fmtDate(start), endLabel: fmtDate(end), startISO: toISODate(start), endISO: toISODate(end) };
}
