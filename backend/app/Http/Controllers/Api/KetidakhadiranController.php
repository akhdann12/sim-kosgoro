<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Ketidakhadiran;
use App\Models\Kehadiran;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;

class KetidakhadiranController extends Controller
{
    // GET /api/ketidakhadiran?kode=S
    public function index(Request $request)
    {
        $query = Ketidakhadiran::with('guru')->orderByDesc('tanggal');

        if ($kode = $request->query('kode')) {
            $query->where('kode', $kode);
        }

        return response()->json($query->get());
    }

    // POST /api/ketidakhadiran  -> input cepat (form di halaman Ketidakhadiran)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'guru_id' => 'required|exists:guru,id',
            'mapel' => 'nullable|string|max:100',
            'hari' => 'required|string|max:20',
            'tanggal' => 'required|date',
            'jam_ke' => 'nullable|string|max:50',
            'kelas' => 'nullable', // string "X RPL, XI TKJ" atau array
            'kode' => 'required|in:S,I,A,D',
            'pengganti' => 'nullable|string|max:255',
            'catatan' => 'nullable|string|max:255',
        ]);

        $kelas = $validated['kelas'] ?? null;
        if (is_string($kelas)) {
            $kelas = array_map('trim', explode(',', $kelas));
        }

        $ketidakhadiran = Ketidakhadiran::create([
            'guru_id' => $validated['guru_id'],
            'mapel' => $validated['mapel'] ?? null,
            'hari' => $validated['hari'],
            'tanggal' => $validated['tanggal'],
            'jam_ke' => $validated['jam_ke'] ?? null,
            'kelas' => $kelas,
            'kode' => $validated['kode'],
            'guru_pengganti' => $validated['pengganti'] ?? null,
            'catatan' => $validated['catatan'] ?? null,
        ]);

        // Catatan ketidakhadiran otomatis tercermin juga di rekap kehadiran harian (kalau kode != Alpa tetap tercatat sbg I/S/D, Alpa sbg A)
        Kehadiran::updateOrCreate(
            [
                'guru_id' => $validated['guru_id'],
                'tanggal' => $validated['tanggal'],
                'kegiatan_id' => null,
            ],
            [
                'status' => $validated['kode'] === 'D' ? 'I' : $validated['kode'],
                'keterangan' => $validated['catatan'] ?? null,
                'sumber' => 'manual',
            ]
        );

        return response()->json($ketidakhadiran->load('guru'), 201);
    }

    /**
     * GET /api/ketidakhadiran/dari-spreadsheet?sheet_id=xxx&gid=0
     *
     * Proxy server-to-server buat baca Google Spreadsheet publik (Anyone with the link: Viewer)
     * dan langsung upsert ke tabel ketidakhadiran. Dipakai kalau fetch langsung dari browser
     * (frontend Next.js) kena CORS/diblokir jaringan sekolah.
     *
     * Kolom yang dibaca (header row, urutan bebas):
     * Nama Guru | Mata Pelajaran | Hari | Tanggal | Jam Ke- | Kelas | Keterangan (S/I/A/D) | Guru Pengganti / Tugas | Keterangan
     */
    public function fromSpreadsheet(Request $request)
    {
        // Validasi ketat: sheet_id cuma boleh karakter yang emang dipakai Google (huruf/angka/-/_),
        // gid cuma boleh angka. Ini nutup celah URL/path injection ke endpoint proxy ini.
        $validated = $request->validate([
            'sheet_id' => ['required', 'string', 'regex:/^[a-zA-Z0-9_-]+$/'],
            'gid' => ['nullable', 'regex:/^[0-9]+$/'],
        ]);

        $gid = $validated['gid'] ?? '0';
        $csvUrl = "https://docs.google.com/spreadsheets/d/{$validated['sheet_id']}/gviz/tq?tqx=out:csv&gid={$gid}";

        $response = Http::timeout(15)->get($csvUrl);
        if (!$response->successful()) {
            return response()->json(['message' => 'Gagal mengambil spreadsheet. Pastikan sudah di-share sebagai "Anyone with the link".'], 422);
        }

        $rows = array_map('str_getcsv', explode("\n", trim($response->body())));
        $header = array_map(fn ($h) => $this->normalizeHeader($h), array_shift($rows));

        $result = [];
        foreach ($rows as $rawRow) {
            if (count($rawRow) < 2) continue;
            $row = array_combine($header, array_pad($rawRow, count($header), null));

            $namaGuru = trim($row['namaguru'] ?? $row['nama'] ?? '');
            if (!$namaGuru) continue;

            $guru = Guru::where('nama', 'like', "%{$namaGuru}%")->first();
            if (!$guru) continue;

            $tanggal = $this->parseTanggal($row['tanggal'] ?? null);
            if (!$tanggal) continue;

            $kode = strtoupper(substr(trim($row['keterangansiad'] ?? $row['keterangan'] ?? $row['kode'] ?? 'A'), 0, 1));
            if (!in_array($kode, ['S', 'I', 'A', 'D'])) $kode = 'A';

            $kelasRaw = $row['kelas'] ?? '';
            $kelas = $kelasRaw ? array_map('trim', explode(',', $kelasRaw)) : [];

            $item = Ketidakhadiran::updateOrCreate(
                [
                    'guru_id' => $guru->id,
                    'tanggal' => $tanggal,
                    'jam_ke' => $row['jamke'] ?? null,
                ],
                [
                    'mapel' => $row['matapelajaran'] ?? $row['mapel'] ?? null,
                    'hari' => $row['hari'] ?? Carbon::parse($tanggal)->translatedFormat('l'),
                    'kelas' => $kelas,
                    'kode' => $kode,
                    'guru_pengganti' => $row['gurupenggantitugas'] ?? $row['gurupengganti'] ?? null,
                    'catatan' => $row['keternangan'] ?? $row['catatan'] ?? null,
                ]
            );

            $result[] = $item->load('guru');
        }

        return response()->json(['synced' => count($result), 'data' => $result]);
    }

    private function normalizeHeader(string $header): string
    {
        return strtolower(preg_replace('/[^a-z0-9]/i', '', $header));
    }

    private function parseTanggal($value): ?string
    {
        if (!$value) return null;
        try {
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }
}
