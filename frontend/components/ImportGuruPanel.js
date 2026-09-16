"use client";

import { useState } from "react";

const HEADER_HINTS = ["No", "NIP / ID", "Nama Lengkap Guru", "Jabatan / Mapel"];

const FIELD_MAP = {
  no: "no",
  nipid: "nip",
  nip: "nip",
  id: "nip",
  namalengkapguru: "nama",
  namalengkap: "nama",
  nama: "nama",
  jabatanmapel: "jabatan",
  jabatan: "jabatan",
  mapel: "jabatan",
};

function normalizeKey(k) {
  return String(k).toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function ImportGuruPanel({ onImport }) {
  const [showInfo, setShowInfo] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus(null);

    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!rawRows.length) throw new Error("File kosong atau format tidak terbaca");

      const mapped = rawRows
        .map((row) => {
          const norm = {};
          Object.entries(row).forEach(([k, v]) => {
            const field = FIELD_MAP[normalizeKey(k)];
            if (field) norm[field] = String(v).trim();
          });
          return { nama: norm.nama || "", jabatan: norm.jabatan || "", nip: norm.nip || "" };
        })
        .filter((r) => r.nama);

      if (!mapped.length) {
        throw new Error('Gak nemu kolom "Nama Lengkap Guru" yang valid di file ini.');
      }

      const { added, updated } = onImport(mapped);
      setStatus({
        type: "success",
        message: `${added} guru baru ditambahkan${updated ? `, ${updated} data diperbarui` : ""} dari "${file.name}".`,
      });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: err.message || "Gagal membaca file. Cek format kolomnya di panduan." });
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
            <i className="fa-solid fa-file-import"></i>
          </div>
          <div>
            <h4 className="font-bold text-slate-700 text-sm">Import Data Master Guru</h4>
            <p className="text-[10px] text-slate-500">Upload file Excel/CSV, datanya otomatis ditambahkan atau diperbarui di daftar bawah</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => setShowInfo((v) => !v)} className="text-[11px] text-blue-600 hover:underline whitespace-nowrap">
            {showInfo ? "Tutup panduan" : "Lihat format yang dibutuhkan"}
          </button>
          <label className="cursor-pointer text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded shadow-sm flex items-center whitespace-nowrap">
            <i className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-upload"} mr-2`}></i> {loading ? "Membaca..." : "Import File"}
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
            <p className="font-bold text-slate-700 mb-1">Struktur kolom yang dibutuhkan (baris pertama = header):</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {HEADER_HINTS.map((h) => (
                <span key={h} className="bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">{h}</span>
              ))}
            </div>
            <p className="text-slate-400">
              Persis kaya file rekap data guru yang biasa dipakai: kolom <b>No</b> boleh ada boleh gak (diabaikan sistem),
              kolom <b>NIP / ID</b> boleh dikosongin, yang wajib cuma <b>Nama Lengkap Guru</b> dan{" "}
              <b>Jabatan / Mapel</b> (contoh isinya: "Guru Mapel", "Kepala Sekolah", "Waka. Bid. Kurikulum",
              "Tenaga Administrasi", dst).
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">Cara kerja import-nya:</p>
            <p>
              Kalau nama guru di file udah ada di sistem, datanya (jabatan/NIP) akan di-update. Kalau namanya belum
              ada, otomatis ditambahkan sebagai guru baru dengan ID internal sendiri. Jadi file yang sama bisa
              di-import ulang kapan aja buat sinkronin perubahan, tanpa bikin data dobel.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
