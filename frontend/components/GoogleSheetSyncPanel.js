"use client";

import { useEffect, useRef, useState } from "react";
import { useNotifications } from "@/lib/context/NotificationContext";

const HEADER_HINTS = ["No", "Nama Guru", "Mata Pelajaran", "Hari", "Tanggal", "Jam Ke-", "Kelas", "Keterangan (S/I/A/D)", "Guru Pengganti / Tugas", "Keterangan"];

const FIELD_MAP = {
  namaguru: "nama",
  nama: "nama",
  matapelajaran: "mapel",
  mapel: "mapel",
  hari: "hari",
  tanggal: "tanggal",
  jamke: "jam",
  jamke_: "jam",
  jam: "jam",
  kelas: "kelas",
  keterangansiad: "status",
  keterangan: "status", // fallback kalau cuma ada 1 kolom "keterangan" buat kode S/I/A/D
  kode: "status",
  status: "status",
  gurupenggantitugas: "pengganti",
  gurupengganti: "pengganti",
  pengganti: "pengganti",
  inval: "pengganti",
  keternangan: "catatan", // toleransi typo umum di spreadsheet sekolah
  catatan: "catatan",
};

function normalizeKey(k) {
  return String(k).toLowerCase().replace(/[^a-z0-9]/g, "");
}

// spreadsheet URL -> { sheetId, gid }
function parseSheetUrl(url) {
  const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const gidMatch = url.match(/[?&#]gid=([0-9]+)/);
  if (!idMatch) return null;
  return { sheetId: idMatch[1], gid: gidMatch ? gidMatch[1] : "0" };
}

function buildCsvUrl({ sheetId, gid }) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
}

function mapRows(rawRows) {
  return rawRows
    .filter((row) => Object.values(row).some((v) => String(v).trim() !== ""))
    .map((row, idx) => {
      const norm = {};
      Object.entries(row).forEach(([k, v]) => {
        const field = FIELD_MAP[normalizeKey(k)];
        if (field && !(field in norm)) norm[field] = v; // kolom pertama yg cocok menang (biar "Keterangan" status gak ketimpa "Keterangan" catatan)
      });

      const kodeRaw = String(norm.status || "A").trim().toUpperCase().charAt(0);
      const kode = ["S", "I", "A", "D"].includes(kodeRaw) ? kodeRaw : "A";

      return {
        no: idx + 1,
        nama: norm.nama || "Tanpa Nama",
        mapel: norm.mapel || "-",
        hari: norm.hari || "-",
        tanggal: norm.tanggal || "-",
        jam: norm.jam || "-",
        kelas: norm.kelas ? String(norm.kelas).split(",").map((k) => k.trim()).filter(Boolean) : ["-"],
        status: kode,
        pengganti: norm.pengganti || "",
        catatan: norm.catatan || "",
      };
    });
}

const POLL_INTERVAL_MS = 60000; // cek perubahan tiap 60 detik selama "Live Sync" aktif

// Link spreadsheet bisa "ditanam" langsung di kode lewat env var, jadi gak perlu paste manual
// tiap kali. Set NEXT_PUBLIC_KETIDAKHADIRAN_SHEET_URL di .env.local / Environment Variables
// Vercel dengan link tab "ketidakhadiran guru" (klik tab-nya di Google Sheets, copy link
// dari address bar - harus ada "#gid=..." di belakangnya biar nunjuk ke tab yang benar).
const DEFAULT_SHEET_URL = process.env.NEXT_PUBLIC_KETIDAKHADIRAN_SHEET_URL || "";

export default function GoogleSheetSyncPanel({ onImport }) {
  const { addNotification } = useNotifications();
  const [sheetUrlInput, setSheetUrlInput] = useState(DEFAULT_SHEET_URL);
  const [connection, setConnection] = useState(null); // { sheetId, gid }
  const [showInfo, setShowInfo] = useState(false);
  const [showManualForm, setShowManualForm] = useState(!DEFAULT_SHEET_URL);
  const [status, setStatus] = useState(null); // { type, message }
  const [loading, setLoading] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const lastHashRef = useRef(null);
  const intervalRef = useRef(null);

  async function fetchAndApply({ silent = false } = {}) {
    if (!connection) return;
    if (!silent) setLoading(true);
    try {
      const Papa = (await import("papaparse")).default;
      const csvUrl = buildCsvUrl(connection);
      const res = await fetch(csvUrl, { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal mengambil data spreadsheet");
      const csvText = await res.text();

      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      const rows = mapRows(parsed.data);
      const hash = JSON.stringify(rows);

      if (hash !== lastHashRef.current) {
        const isFirstLoad = lastHashRef.current === null;
        lastHashRef.current = hash;
        onImport(rows);
        setLastSyncAt(new Date());

        if (!isFirstLoad) {
          addNotification({
            title: "Data Ketidakhadiran Diperbarui",
            message: `${rows.length} baris dari Google Spreadsheet berhasil disinkronkan ke sistem.`,
          });
        }
      } else {
        setLastSyncAt(new Date());
      }

      setStatus({ type: "success", message: `Tersambung \u2022 ${rows.length} baris terbaca dari spreadsheet.` });
    } catch (err) {
      console.error(err);
      setStatus({
        type: "error",
        message: 'Gagal mengambil data. Pastikan sheet dibagikan sebagai "Anyone with the link (Viewer)".',
      });
    } finally {
      if (!silent) setLoading(false);
    }
  }

  function handleConnect(e) {
    e.preventDefault();
    const parsed = parseSheetUrl(sheetUrlInput.trim());
    if (!parsed) {
      setStatus({ type: "error", message: "Link Google Spreadsheet tidak valid. Copy-paste langsung dari address bar." });
      return;
    }
    lastHashRef.current = null;
    setConnection(parsed);
  }

  function handleDisconnect() {
    setConnection(null);
    setLastSyncAt(null);
    setStatus(null);
    setShowManualForm(true);
    lastHashRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  // Auto-connect sekali di awal kalau ada default link yang ditanam lewat env var
  useEffect(() => {
    if (DEFAULT_SHEET_URL && !connection) {
      const parsed = parseSheetUrl(DEFAULT_SHEET_URL);
      if (parsed) {
        lastHashRef.current = null;
        setConnection(parsed);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // begitu connection kesambung, langsung sync + polling tiap 60 detik
  useEffect(() => {
    if (!connection) return;
    fetchAndApply();
    intervalRef.current = setInterval(() => fetchAndApply({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm mb-6">
      <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${connection ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
            <i className="fa-solid fa-table-cells"></i>
          </div>
          <div>
            <h4 className="font-bold text-slate-700 text-sm flex items-center flex-wrap gap-2">
              Sinkronisasi dari Google Spreadsheet
              {connection && (
                <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded uppercase">Live Sync Aktif</span>
              )}
            </h4>
            <p className="text-[10px] text-slate-500">
              {connection
                ? `Otomatis dicek tiap 1 menit \u2022 ${lastSyncAt ? `terakhir dicek ${lastSyncAt.toLocaleTimeString("id-ID")}` : "menyambungkan..."}`
                : "Tempel link spreadsheet ketidakhadiran, perubahan di sana langsung masuk ke sistem"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => setShowInfo((v) => !v)} className="text-[11px] text-blue-600 hover:underline whitespace-nowrap">
            {showInfo ? "Tutup panduan" : "Cara menyambungkan"}
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
        </div>
      </div>

      {!connection && showManualForm ? (
        <form onSubmit={handleConnect} className="px-4 pb-4 flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            required
            placeholder="Tempel link Google Spreadsheet di sini (harus di-share: Anyone with the link)"
            value={sheetUrlInput}
            onChange={(e) => setSheetUrlInput(e.target.value)}
            className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded py-2 px-3 outline-none focus:border-blue-300"
          />
          <button type="submit" className="text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded shadow-sm whitespace-nowrap">
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
            onClick={() => {
              handleDisconnect();
              setShowManualForm(true);
            }}
            className="text-[11px] text-blue-600 hover:underline"
          >
            <i className="fa-solid fa-pen mr-1"></i> Ganti link spreadsheet
          </button>
        </div>
      ) : null}

      {status && (
        <div className={`px-4 pb-3 text-[11px] ${status.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
          <i className={`fa-solid ${status.type === "success" ? "fa-circle-check" : "fa-circle-exclamation"} mr-1`}></i>
          {status.message}
        </div>
      )}

      {showInfo && (
        <div className="border-t border-slate-100 p-4 text-[11px] text-slate-600 space-y-3 bg-slate-50/50 rounded-b-lg">
          <div>
            <p className="font-bold text-slate-700 mb-1">1. Siapkan spreadsheet-nya:</p>
            <p>
              Buka Google Spreadsheet ketidakhadiran yang biasa dipakai, klik <b>Share</b> di kanan atas, ubah akses jadi
              <b> "Anyone with the link" &rarr; Viewer</b>. Ini perlu supaya sistem bisa baca datanya tanpa login.
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">2. Kalau file-nya punya banyak tab/sheet (misal: Rekapitulasi, Log, Data Master, ketidakhadiran guru, PPP, Catatan Khusus):</p>
            <p>
              Klik dulu tab <b>yang isinya data ketidakhadiran</b> (bukan tab lain) di bagian bawah spreadsheet, baru
              copy link-nya dari address bar. Link yang bener bakal ada <code className="bg-white px-1 rounded border border-slate-200">#gid=xxxxxxxx</code> di
              belakangnya — angka itu yang nunjuk ke tab spesifik itu, bukan ke file/tab lain. Kalau nge-copy pas lagi
              buka tab yang salah, sistem bakal baca data dari tab yang salah juga.
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">3. Format kolom yang wajib ada di baris pertama (header) tab itu:</p>
            <div className="flex flex-wrap gap-1.5">
              {HEADER_HINTS.map((h) => (
                <span key={h} className="bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">{h}</span>
              ))}
            </div>
            <p className="mt-1 text-slate-400">
              Kolom kode kehadiran isinya S (Sakit) / I (Izin) / A (Alpa) / D (Dinas Luar). Kolom Kelas boleh lebih dari
              satu, pisahkan dengan koma.
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">4. Sambungkan ke sistem:</p>
            <p>
              Tempel link tadi (yang udah ada #gid=... nya) di kolom di atas, klik <b>Sambungkan</b>. Setelah tersambung,
              sistem otomatis ngecek perubahan tiap 1 menit — begitu ada baris baru/berubah di spreadsheet, tabel di
              bawah dan notifikasi lonceng di pojok kanan atas otomatis ke-update, tanpa perlu upload manual lagi.
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">5. Biar link-nya "nempel" otomatis, gak perlu paste manual tiap buka sistem:</p>
            <p>
              Set environment variable <code className="bg-white px-1 rounded border border-slate-200">NEXT_PUBLIC_KETIDAKHADIRAN_SHEET_URL</code>{" "}
              (di file <code className="bg-white px-1 rounded border border-slate-200">.env.local</code> waktu development, atau di
              Environment Variables project Vercel waktu online) isinya link tab tadi. Sistem bakal otomatis konek
              sendiri begitu halaman dibuka, gak perlu klik Sambungkan lagi. Tetep bisa diganti manual lewat tombol
              "Ganti link spreadsheet" kalau suatu saat link-nya berubah.
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">6. Kalau koneksi gagal terus (kena CORS):</p>
            <p>
              Beberapa jaringan/kebijakan Google Workspace sekolah bisa memblokir pengambilan data langsung dari
              browser. Solusinya, arahkan sinkronisasi ini lewat backend Laravel (server-to-server, gak kena batasan
              CORS) — endpoint contohnya udah disiapkan di backend:{" "}
              <code className="bg-white px-1 rounded border border-slate-200">GET /api/ketidakhadiran/dari-spreadsheet</code>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
