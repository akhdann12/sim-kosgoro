"use client";

import { useEffect, useRef, useState } from "react";
import { apiUploadFile, apiGet } from "@/lib/api";
import { useNotifications } from "@/lib/context/NotificationContext";

// spreadsheet URL -> { sheetId, gid }
function parseSheetUrl(url) {
  const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const gidMatch = url.match(/[?&#]gid=([0-9]+)/);
  if (!idMatch) return null;
  return { sheetId: idMatch[1], gid: gidMatch ? gidMatch[1] : "0" };
}

function formatTanggalID(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const POLL_INTERVAL_MS = 60000; // cek perubahan tiap 60 detik selama sheet ini tersambung

// Sama kaya sinkronisasi ketidakhadiran sebelumnya: link bisa "ditanam" lewat env var biar
// otomatis konek begitu halaman dibuka, gak perlu paste manual tiap kali.
// Set NEXT_PUBLIC_ABSEN_PIKET_SHEET_URL di .env.local / Environment Variables Vercel.
const DEFAULT_SHEET_URL = process.env.NEXT_PUBLIC_ABSEN_PIKET_SHEET_URL || "";

// Link yang di-paste user sendiri (bukan lewat env var) "nempel" otomatis lewat localStorage -
// begitu tersambung sekali, gak perlu paste ulang tiap buka/refresh halaman ini lagi.
const STORAGE_KEY = "sim_kosgoro_absen_piket_sheet_url";

function Ringkasan({ r }) {
  if (!r) return null;
  return (
    <div className="px-4 pb-3 text-[11px] text-slate-600 space-y-1">
      <p>
        <i className="fa-solid fa-table-cells mr-1.5 text-slate-400"></i>
        {r.total_kolom_tanggal} kolom tanggal terbaca &bull; {r.total_baris_guru} baris guru dipindai.
      </p>
      <p className="text-emerald-600 font-medium">
        <i className="fa-solid fa-wand-magic-sparkles mr-1.5"></i>
        {r.tertolong_dari_keterangan} entri berhasil "ditembak" otomatis dari teks bebas kolom Keterangan (guru
        nulis di situ, bukan di cell dropdown tanggalnya).
      </p>
      {r.nama_tidak_ketemu?.length > 0 && (
        <p className="text-amber-600">
          <i className="fa-solid fa-triangle-exclamation mr-1.5"></i>
          {r.nama_tidak_ketemu.length} nama baris di kolom "Nama Guru" gak ketemu di Data Master Guru: {r.nama_tidak_ketemu.slice(0, 5).join(", ")}
          {r.nama_tidak_ketemu.length > 5 ? ", ..." : ""}
        </p>
      )}
    </div>
  );
}

export default function GridKetidakhadiranImportPanel({ onImport }) {
  const { addNotification } = useNotifications();
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [ringkasan, setRingkasan] = useState(null);

  const [sheetUrlInput, setSheetUrlInput] = useState(DEFAULT_SHEET_URL);
  const [connection, setConnection] = useState(null); // { sheetId, gid }
  const [showManualForm, setShowManualForm] = useState(!DEFAULT_SHEET_URL);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const lastMapRef = useRef(null); // Map("guruId|tanggal" -> hash) dari sync terakhir, buat deteksi data baru
  const intervalRef = useRef(null);

  async function fetchAndApply({ silent = false } = {}) {
    if (!connection) return;
    if (!silent) setLoading(true);
    try {
      const res = await apiGet("/ketidakhadiran/dari-spreadsheet-grid", { sheet_id: connection.sheetId, gid: connection.gid });
      const rows = res.data || [];

      // Deteksi baris yang BENERAN baru/berubah dibanding sync sebelumnya, biar notifikasinya
      // spesifik nyebutin tanggal berapa aja yang nambah data - bukan cuma "ada perubahan".
      const newMap = new Map();
      const tanggalBaru = new Set();
      let jumlahBaru = 0;
      rows.forEach((row) => {
        const key = `${row.guru_id}|${row.tanggal}`;
        const hash = `${row.kode}|${row.jam_ke || ""}|${row.catatan || ""}`;
        newMap.set(key, hash);
        if (lastMapRef.current && lastMapRef.current.get(key) !== hash) {
          jumlahBaru++;
          tanggalBaru.add(row.tanggal);
        }
      });

      const isFirstLoad = lastMapRef.current === null;
      lastMapRef.current = newMap;
      setLastSyncAt(new Date());

      if (!isFirstLoad && jumlahBaru > 0) {
        const daftarTanggal = Array.from(tanggalBaru).sort().map(formatTanggalID);
        addNotification({
          title: "Absen Piket: Ada Data Baru",
          message: `${jumlahBaru} catatan ketidakhadiran baru/berubah dari Absen Piket untuk tanggal: ${daftarTanggal.join(", ")}.`,
        });
      }

      onImport?.();

      let message = `Tersambung \u2022 ${rows.length} baris tersimpan ke database.`;
      let type = "success";
      if (res.ringkasan?.nama_tidak_ketemu?.length) {
        type = "warning";
      }
      setStatus({ type, message });
      setRingkasan(res.ringkasan);
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: err.message || "Gagal mengambil data dari spreadsheet." });
    } finally {
      if (!silent) setLoading(false);
    }
  }

  function handleConnect(e) {
    e.preventDefault();
    const parsed = parseSheetUrl(sheetUrlInput.trim());
    if (!parsed) {
      setStatus({ type: "error", message: "Link Google Spreadsheet tidak valid." });
      return;
    }
    lastMapRef.current = null;
    setConnection(parsed);
    try {
      localStorage.setItem(STORAGE_KEY, sheetUrlInput.trim());
    } catch (err) {
      console.error(err);
    }
  }

  function handleDisconnect() {
    setConnection(null);
    setLastSyncAt(null);
    setStatus(null);
    setRingkasan(null);
    setShowManualForm(true);
    lastMapRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error(err);
    }
  }

  // Auto-connect: prioritas link yang PERNAH di-paste user sendiri (nempel di localStorage),
  // baru kalau belum pernah ada, pakai default dari env var (kalau di-set developer).
  useEffect(() => {
    if (connection) return;
    let urlTersimpan = null;
    try {
      urlTersimpan = localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      console.error(err);
    }
    const sumberUrl = urlTersimpan || DEFAULT_SHEET_URL;
    if (sumberUrl) {
      const parsed = parseSheetUrl(sumberUrl);
      if (parsed) {
        setSheetUrlInput(sumberUrl);
        lastMapRef.current = null;
        setConnection(parsed);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Begitu tersambung: langsung sync + polling tiap 60 detik selama halaman ini dibuka
  useEffect(() => {
    if (!connection) return;
    fetchAndApply();
    intervalRef.current = setInterval(() => fetchAndApply({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setStatus(null);
    setRingkasan(null);
    try {
      const res = await apiUploadFile("/ketidakhadiran/import-grid", file);
      setStatus({ type: "success", message: `${res.synced} catatan ketidakhadiran tersimpan dari "${file.name}".` });
      setRingkasan(res.ringkasan);
      if (res.ringkasan?.tertolong_dari_keterangan > 0) {
        addNotification({
          title: "Absen Piket: Ada Data Baru",
          message: `${res.ringkasan.tertolong_dari_keterangan} catatan ketidakhadiran ke-deteksi otomatis dari kolom Keterangan file "${file.name}".`,
        });
      }
      onImport?.();
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: err.message || "Gagal membaca file. Cek lagi struktur sheet-nya." });
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm mb-6">
      <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${connection ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"}`}>
            <i className="fa-solid fa-table-list"></i>
          </div>
          <div>
            <h4 className="font-bold text-slate-700 text-sm flex items-center flex-wrap gap-2">
              Import Rekap Absensi Piket (Format Asli Sekolah)
              {connection && <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded uppercase">Live Sync Aktif</span>}
            </h4>
            <p className="text-[10px] text-slate-500">
              {connection
                ? `Otomatis dicek tiap 1 menit \u2022 ${lastSyncAt ? `terakhir dicek ${lastSyncAt.toLocaleTimeString("id-ID")}` : "menyambungkan..."}`
                : 'Upload file Excel/spreadsheet "Absensi Piket" (guru x tanggal). Catatan yang cuma ditulis guru di kolom Keterangan bebas teks tetap otomatis ke-deteksi & ke-simpan ke tanggal yang tepat.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => setShowInfo((v) => !v)} className="text-[11px] text-blue-600 hover:underline whitespace-nowrap">
            {showInfo ? "Tutup panduan" : "Cara pakai"}
          </button>
          {connection && (
            <button
              type="button"
              onClick={() => fetchAndApply()}
              disabled={loading}
              className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded flex items-center whitespace-nowrap"
            >
              <i className={`fa-solid fa-rotate mr-1.5 ${loading ? "fa-spin" : ""}`}></i> Sync Sekarang
            </button>
          )}
          <label className="cursor-pointer text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow-sm flex items-center whitespace-nowrap">
            <i className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-upload"} mr-2`}></i> {loading ? "Memproses..." : "Upload Excel"}
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} disabled={loading} />
          </label>
        </div>
      </div>

      {!connection && showManualForm ? (
        <form onSubmit={handleConnect} className="px-4 pb-4 flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            required
            placeholder="Tempel link Google Spreadsheet 'Absensi Piket' (harus di-share: Anyone with the link)"
            value={sheetUrlInput}
            onChange={(e) => setSheetUrlInput(e.target.value)}
            className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none focus:border-blue-300"
          />
          <button type="submit" className="text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow-sm whitespace-nowrap">
            <i className="fa-solid fa-link mr-1.5"></i> Sambungkan
          </button>
        </form>
      ) : connection ? (
        <div className="px-4 pb-4 flex items-center gap-3">
          <button onClick={handleDisconnect} className="text-[11px] text-red-500 hover:underline">
            <i className="fa-solid fa-unlink mr-1"></i> Putuskan sambungan
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={() => { handleDisconnect(); setShowManualForm(true); }}
            className="text-[11px] text-blue-600 hover:underline"
          >
            <i className="fa-solid fa-pen mr-1"></i> Ganti link spreadsheet
          </button>
        </div>
      ) : (
        <div className="px-4 pb-2">
          <button type="button" onClick={() => setShowManualForm(true)} className="text-[11px] text-blue-600 hover:underline">
            <i className="fa-solid fa-link mr-1"></i> Atau sambungkan ke Google Spreadsheet (live sync otomatis)
          </button>
        </div>
      )}

      {status && (
        <div className={`px-4 pb-2 text-[11px] ${status.type === "success" ? "text-emerald-600" : status.type === "warning" ? "text-amber-600" : "text-red-500"}`}>
          <i className={`fa-solid ${status.type === "success" ? "fa-circle-check" : status.type === "warning" ? "fa-triangle-exclamation" : "fa-circle-exclamation"} mr-1`}></i>
          {status.message}
        </div>
      )}
      <Ringkasan r={ringkasan} />

      {showInfo && (
        <div className="border-t border-slate-100 p-4 text-[11px] text-slate-600 space-y-3 bg-slate-50/50 rounded-b-lg">
          <div>
            <p className="font-bold text-slate-700 mb-1">Format sheet yang didukung (persis seperti "Absensi Piket" yang biasa dipakai):</p>
            <p>
              Baris header berisi kolom <b>No</b>, <b>Nama Guru</b>, lalu kolom-kolom <b>tanggal</b> (boleh format
              dd/mm/yyyy atau teks seperti "29 Juli 2026"). Di bawahnya, satu baris per guru, cell dropdown diisi
              jumlah jam gak hadir. Di paling bawah ada baris <b>Keterangan</b> - catatan bebas per tanggal.
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">Kenapa ini penting:</p>
            <p>
              Kalau guru nulis ketidakhadirannya di kolom Keterangan ("Bu Holilah tidak masuk 3 jam") dan LUPA isi
              cell dropdown di baris & kolom tanggalnya, sistem tetap otomatis nyari nama guru itu, cocokin ke
              tanggal kolom Keterangan-nya, dan nyimpen catatan ketidakhadirannya ke tanggal & guru yang tepat.
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">Kalau ada guru "inval" (menggantikan guru lain):</p>
            <p>
              Pola "X inval Y" (misal "Furqon inval bu laras 2 jam") otomatis dibaca sebagai: <b>Bu Laras</b> yang
              tidak hadir, <b>Furqon</b> tercatat sebagai guru pengganti.
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">Format file upload:</p>
            <p>
              File <b>.csv</b> langsung bisa dipakai tanpa syarat apapun. File <b>.xlsx/.xls</b> asli Excel butuh
              satu package tambahan di server - kalau belum ke-install, gampangnya: buka file-nya di Google
              Sheets/Excel, <b>File &gt; Download &gt; Comma Separated Values (.csv)</b>, upload hasil download-nya.
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">Sambungkan ke Google Spreadsheet buat live sync:</p>
            <p>
              Share tab spreadsheet-nya sebagai "Anyone with the link", copy link tab tersebut (harus ada
              <code className="bg-white px-1 rounded border border-slate-200 mx-1">#gid=xxxxxxxx</code>
              di belakangnya), tempel di kolom di atas. Sistem otomatis ngecek ulang tiap 1 menit - begitu ada
              data baru, langsung kesimpen ke database dan muncul notifikasi lonceng di pojok kanan atas nyebutin
              tanggal berapa yang baru ditambahkan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
