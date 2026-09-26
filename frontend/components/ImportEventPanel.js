"use client";

import { useState } from "react";
import { apiUploadFile, apiPost } from "@/lib/api";

const HEADER_HINTS = ["Nama Guru", "Jabatan", "(kolom-kolom kegiatan berisi status Hadir/Alpa/Izin/Sakit)"];

export default function ImportEventPanel({ onImported }) {
  const [showInfo, setShowInfo] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Hasil parse format MATRIX yang masih nunggu tanggal per kolom kegiatan diisi user
  // (sheet aslinya emang gak punya kolom tanggal, cuma nama kegiatan/hari) sebelum bisa disimpan.
  const [pending, setPending] = useState(null); // { columns, guru, tanggalPerKolom }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus(null);
    setPending(null);

    try {
      const res = await apiUploadFile("/kegiatan/parse", file);

      if (res.type === "flat") {
        setStatus({
          type: "success",
          message: `${res.ditambah} agenda baru ditambahkan${res.dilewati ? `, ${res.dilewati} dilewati (sudah ada)` : ""} dari "${file.name}".`,
        });
        onImported?.();
        return;
      }

      // type === "matrix": tampilkan form kecil buat isi tanggal per kolom kegiatan yang kedeteksi
      setPending({
        fileName: file.name,
        columns: res.columns,
        guru: res.guru,
        namaTidakKetemu: res.nama_tidak_ketemu || [],
        tanggalPerKolom: res.columns.map(() => ""),
      });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: err.message || "Gagal membaca file. Cek format kolomnya di panduan." });
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  function handleUbahTanggal(idx, value) {
    setPending((p) => {
      const tanggalPerKolom = [...p.tanggalPerKolom];
      tanggalPerKolom[idx] = value;
      return { ...p, tanggalPerKolom };
    });
  }

  async function handleKonfirmasi() {
    if (!pending) return;
    if (pending.tanggalPerKolom.some((t) => !t)) {
      setStatus({ type: "error", message: "Isi dulu tanggal buat semua kegiatan yang kedeteksi sebelum disimpan." });
      return;
    }

    setSaving(true);
    setStatus(null);
    try {
      const kegiatan = pending.columns.map((nama, idx) => ({ nama, tanggal: pending.tanggalPerKolom[idx] }));
      const res = await apiPost("/kegiatan/import-matrix", { kegiatan, guru: pending.guru });
      setStatus({
        type: "success",
        message: `${res.kegiatan_dibuat} agenda & ${res.kehadiran_disimpan} catatan kehadiran tersimpan dari "${pending.fileName}".`,
      });
      setPending(null);
      onImported?.();
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: err.message || "Gagal menyimpan. Coba lagi." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm mb-6">
      <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded flex items-center justify-center shrink-0">
            <i className="fa-solid fa-file-import"></i>
          </div>
          <div>
            <h4 className="font-bold text-slate-700 text-sm">Import Jurnal Kehadiran dari Excel</h4>
            <p className="text-[10px] text-slate-500">
              Upload file "Jurnal & Log Kehadiran Guru Per Kegiatan" (format asli sekolah: guru x kegiatan, isinya
              status Hadir/Alpa/Izin/Sakit langsung).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => setShowInfo((v) => !v)} className="text-[11px] text-blue-600 hover:underline whitespace-nowrap">
            {showInfo ? "Tutup panduan" : "Lihat format yang dibutuhkan"}
          </button>
          <label className="cursor-pointer text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded shadow-sm flex items-center whitespace-nowrap">
            <i className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-upload"} mr-2`}></i> {loading ? "Membaca..." : "Import File"}
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} disabled={loading} />
          </label>
        </div>
      </div>

      {pending && (
        <div className="border-t border-slate-100 p-4 bg-amber-50/40">
          <p className="text-xs font-semibold text-slate-700 mb-1">
            <i className="fa-solid fa-calendar-days text-amber-500 mr-1.5"></i>
            File ini gak punya kolom tanggal - isi tanggal buat tiap kegiatan yang kedeteksi ({pending.columns.length} kegiatan, {pending.guru.length} guru cocok):
          </p>
          <div className="grid sm:grid-cols-2 gap-2 my-3">
            {pending.columns.map((nama, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white border border-slate-200 rounded px-2 py-1.5">
                <span className="text-[11px] text-slate-600 flex-1 truncate" title={nama}>{nama}</span>
                <input
                  type="date"
                  required
                  value={pending.tanggalPerKolom[idx]}
                  onChange={(e) => handleUbahTanggal(idx, e.target.value)}
                  className="text-[11px] bg-slate-50 border border-slate-200 rounded py-1 px-1.5 outline-none focus:border-blue-300"
                />
              </div>
            ))}
          </div>
          {pending.namaTidakKetemu.length > 0 && (
            <p className="text-[11px] text-amber-700 mb-2">
              <i className="fa-solid fa-triangle-exclamation mr-1"></i>
              {pending.namaTidakKetemu.length} nama guru gak ketemu di Data Master Guru, dilewati: {pending.namaTidakKetemu.slice(0, 5).join(", ")}
              {pending.namaTidakKetemu.length > 5 ? ", ..." : ""}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => setPending(null)} className="px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-white rounded border border-slate-200">
              Batal
            </button>
            <button
              onClick={handleKonfirmasi}
              disabled={saving}
              className="px-4 py-1.5 text-[11px] font-medium text-white bg-amber-600 hover:bg-amber-700 rounded shadow-sm disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan & Import"}
            </button>
          </div>
        </div>
      )}

      {status && (
        <div className={`px-4 pb-3 text-[11px] ${status.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
          <i className={`fa-solid ${status.type === "success" ? "fa-circle-check" : "fa-circle-exclamation"} mr-1`}></i>
          {status.message}
        </div>
      )}

      {showInfo && (
        <div className="border-t border-slate-100 p-4 text-[11px] text-slate-600 space-y-3 bg-slate-50/50 rounded-b-lg">
          <div>
            <p className="font-bold text-slate-700 mb-1">Format yang didukung (persis kaya sheet "Jurnal & Log Kehadiran Guru Per Kegiatan"):</p>
            <p className="mb-2">
              Baris header punya kolom <b>No</b>, <b>Nama Guru</b>, <b>Jabatan</b>, lalu kolom-kolom kegiatan
              (boleh berkelompok, misal "IHT" punya sub-kolom "Hari 1"/"Hari 2"). Isi tiap kolom kegiatan langsung
              status: <b>Hadir</b>, <b>Alpa</b>, <b>Izin</b>, atau <b>Sakit</b> - satu baris per guru.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {HEADER_HINTS.map((h) => (
                <span key={h} className="bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">{h}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">Karena sheet ini gak punya kolom tanggal:</p>
            <p>
              Sesudah file kebaca, sistem bakal minta kamu isi tanggal buat tiap kegiatan yang kedeteksi (contoh:
              "IHT - Hari 1", "MAULID") lewat form kecil sebelum datanya disimpan.
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">Format file:</p>
            <p>
              File <b>.csv</b> langsung bisa dipakai tanpa syarat apapun. File <b>.xlsx/.xls</b> asli Excel butuh
              satu package tambahan di server (kalau belum ke-install, sistem bakal kasih tau lewat pesan error
              yang jelas) - kalau lagi kepentok itu, cara paling gampang: buka file-nya di Google Sheets/Excel,
              lalu <b>File &gt; Download &gt; Comma Separated Values (.csv)</b>, upload hasil download-nya ke sini.
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">Otomatis kehitung di Dashboard:</p>
            <p>
              Guru yang statusnya Izin/Sakit/Alpa di kegiatan manapun otomatis ikut mengurangi persentase
              kehadirannya di Dashboard Utama - gak perlu diinput ulang secara terpisah.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
