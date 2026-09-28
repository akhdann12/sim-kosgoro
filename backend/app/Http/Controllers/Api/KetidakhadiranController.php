<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Ketidakhadiran;
use App\Models\Kehadiran;
use App\Support\GuruMatcher;
use App\Support\GridAbsensiParser;
use App\Support\SpreadsheetReader;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
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
            'kelas' => 'nullable',
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
     * Baris header dicari otomatis di seluruh baris (bukan asumsi baris pertama), soalnya file
     * rekap sekolah sering ada judul/subjudul di atas header aslinya.
     */
    public function fromSpreadsheet(Request $request)
    {
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

        $rawRows = array_map('str_getcsv', explode("\n", trim($response->body())));

        $headerRowIndex = null;
        foreach ($rawRows as $idx => $row) {
            foreach ($row as $cell) {
                $norm = $this->normalizeHeader((string) $cell);
                if (in_array($norm, ['namaguru', 'nama'])) {
                    $headerRowIndex = $idx;
                    break 2;
                }
            }
        }

        if ($headerRowIndex === null) {
            return response()->json(['message' => 'Gak nemu kolom "Nama Guru" di spreadsheet ini. Pastikan ada baris header dengan kolom itu.'], 422);
        }

        $header = array_map(fn ($h) => $this->normalizeHeader((string) $h), $rawRows[$headerRowIndex]);
        $dataRows = array_slice($rawRows, $headerRowIndex + 1);

        $result = [];
        $dilewati = [];
        $allGuru = Guru::where('aktif', true)->get(); // di-load sekali di luar loop, bukan query tiap baris

        foreach ($dataRows as $rawRow) {
            if (count(array_filter($rawRow, fn ($c) => trim((string) $c) !== '')) < 2) continue;
            $row = array_combine($header, array_pad($rawRow, count($header), null));

            $namaGuru = trim($row['namaguru'] ?? $row['nama'] ?? '');
            if (!$namaGuru) continue;

            // Pencocokan fuzzy (bukan LIKE exact-substring) - toleran typo kecil & beda format
            // gelar, misal "Laras Dwi Febriyani" tetep ketemu ke "Laras Dwi Febriani" di master.
            $guru = GuruMatcher::findBestMatch($namaGuru, $allGuru);
            if (!$guru) {
                $dilewati[] = $namaGuru;
                continue;
            }

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

        return response()->json([
            'synced' => count($result),
            'data' => $result,
            'dilewati' => array_values(array_unique($dilewati)),
        ]);
    }

    /**
     * POST /api/ketidakhadiran/import-grid (multipart, field "file")
     *
     * Import dari format Excel/Spreadsheet ASLI yang dipakai sekolah (bukan tabel panjang):
     * baris = guru, kolom = tanggal (dropdown isi jumlah jam), dan baris "Keterangan" bebas teks
     * di paling bawah. Guru sering nulis ketidakhadirannya di baris Keterangan itu, bukan di
     * cell dropdown yang seharusnya - endpoint ini otomatis membaca kedua sumber itu dan
     * "menembak" langsung ke kolom tanggal & guru yang tepat berdasarkan nama yang disebut di teks.
     */
    public function importGrid(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv,txt',
        ]);

        try {
            $rows = SpreadsheetReader::readRows($validated['file']);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return $this->prosesGrid($rows);
    }

    /**
     * GET /api/ketidakhadiran/dari-spreadsheet-grid?sheet_id=xxx&gid=0
     * Sama seperti importGrid, tapi sumbernya Google Spreadsheet (link yang di-share publik),
     * dipakai buat panel "Sinkronisasi dari Google Spreadsheet" format grid.
     */
    public function fromSpreadsheetGrid(Request $request)
    {
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

        $rows = SpreadsheetReader::parseCsvString($response->body());

        return $this->prosesGrid($rows);
    }

    /**
     * Simpan hasil parsing grid ke database - DIBUAT HEMAT QUERY dengan sengaja.
     *
     * Versi sebelumnya updateOrCreate() satu-satu (2 tabel x select + insert/update tiap baris)
     * plus load('guru') per baris: ~130 query buat 30 catatan, DAN tetap ~80 query walau gak ada
     * yang berubah - padahal sync otomatis jalan tiap 1 menit. Kalau jarak server ke database
     * jauh (Railway -> Supabase), itu bisa 10-30 detik per request dan bikin server ngantri/timeout.
     *
     * Sekarang: ambil semua data yang sudah ada SEKALI, bandingin di memori, lalu cuma insert yang
     * baru (bulk, 1 query) dan update yang BENERAN berubah. Sync ulang tanpa perubahan = 0 tulis.
     */
    private function prosesGrid(array $rows): \Illuminate\Http\JsonResponse
    {
        @set_time_limit(180);

        $guruList = Guru::where('aktif', true)->get();
        $hasil = GridAbsensiParser::parse($rows, $guruList);

        if (isset($hasil['ringkasan']['error'])) {
            return response()->json(['message' => $hasil['ringkasan']['error']], 422);
        }

        $records = $hasil['records'];
        $guruNama = $guruList->pluck('nama', 'id');

        if (empty($records)) {
            return response()->json(['synced' => 0, 'data' => [], 'ringkasan' => $hasil['ringkasan']]);
        }

        $guruIds = collect($records)->pluck('guru_id')->unique()->values()->all();
        $tanggals = collect($records)->pluck('tanggal')->unique()->values()->all();

        // 1 query: semua catatan ketidakhadiran yang sudah ada untuk guru+tanggal ini
        $existingKt = [];
        foreach (Ketidakhadiran::whereIn('guru_id', $guruIds)->whereIn('tanggal', $tanggals)->get() as $row) {
            $key = $row->guru_id . '|' . $row->tanggal->format('Y-m-d');
            $existingKt[$key] ??= $row; // kalau ada lebih dari satu, pakai yang pertama (sama kayak perilaku lama)
        }

        // 1 query: cermin di tabel kehadiran (kegiatan_id NULL) - dipakai Dashboard
        $existingKh = [];
        foreach (Kehadiran::whereNull('kegiatan_id')->whereIn('guru_id', $guruIds)->whereIn('tanggal', $tanggals)->get() as $row) {
            $existingKh[$row->guru_id . '|' . $row->tanggal->format('Y-m-d')] ??= $row;
        }

        $now = now();
        $insertKt = [];
        $insertKh = [];
        $updateKt = []; // [model, attrs]
        $updateKh = [];
        $data = [];

        foreach ($records as $r) {
            $key = $r['guru_id'] . '|' . $r['tanggal'];
            $jamKe = $r['jam'] ? "{$r['jam']} Jam" : null;
            $statusKh = $r['kode'] === 'D' ? 'I' : $r['kode'];

            $attrKt = [
                'jam_ke' => $jamKe,
                'kode' => $r['kode'],
                'guru_pengganti' => $r['guru_pengganti'],
                'catatan' => $r['catatan'],
            ];

            if (isset($existingKt[$key])) {
                $m = $existingKt[$key];
                $beda = false;
                foreach ($attrKt as $k => $v) {
                    if ($m->{$k} !== $v) { $beda = true; break; }
                }
                if ($beda) $updateKt[] = [$m, $attrKt];
            } else {
                $insertKt[] = $attrKt + [
                    'guru_id' => $r['guru_id'],
                    'tanggal' => $r['tanggal'],
                    'hari' => Carbon::parse($r['tanggal'])->translatedFormat('l'),
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }

            $attrKh = ['status' => $statusKh, 'keterangan' => $r['catatan']];
            if (isset($existingKh[$key])) {
                $m = $existingKh[$key];
                if ($m->status !== $attrKh['status'] || $m->keterangan !== $attrKh['keterangan']) {
                    $updateKh[] = [$m, $attrKh + ['sumber' => 'excel_sync']];
                }
            } else {
                $insertKh[] = $attrKh + [
                    'guru_id' => $r['guru_id'], 'tanggal' => $r['tanggal'], 'kegiatan_id' => null,
                    'sumber' => 'excel_sync', 'created_at' => $now, 'updated_at' => $now,
                ];
            }

            $data[] = [
                'guru_id' => $r['guru_id'],
                'tanggal' => $r['tanggal'],
                'jam_ke' => $jamKe,
                'kode' => $r['kode'],
                'guru_pengganti' => $r['guru_pengganti'],
                'catatan' => $r['catatan'],
                'guru' => ['id' => $r['guru_id'], 'nama' => $guruNama[$r['guru_id']] ?? '-'],
            ];
        }

        DB::transaction(function () use ($insertKt, $insertKh, $updateKt, $updateKh) {
            foreach (array_chunk($insertKt, 500) as $chunk) Ketidakhadiran::insert($chunk);
            foreach (array_chunk($insertKh, 500) as $chunk) Kehadiran::insert($chunk);
            foreach ($updateKt as [$m, $attrs]) $m->update($attrs);
            foreach ($updateKh as [$m, $attrs]) $m->update($attrs);
        });

        return response()->json([
            'synced' => count($data),
            'data' => $data,
            'ringkasan' => $hasil['ringkasan'],
        ]);
    }

    private function normalizeHeader(string $header): string
    {
        return strtolower(preg_replace('/[^a-z0-9]/i', '', $header));
    }

    private function parseTanggal($value): ?string
    {
        if (!$value) return null;
        $value = trim((string) $value);

        try {
            // Spreadsheet sekolah biasanya nulis tanggal format Indonesia (d/m/Y atau d-m-Y).
            // Carbon::parse() polos nebak "10/08/2026" itu FORMAT AMERIKA (m/d/Y = 8 Oktober),
            // padahal maksudnya 10 Agustus - jadi harus dicoba format Indonesia DULU secara
            // eksplisit sebelum jatuh ke parser umum, biar tanggalnya gak geser diam-diam.
            if (preg_match('#^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$#', $value, $m)) {
                $day = (int) $m[1];
                $month = (int) $m[2];
                if ($day <= 31 && $month <= 12) {
                    return Carbon::createFromFormat('d/m/Y', "{$day}/{$month}/{$m[3]}")->format('Y-m-d');
                }
            }
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }
}