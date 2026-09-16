// ============================================================
// Generator data per Tahun Ajaran.
// Di real app ini diganti fetch ke Laravel API (GET /api/dashboard/rekap?ta=2026-ganjil dst).
// Untuk sekarang datanya di-generate deterministik (seeded) per TA supaya:
//  - tiap TA punya angka yang konsisten (gak random tiap reload)
//  - ganti TA di sidebar -> semua halaman (dashboard, presensi kegiatan, ketidakhadiran) ikut berubah
// ============================================================

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let t = seed;
  return function () {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function rand(taId, key) {
  return mulberry32(hashString(`${taId}::${key}`))();
}

// Data master guru & tenaga kependidikan. Ini "source of truth" - dipakai semua halaman
// (Dashboard, Presensi Kegiatan, Ketidakhadiran). Diedit lewat halaman Data Master Guru
// (lib/context/GuruMasterContext.js), bukan lewat file ini langsung di real app nanti.
//
// struktural: true  -> jajaran pimpinan (Kepala/Waka), dianggap presensi kehadiran penuh
// kategori "Tenaga Administrasi"/"Tenaga Kebersihan" -> gak dihitung di rekap "Guru Mengajar"
export const MASTER_GURU = [
  { id: 1, nama: "Deden Hendradi, S.Kom, M.Pd.", nip: "197808122005011003", jabatan: "Kepala Sekolah", jabatanStyle: "blue", struktural: true },
  { id: 2, nama: "Kharisma Larasyudha, S.Kom", nip: "198904152014022002", jabatan: "Waka. Bid. Kurikulum", jabatanStyle: "navy", struktural: true },
  { id: 3, nama: "Risma Rosita A. S. S.Th", nip: "", jabatan: "Guru Mapel", mapel: "PAI" },
  { id: 4, nama: "Nur Siti Masrofijah, S.Pd", nip: "", jabatan: "Guru Mapel", mapel: "Bahasa Indonesia" },
  { id: 5, nama: "Fetry Mirasari, S.Pd.i", nip: "", jabatan: "Guru Mapel" },
  { id: 6, nama: "Tun Utama Putra, M.Pd.", nip: "", jabatan: "Waka. Bid. Kesiswaan", jabatanStyle: "navy", struktural: true },
  { id: 7, nama: "Ahmad Subandi, SE., MM.", nip: "", jabatan: "Kepala HUBINMAS", jabatanStyle: "blue", struktural: true },
  { id: 8, nama: "Maulana Adi Juliawan, S.Kom", nip: "", jabatan: "Waka. Bid. Adm. Sarpras", jabatanStyle: "navy", struktural: true },
  { id: 9, nama: "Eren Intan Judit Zahiyah, S.Pd", nip: "", jabatan: "Ka. Bid. Pariwisata / PSPT" },
  { id: 10, nama: "Kurnia Fajar Ningrat, S.Pd", nip: "", jabatan: "Bendahara Sekolah" },
  { id: 11, nama: "Nunyk Laila, S.Pd", nip: "", jabatan: "Guru Mapel" },
  { id: 12, nama: "Marselina, S.Ikom", nip: "", jabatan: "Guru Mapel" },
  { id: 13, nama: "Holilah Rahmawati, S.Si, M.Pd", nip: "", jabatan: "Ka. Bid. TIK", mapel: "Matematika" },
  { id: 14, nama: "Laras Dwi Febriani, A.Md.Kom", nip: "", jabatan: "Guru Mapel / Staff Kurikulum", mapel: "DDRPL" },
  { id: 15, nama: "Iksan Zen Fadli, S.Pd", nip: "", jabatan: "Guru Mapel", mapel: "PJOK" },
  { id: 16, nama: "Dida Widiani, SE.", nip: "", jabatan: "Guru Mapel", mapel: "Akuntansi & Keuangan" },
  { id: 17, nama: "Mardiah, S.Pd", nip: "", jabatan: "Guru Mapel", mapel: "Bahasa Inggris" },
  { id: 18, nama: "Vrisky Aviandika, S.Pd", nip: "", jabatan: "Guru Mapel / Staff Kesiswaan" },
  { id: 19, nama: "Maya Puspa Sartika, S.Psi", nip: "", jabatan: "Guru BK", mapel: "BK" },
  { id: 20, nama: "Achmad Jaenudin, SE.", nip: "", jabatan: "Guru Mapel" },
  { id: 21, nama: "Erfina Nurfitria Rifani, S.Pd.", nip: "", jabatan: "Guru Mapel" },
  { id: 22, nama: "Lukman Hakim Anshori, Lc.", nip: "", jabatan: "Guru Mapel", mapel: "BTQ" },
  { id: 23, nama: "Furqon Maulana, S.Kom.", nip: "", jabatan: "Guru Mapel" },
  { id: 24, nama: "Agista Deva Ananda, S.S.", nip: "", jabatan: "Guru Mapel" },
  { id: 25, nama: "Dhama Shinta Noya Azzahra, S.Pd.", nip: "", jabatan: "Guru BK", mapel: "BK" },
  { id: 26, nama: "Teghar Ramadhan Putra, S.Pd.", nip: "", jabatan: "Guru Mapel" },
  { id: 27, nama: "Nuh Yazidi", nip: "", jabatan: "Tenaga Administrasi" },
  { id: 28, nama: "Muhammad Farhan", nip: "", jabatan: "Tenaga Administrasi" },
  { id: 29, nama: "Della Tri Agustina", nip: "", jabatan: "Tenaga Administrasi" },
  { id: 30, nama: "Edwin Adriyawan", nip: "", jabatan: "Tenaga Kebersihan" },
  { id: 31, nama: "Ade Setiyo", nip: "", jabatan: "Tenaga Kebersihan" },
];

// Jabatan yang gak dihitung di rekap "Guru Mengajar" (Dashboard) & disposisi inval (Ketidakhadiran)
export const JABATAN_NON_PENGAJAR = ["Tenaga Administrasi", "Tenaga Kebersihan"];

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

function predikatOf(persenNum, alpa) {
  if (persenNum < 70) return "Perlu Pembinaan";
  if (alpa >= 1 && persenNum < 90) return "Cukup";
  return "Sangat Baik";
}

const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function fmtDate(d) {
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

// Batas tanggal semester: Ganjil = 1 Jul - 31 Des tahun berjalan, Genap = 1 Jan - 30 Jun tahun setelahnya
function semesterBounds(year, isGanjil) {
  if (isGanjil) return { start: new Date(year, 6, 1), end: new Date(year, 11, 31) };
  return { start: new Date(year + 1, 0, 1), end: new Date(year + 1, 5, 30) };
}

function clipDate(date, min, max) {
  if (date < min) return new Date(min);
  if (date > max) return new Date(max);
  return date;
}

export const PERIODE_OPTIONS = [
  { key: "week", label: "Minggu Ini", sesi: 2 },
  { key: "month", label: "Bulan Ini", sesi: 4 },
  { key: "months3", label: "3 Bulan Terakhir", sesi: 7 },
  { key: "semester", label: "Satu Semester Ini", sesi: null },
];

function getPeriodRange(year, isGanjil, period) {
  const { start: semStart, end: semEnd } = semesterBounds(year, isGanjil);
  const today = new Date();
  const referenceEnd = today >= semStart && today <= semEnd ? today : semEnd;

  if (period === "semester") {
    return { start: semStart, end: semEnd, startLabel: fmtDate(semStart), endLabel: fmtDate(semEnd) };
  }

  let start = new Date(referenceEnd);
  if (period === "week") start.setDate(start.getDate() - 6);
  else if (period === "month") start.setMonth(start.getMonth() - 1);
  else if (period === "months3") start.setMonth(start.getMonth() - 3);

  start = clipDate(start, semStart, semEnd);
  const end = clipDate(referenceEnd, semStart, semEnd);
  return { start, end, startLabel: fmtDate(start), endLabel: fmtDate(end) };
}

// Bangun rekap guru + summary card, dipakai buat data utama maupun per-periode (seed beda -> angka beda tapi konsisten)
function buildDashboard(taId, seedSuffix, totalSesi, yearStr, year, guruListForDashboard) {
  const guruRekap = guruListForDashboard.map((g) => {
    if (g.struktural) {
      return {
        id: g.id, no: g.id, nama: g.nama, nip: g.nip, jabatan: g.jabatan, jabatanStyle: g.jabatanStyle,
        h: totalSesi, i: 0, s: 0, a: 0, total: totalSesi, persen: "100.0%",
        predikat: "Sangat Baik", aksi: { type: "log" },
      };
    }
    const r1 = rand(taId, `${seedSuffix}-${g.id}-cat`);
    let a = 0, s = 0, i = 0;
    if (r1 < 0.13) a = totalSesi >= 3 ? 3 : 1;
    else if (r1 < 0.26) a = totalSesi >= 2 ? 2 : 1;
    else if (r1 < 0.46) a = 1;

    if (a === 0) {
      const r2 = rand(taId, `${seedSuffix}-${g.id}-alt`);
      if (r2 < 0.3) s = 1;
      else if (r2 < 0.5) i = 1;
    }

    const h = Math.max(totalSesi - a - s - i, 0);
    const persenNum = totalSesi > 0 ? Math.round((h / totalSesi) * 1000) / 10 : 0;
    const predikat = predikatOf(persenNum, a);

    return {
      id: g.id, no: g.id, nama: g.nama, nip: g.nip, jabatan: g.jabatan,
      problem: predikat === "Perlu Pembinaan",
      caution: predikat === "Cukup",
      warning:
        predikat === "Perlu Pembinaan"
          ? `Di bawah ambang KBM (${persenNum.toFixed(1)}%)`
          : a >= 1
          ? `Akumulasi ${a} Alpa`
          : undefined,
      h, i, s, a, total: totalSesi,
      persen: `${persenNum.toFixed(1)}%`,
      predikat,
      aksi:
        predikat === "Perlu Pembinaan"
          ? { type: "surat", label: "Surat Bimbingan" }
          : predikat === "Cukup"
          ? { type: "teguran", label: "Beri Teguran" }
          : { type: "log" },
    };
  });

  const totalGuru = guruRekap.length;
  const rataRata = totalGuru > 0 ? Math.round((guruRekap.reduce((sum, g) => sum + parseFloat(g.persen), 0) / totalGuru) * 10) / 10 : 0;
  const sangatBaik = guruRekap.filter((g) => g.predikat === "Sangat Baik").length;
  const perluBimbingan = guruRekap.filter((g) => g.predikat === "Perlu Pembinaan").length;
  const cukup = guruRekap.filter((g) => g.predikat === "Cukup").length;

  const summaryCards = [
    {
      label: "Total Guru Terdaftar", icon: "fa-solid fa-user-group", iconClass: "text-blue-500 bg-blue-50",
      borderClass: "border-l-blue-600", value: String(totalGuru), unit: "Guru Aktif", valueClass: "text-slate-800",
      note: `100% Tercatat di SIM TA ${yearStr}/${year + 1}`,
    },
    {
      label: "Rata-rata Kehadiran", icon: "fa-solid fa-chart-line", iconClass: "text-emerald-600 bg-emerald-50",
      borderClass: "border-l-emerald-500", value: `${rataRata}%`,
      valueClass: rataRata >= 90 ? "text-emerald-600" : "text-amber-600",
      note: "Target Disiplin: \u226590.0%",
      noteHighlight: rataRata >= 90 ? "Melampaui Target" : "Di Bawah Target",
    },
    {
      label: "Predikat Sangat Baik", icon: "fa-regular fa-circle-check", iconClass: "text-blue-500 bg-blue-50",
      borderClass: "border-l-blue-500", value: String(sangatBaik),
      unit: `Pendidik (${totalGuru > 0 ? Math.round((sangatBaik / totalGuru) * 1000) / 10 : 0}%)`,
      valueClass: "text-[#1e3a8a]", note: "Kehadiran konsisten sepanjang periode berjalan",
    },
    {
      label: "Perlu Pembinaan & Cukup", icon: "fa-solid fa-triangle-exclamation", iconClass: "text-red-500 bg-red-50",
      borderClass: "border-l-red-500", value: String(perluBimbingan + cukup), unit: "Pendidik Terindikasi",
      valueClass: "text-red-600",
      note: `${perluBimbingan} Perlu Bimbingan`,
      noteHighlight: cukup ? `\u2022 ${cukup} Cukup (Absen >10%)` : "",
    },
  ];

  return { summaryCards, guruRekap };
}

export function getDataForTA(taId, guruListParam) {
  const guruList = guruListParam && guruListParam.length ? guruListParam : MASTER_GURU;
  const guruMengajar = guruList.filter((g) => !JABATAN_NON_PENGAJAR.includes(g.jabatan));

  const [yearStr, semester] = taId.split("-");
  const year = Number(yearStr);
  const isGanjil = semester === "ganjil";
  const totalSesi = 8 + Math.floor(rand(taId, "totalSesi") * 4); // 8-11

  // ---------- DASHBOARD (per periode: minggu / bulan / 3 bulan / semester) ----------
  const dashboardByPeriod = {};
  const periodRanges = {};
  PERIODE_OPTIONS.forEach((p) => {
    const sesi = p.key === "semester" ? totalSesi : p.sesi;
    dashboardByPeriod[p.key] = buildDashboard(taId, p.key, sesi, yearStr, year, guruMengajar);
    periodRanges[p.key] = getPeriodRange(year, isGanjil, p.key);
  });

  // ---------- PRESENSI KEGIATAN ----------
  const AGENDA_POOL = isGanjil
    ? [
        { label: "IHT Hari 1", bulan: "Jul" },
        { label: "IHT Hari 2", bulan: "Jul" },
        { label: "Rapat Dinas Awal Semester", bulan: "Agu" },
        { label: "Maulid Nabi Muhammad SAW", bulan: "Sep" },
        { label: "Workshop Kurikulum", bulan: "Okt" },
      ]
    : [
        { label: "Rapat Evaluasi Semester", bulan: "Jan" },
        { label: "Workshop Asesmen", bulan: "Feb" },
        { label: "Peringatan Hari Kartini", bulan: "Apr" },
        { label: "Ujian Praktik Kejuruan", bulan: "Mei" },
        { label: "Raker Pleno Akhir Semester", bulan: "Jun" },
      ];

  const jumlahAgenda = 3 + Math.floor(rand(taId, "jumlahAgenda") * 2); // 3-4
  const tahunAgenda = isGanjil ? year : year + 1;
  const agendaBase = AGENDA_POOL.slice(0, jumlahAgenda).map((ag, idx) => ({
    key: `agenda-${idx}`,
    label: ag.label.toUpperCase(),
    namaAsli: ag.label,
    tanggal: `${10 + idx * 5} ${ag.bulan} ${tahunAgenda}`,
  }));

  const IZIN_REASONS = ["Izin acara keluarga", "Izin urusan dinas luar", "Izin sakit (ada surat keterangan)", "Izin kepentingan pribadi"];
  const ALPA_REASONS = ["Tanpa keterangan", "Belum konfirmasi ke Waka Kurikulum", "Berangkat tapi tidak mengisi presensi"];

  const guruEvent = guruList.map((g) => {
    const status = agendaBase.map((ag) => {
      if (g.struktural) return { value: "hadir", reason: "" };
      const r = rand(taId, `${g.id}-${ag.key}`);
      if (r < 0.07) {
        const reason = ALPA_REASONS[Math.floor(rand(taId, `${g.id}-${ag.key}-reason`) * ALPA_REASONS.length)];
        return { value: "alpa", reason };
      }
      if (r < 0.14) {
        const reason = IZIN_REASONS[Math.floor(rand(taId, `${g.id}-${ag.key}-reason`) * IZIN_REASONS.length)];
        return { value: "izin", reason };
      }
      return { value: "hadir", reason: "" };
    });
    return { id: g.id, no: g.id, nama: g.nama, nip: g.nip, jabatan: g.jabatan, status };
  });

  const agendaList = agendaBase.map((ag, idx) => {
    const hadir = guruEvent.filter((g) => g.status[idx].value === "hadir").length;
    const total = guruEvent.length;
    const persenNum = Math.round((hadir / total) * 1000) / 10;
    const tidakHadir = total - hadir;
    return {
      ...ag,
      hadir, total, persenNum,
      persen: tidakHadir === 0 ? "100% Hadir" : `${persenNum}% (${tidakHadir} Tidak Hadir)`,
      barClass: tidakHadir === 0 ? "bg-emerald-500" : persenNum >= 90 ? "bg-red-400" : "bg-red-500",
      textClass: tidakHadir === 0 ? "text-emerald-600" : persenNum >= 90 ? "text-red-500" : "text-red-600",
    };
  });

  const rekapPerAgenda = agendaList.map((ag) => ({
    hadir: ag.hadir, total: ag.total,
    note: ag.hadir === ag.total ? "100% Hadir" : `${ag.total - ag.hadir} Tidak Hadir`,
  }));

  const totalHadirPenuh = guruEvent.filter((g) => g.status.every((s) => s.value === "hadir")).length;
  const guruDenganAlpa = guruEvent.filter((g) => g.status.filter((s) => s.value === "alpa").length >= 1);
  const totalSlot = agendaList.reduce((sum, a) => sum + a.total, 0);
  const totalHadirSlot = agendaList.reduce((sum, a) => sum + a.hadir, 0);
  const overallHadirPersen = totalSlot > 0 ? Math.round((totalHadirSlot / totalSlot) * 1000) / 10 : 0;

  const eventSummary = [
    {
      label: "Tingkat Kehadiran Event", icon: "fa-solid fa-person-chalkboard", iconBoxClass: "bg-emerald-700 text-white",
      borderClass: "border-l-emerald-500", value: `${overallHadirPersen}%`,
      valueClass: overallHadirPersen >= 90 ? "text-emerald-600" : "text-amber-600",
      note: "Target Sekolah: \u2265 90.0%",
    },
    {
      label: "Agenda Terjadwal", icon: "fa-regular fa-calendar-check", iconClass: "text-blue-500",
      borderClass: "border-l-blue-400", value: String(agendaList.length), unit: "Agenda Resmi", valueClass: "text-slate-800",
      note: `${agendaBase.map((a) => a.namaAsli).join(", ")}\nStatus: Berjalan Sesuai Kalender`,
    },
    {
      label: "Disiplin Penuh (100%)", icon: "fa-solid fa-award", iconClass: "text-[#1e3a8a]",
      borderClass: "border-l-[#1e3a8a]", value: String(totalHadirPenuh), unit: `/ ${guruEvent.length} Guru Inti`,
      valueClass: "text-[#1e3a8a]",
      note: `${Math.round((totalHadirPenuh / guruEvent.length) * 1000) / 10}% tenaga pendidik tertib\nPresensi nihil absen di ${agendaList.length} agenda`,
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

  // ---------- KETIDAKHADIRAN ----------
  const MAPEL_POOL = ["DDRPL", "BTQ", "BK", "Matematika", "PJOK", "Bahasa Inggris", "Akuntansi & Keuangan", "PAI", "Bahasa Indonesia"];
  const KELAS_POOL = ["X RPL", "X TKJ", "X DKV", "X KKR", "XI TKJ", "XI RPL", "XII AKL", "X Gabungan"];
  const HARI_POOL = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

  const jumlahInsiden = 6 + Math.floor(rand(taId, "jumlahInsiden") * 4); // 6-9
  const nonStruktural = guruMengajar.filter((g) => !g.struktural);

  const daftarKetidakhadiran = nonStruktural.length === 0 ? [] : Array.from({ length: jumlahInsiden }).map((_, idx) => {
    const g = nonStruktural[Math.floor(rand(taId, `insiden-${idx}-guru`) * nonStruktural.length)];
    const kodeR = rand(taId, `insiden-${idx}-kode`);
    const kode = kodeR < 0.5 ? "S" : kodeR < 0.8 ? "I" : kodeR < 0.9 ? "D" : "A";
    const jumlahKelas = 1 + Math.floor(rand(taId, `insiden-${idx}-jmlkelas`) * 2);
    const kelasSet = new Set();
    for (let k = 0; k < jumlahKelas; k++) {
      kelasSet.add(KELAS_POOL[Math.floor(rand(taId, `insiden-${idx}-kelas-${k}`) * KELAS_POOL.length)]);
    }
    const bulanNum = isGanjil ? 7 + (idx % 4) : 1 + (idx % 4);
    const tahunTanggal = isGanjil ? year : year + 1;
    return {
      no: idx + 1,
      guru_id: g.id,
      nama: g.nama,
      mapel: g.mapel || MAPEL_POOL[Math.floor(rand(taId, `insiden-${idx}-mapel`) * MAPEL_POOL.length)],
      hari: HARI_POOL[Math.floor(rand(taId, `insiden-${idx}-hari`) * HARI_POOL.length)],
      tanggal: `${String((idx % 27) + 1).padStart(2, "0")}/${String(bulanNum).padStart(2, "0")}/${tahunTanggal}`,
      jam: `Jam ${1 + (idx % 3)} - ${3 + (idx % 4)}`,
      kelas: Array.from(kelasSet),
      status: kode,
    };
  });

  const ketidakhadiranSummary = [
    { label: "Total Insiden", icon: "fa-regular fa-clipboard", iconClass: "text-blue-500", borderClass: "border-l-blue-600", value: String(daftarKetidakhadiran.length), unit: "Catatan", note: `Periode TA ${yearStr}/${year + 1} \u2022 ${semester}` },
    { label: "Guru Sakit (S)", icon: "fa-solid fa-briefcase-medical", iconClass: "text-amber-500", borderClass: "border-l-amber-500", value: String(daftarKetidakhadiran.filter((d) => d.status === "S").length), unit: "Kasus", note: "Rekap otomatis dari jurnal harian" },
    { label: "Guru Izin (I)", icon: "fa-regular fa-calendar-minus", iconClass: "text-blue-500", borderClass: "border-l-blue-400", value: String(daftarKetidakhadiran.filter((d) => d.status === "I").length), unit: "Kasus", note: "Kepentingan dinas & keluarga" },
    { label: "Guru Alpa (A)", icon: "fa-solid fa-user-xmark", iconClass: "text-red-500", borderClass: "border-l-red-500", value: String(daftarKetidakhadiran.filter((d) => d.status === "A").length), unit: "Kasus", note: "Perlu tindak lanjut Waka Kurikulum" },
    { label: "Dinas Luar (D)", icon: "fa-solid fa-briefcase", iconClass: "text-purple-500", borderClass: "border-l-purple-500", value: String(daftarKetidakhadiran.filter((d) => d.status === "D").length), unit: "Kasus", note: "Tugas / undangan dinas resmi" },
  ];

  return {
    taId,
    tahun: `${yearStr}/${year + 1}`,
    semester,
    guruList,
    dashboard: dashboardByPeriod.semester,
    dashboardByPeriod,
    periodRanges,
    event: { summaryCards: eventSummary, agendaList, guruEvent, rekapPerAgenda },
    ketidakhadiran: { summaryCards: ketidakhadiranSummary, daftarKetidakhadiran },
  };
}
