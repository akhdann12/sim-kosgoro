// Mapping response Ketidakhadiran dari backend (Eloquent model + relasi guru) ke bentuk row
// yang dipakai tabel di halaman Ketidakhadiran. Dipakai baik pas load awal dari database
// (GET /api/ketidakhadiran) maupun pas sinkronisasi Google Spreadsheet
// (GET /api/ketidakhadiran/dari-spreadsheet) - biar bentuknya konsisten di kedua jalur itu.
export function mapBackendRow(row, idx) {
  const tgl = row.tanggal ? new Date(row.tanggal) : null;
  const tanggalLabel = tgl && !isNaN(tgl) ? tgl.toLocaleDateString("id-ID") : row.tanggal || "-";
  return {
    no: idx + 1,
    nama: row.guru?.nama || "-",
    mapel: row.mapel || "-",
    hari: row.hari || "-",
    tanggal: tanggalLabel,
    jam: row.jam_ke || "-",
    kelas: Array.isArray(row.kelas) && row.kelas.length ? row.kelas : ["-"],
    status: row.kode || "A",
    pengganti: row.guru_pengganti || "",
    catatan: row.catatan || "",
  };
}
