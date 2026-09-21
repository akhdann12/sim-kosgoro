// Transformasi response GET /api/dashboard/rekap jadi bentuk yang dipakai tabel & summary card.

export function buildDashboardView(res) {
  const guruRekap = (res.data || []).map((g, idx) => {
    const persenNum = Number(g.persen) || 0;
    const problem = g.predikat === "Perlu Pembinaan";
    const caution = g.predikat === "Cukup";
    const jabatanStyle = /^Waka\./.test(g.jabatan) ? "navy" : /^Kepala/.test(g.jabatan) ? "blue" : undefined;

    return {
      id: g.guru_id, no: idx + 1, nama: g.nama, nip: g.nip, jabatan: g.jabatan, jabatanStyle,
      problem, caution,
      warning: problem
        ? `Di bawah ambang KBM (${persenNum.toFixed(1)}%)`
        : g.a >= 1
        ? `Akumulasi ${g.a} Alpa`
        : undefined,
      h: g.h, i: g.i, s: g.s, a: g.a, total: g.total,
      persen: `${persenNum.toFixed(1)}%`,
      predikat: g.predikat,
    };
  });

  const totalGuru = res.total_guru ?? guruRekap.length;
  const rataRata = res.rata_rata_kehadiran ?? 0;
  const sangatBaik = guruRekap.filter((g) => g.predikat === "Sangat Baik").length;
  const perluBimbingan = guruRekap.filter((g) => g.predikat === "Perlu Pembinaan").length;
  const cukup = guruRekap.filter((g) => g.predikat === "Cukup").length;

  const summaryCards = [
    {
      label: "Total Guru Terdaftar", icon: "fa-solid fa-user-group", iconClass: "text-blue-500 bg-blue-50",
      borderClass: "border-l-blue-600", value: String(totalGuru), unit: "Guru Aktif", valueClass: "text-slate-800",
      note: "Data langsung dari database",
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
