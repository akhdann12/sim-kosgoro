"use client";

import { useState } from "react";

const HEADER_HINTS = ["Nama Guru", "Mata Pelajaran", "Hari", "Tanggal", "Jam Ke", "Kelas", "Kode", "Guru Pengganti", "Catatan"];

const FIELD_MAP = {
  namaguru: "nama",
  nama: "nama",
  matapelajaran: "mapel",
  mapel: "mapel",
  hari: "hari",
  tanggal: "tanggal",
  jamke: "jam",
  jam: "jam",
  kelas: "kelas",
  kode: "status",
  status: "status",
  gurupengganti: "pengganti",
  pengganti: "pengganti",
  inval: "pengganti",
  catatan: "catatan",
  keterangan: "catatan",
};

function normalizeKey(k) {
  return String(k).toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function ExcelSyncPanel({ onImport }) {
  const [showInfo, setShowInfo] = useState(false);
  const [status, setStatus] = useState(null); // { type: "success" | "error", message }
  const [loading, setLoading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus(null);

    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!rawRows.length) {
        throw new Error("File kosong atau format tidak terbaca");
      }

      const mapped = rawRows.map((row, idx) => {
        const norm = {};
        Object.entries(row).forEach(([k, v]) => {
          const field = FIELD_MAP[normalizeKey(k)];
          if (field) norm[field] = v;
        });

        let tanggal = norm.tanggal;
        if (tanggal instanceof Date) {
          tanggal = tanggal.toLocaleDateString("id-ID");
        } else if (tanggal) {
          tanggal = String(tanggal);
        }

        const kodeRaw = String(norm.status || "A").trim().toUpperCase().charAt(0);
        const kode = ["S", "I", "A", "D"].includes(kodeRaw) ? kodeRaw : "A";

        return {
          no: idx + 1,
          nama: norm.nama || "Tanpa Nama",
          mapel: norm.mapel || "-",
          hari: norm.hari || "-",
          tanggal: tanggal || "-",
          jam: norm.jam || "-",
          kelas: norm.kelas
            ? String(norm.kelas).split(",").map((k) => k.trim()).filter(Boolean)
            : ["-"],
          status: kode,
          pengganti: norm.pengganti || "",
          catatan: norm.catatan || "",
        };
      });

      onImport(mapped);
      setStatus({ type: "success", message: `${mapped.length} baris berhasil disinkronkan dari "${file.name}".` });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Gagal membaca file. Cek lagi format kolomnya sesuai panduan di bawah." });
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm mb-6">
      <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center shrink-0">
            <i className="fa-solid fa-file-excel"></i>
          </div>
          <div>
            <h4 className="font-bold text-slate-700 text-sm">Sinkronisasi dari Excel</h4>
            <p className="text-[10px] text-slate-500">Upload file Excel ketidakhadiran yang biasa dipakai, datanya otomatis masuk ke tabel di bawah</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => setShowInfo((v) => !v)} className="text-[11px] text-blue-600 hover:underline whitespace-nowrap">
            {showInfo ? "Tutup panduan" : "Cara menyambungkan Excel"}
          </button>
          <label className="cursor-pointer text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded shadow-sm flex items-center whitespace-nowrap">
            <i className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-upload"} mr-2`}></i> {loading ? "Membaca..." : "Upload & Sync"}
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} disabled={loading} />
          </label>
        </div>
      </div>

      {status && (
        <div className={`px-4 pb-3 text-[11px] ${status.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
          <i className={`fa-solid ${status.type === "success" ? "fa-circle-check" : "fa-circle-exclamation"} mr-1`}></i>
          {status.message}
        </div>
      )}

      {showInfo && (
        <div className="border-t border-slate-100 p-4 text-[11px] text-slate-600 space-y-3 bg-slate-50/50 rounded-b-lg">
          <div>
            <p className="font-bold text-slate-700 mb-1">1. Format kolom Excel yang wajib ada (baris pertama = header):</p>
            <div className="flex flex-wrap gap-1.5">
              {HEADER_HINTS.map((h) => (
                <span key={h} className="bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">{h}</span>
              ))}
            </div>
            <p className="mt-1 text-slate-400">
              Kolom <b>Kode</b> isinya S (Sakit) / I (Izin) / A (Alpa) / D (Dinas Luar). Kolom <b>Kelas</b> boleh lebih dari
              satu, pisahkan dengan koma (contoh: "X RPL, XI TKJ").
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">2. Sinkron manual (sekarang, langsung di browser):</p>
            <p>
              Klik <b>Upload & Sync</b> di atas, pilih file Excel yang biasa dipakai buat catat guru yang gak hadir.
              Begitu file dipilih, seluruh datanya otomatis kebaca dan masuk ke tabel — tinggal upload ulang file yang
              sama kapan pun ada perubahan di Excel-nya.
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">3. Biar otomatis tanpa upload manual (perlu backend Laravel aktif):</p>
            <p>
              Simpan file Excel itu di folder yang tersinkron ke server (misalnya folder Google Drive/OneDrive yang
              di-mount ke server, atau folder network drive sekolah). Backend udah disiapin command{" "}
              <code className="bg-white px-1 rounded border border-slate-200">php artisan sync:ketidakhadiran-excel</code>{" "}
              yang baca file itu dan update database. Jadwalkan command ini jalan otomatis tiap beberapa menit lewat
              scheduler Laravel (<code className="bg-white px-1 rounded border border-slate-200">routes/console.php</code>{" "}
              + cron <code className="bg-white px-1 rounded border border-slate-200">* * * * * php artisan schedule:run</code>)
              — jadi begitu file Excel di folder itu diubah, paling lama nunggu jadwal berikutnya, data di sistem ini
              ikutan update sendiri tanpa perlu upload manual lagi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
