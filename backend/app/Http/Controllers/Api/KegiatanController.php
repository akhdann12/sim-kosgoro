<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kegiatan;
use App\Models\Kehadiran;
use App\Models\Guru;
use App\Support\GuruMatcher;
use App\Support\KegiatanMatrixParser;
use App\Support\SpreadsheetReader;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class KegiatanController extends Controller
{
    // GET /api/kegiatan  -> daftar agenda + rekap kehadiran per agenda
    public function index()
    {
        $kegiatan = Kegiatan::orderBy('tanggal')->get();

        $data = $kegiatan->map(function (Kegiatan $k) {
            $rows = Kehadiran::where('kegiatan_id', $k->id)->get();
            $total = $rows->count();
            $hadir = $rows->where('status', 'H')->count();
            $alpa = $rows->where('status', 'A')->count();

            return [
                'id' => $k->id,
                'nama' => $k->nama,
                'tanggal' => $k->tanggal->format('d M Y'),
                'tanggal_iso' => $k->tanggal->format('Y-m-d'),
                'hadir' => $hadir,
                'alpa' => $alpa,
                'total' => $total,
                'persen' => $total > 0 ? round(($hadir / $total) * 100, 1) : 0,
            ];
        });

        return response()->json($data);
    }

    // GET /api/kegiatan/matrix -> guru x agenda (buat tabel jurnal presensi)
    public function matrix()
    {
        $guruList = Guru::where('aktif', true)->get();
        $kegiatanList = Kegiatan::orderBy('tanggal')->get();

        $matrix = $guruList->map(function (Guru $guru) use ($kegiatanList) {
            $statusPerKegiatan = $kegiatanList->map(function (Kegiatan $k) use ($guru) {
                // Guru yang gabung belakangan gak boleh dianggap "Hadir" di kegiatan yang tanggalnya
                // sebelum dia resmi bergabung - itu bukan alpa juga (dia memang belum ada di sekolah),
                // jadi ditandai status khusus "belum_bergabung" biar gak ikut ngurangin persentase.
                if ($guru->tanggal_bergabung && $k->tanggal->lt($guru->tanggal_bergabung)) {
                    return ['status' => 'belum_bergabung', 'reason' => null];
                }

                $row = Kehadiran::where('guru_id', $guru->id)->where('kegiatan_id', $k->id)->first();
                return [
                    'status' => $row ? $row->status : 'H', // default Hadir kalau belum ada catatan
                    'reason' => $row ? $row->keterangan : null,
                ];
            });

            return [
                'guru_id' => $guru->id,
                'nama' => $guru->nama,
                'nip' => $guru->nip,
                'jabatan' => $guru->jabatan,
                'tanggal_bergabung' => $guru->tanggal_bergabung?->format('Y-m-d'),
                'status' => $statusPerKegiatan,
            ];
        });

        return response()->json([
            'kegiatan' => $kegiatanList->map(fn ($k) => [
                'id' => $k->id,
                'nama' => $k->nama,
                'tanggal' => $k->tanggal->format('d M Y'),
                'tanggal_iso' => $k->tanggal->format('Y-m-d'), // buat isi awal <input type="date"> pas diedit
            ]),
            'data' => $matrix,
        ]);
    }

    // PUT /api/kegiatan/{kegiatan} - buat benerin nama/tanggal kegiatan yang salah input pas
    // ditambahkan (baik lewat "Tambah Event Baru" maupun hasil import) - user gak perlu hapus &
    // bikin ulang cuma buat ngoreksi typo tanggal.
    public function update(Request $request, Kegiatan $kegiatan)
    {
        $validated = $request->validate([
            'nama' => 'sometimes|required|string|max:255',
            'tanggal' => 'sometimes|required|date',
        ]);

        $kegiatan->update($validated);

        // Kehadiran yang udah kesimpen buat kegiatan ini ikut disesuaikan tanggalnya, biar konsisten
        // sama tanggal kegiatan yang baru (dipakai Dashboard buat ngitung rentang periode).
        if (isset($validated['tanggal'])) {
            Kehadiran::where('kegiatan_id', $kegiatan->id)->update(['tanggal' => $validated['tanggal']]);
        }

        return response()->json($kegiatan->fresh());
    }

    // POST /api/kegiatan/parse (multipart, field "file")
    //
    // File asli sekolah buat jurnal kegiatan itu format MATRIX (guru x kegiatan, isinya langsung
    // status Hadir/Alpa/Izin/Sakit, header 3 baris berlapis, TANPA kolom tanggal eksplisit per
    // kegiatan) - lihat KegiatanMatrixParser buat detail lengkapnya. Endpoint ini cuma
    // MEMBACA & MENCOCOKKAN guru, BELUM nyimpen apa-apa ke database:
    //   - Kalau formatnya MATRIX: balikin daftar nama kegiatan yang kedeteksi (butuh tanggal per
    //     kolom, diisi user lewat form kecil di frontend) + status per guru yang sudah dicocokkan.
    //   - Kalau formatnya FLAT lama (Nama Kegiatan + Tanggal per baris, tanggalnya udah lengkap):
    //     langsung disimpan di sini juga, gak perlu konfirmasi lanjutan.
    public function parse(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv,txt',
        ]);

        try {
            $rows = SpreadsheetReader::readRows($validated['file']);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $hasil = KegiatanMatrixParser::detect($rows);

        if (($hasil['type'] ?? null) === null || !empty($hasil['error'])) {
            return response()->json(['message' => $hasil['error'] ?? 'Format file gak dikenali.'], 422);
        }

        if ($hasil['type'] === 'flat') {
            return $this->simpanKegiatanFlat($hasil['rows']);
        }

        // format matrix: cocokkan nama guru di sheet ke Data Master Guru pakai fuzzy match,
        // biar frontend tinggal nampilin hasilnya tanpa perlu logic pencocokan sendiri
        $guruList = Guru::where('aktif', true)->get();
        $namaTidakKetemu = [];
        $guruTermatch = [];

        foreach ($hasil['guru'] as $row) {
            $guru = GuruMatcher::findBestMatch($row['nama'], $guruList);
            if (!$guru) {
                $namaTidakKetemu[] = $row['nama'];
                continue;
            }
            $guruTermatch[] = ['guru_id' => $guru->id, 'nama' => $guru->nama, 'status' => $row['status']];
        }

        return response()->json([
            'type' => 'matrix',
            'columns' => $hasil['columns'],
            'guru' => $guruTermatch,
            'nama_tidak_ketemu' => array_values(array_unique($namaTidakKetemu)),
        ]);
    }

    private function simpanKegiatanFlat(array $rows): \Illuminate\Http\JsonResponse
    {
        $ditambah = 0;
        $dilewati = 0;

        foreach ($rows as $row) {
            $sudahAda = Kegiatan::where('nama', $row['nama'])->whereDate('tanggal', $row['tanggal'])->exists();
            if ($sudahAda) { $dilewati++; continue; }

            Kegiatan::create(['nama' => $row['nama'], 'tanggal' => $row['tanggal']]);
            $ditambah++;
        }

        return response()->json(['type' => 'flat', 'ditambah' => $ditambah, 'dilewati' => $dilewati]);
    }

    // POST /api/kegiatan/import-matrix
    // Body: { kegiatan: [{ nama, tanggal }], guru: [{ guru_id, status: [kode|null, ...] }] }
    // Dipanggil setelah user ngisi tanggal buat tiap kolom kegiatan hasil parse() di atas.
    // status[i] harus sejajar urutannya sama kegiatan[i]. Kehadiran yang statusnya kosong/gak
    // dikenali (null) dilewati - gak nyimpen apa-apa buat sel itu, biarin default "Hadir" alami
    // yang jalan dari KegiatanController::matrix().
    public function importMatrix(Request $request)
    {
        $validated = $request->validate([
            'kegiatan' => 'required|array|min:1',
            'kegiatan.*.nama' => 'required|string|max:255',
            'kegiatan.*.tanggal' => 'required|date',
            'guru' => 'required|array|min:1',
            'guru.*.guru_id' => 'required|exists:guru,id',
            'guru.*.status' => 'required|array',
        ]);

        $kegiatanIds = [];
        foreach ($validated['kegiatan'] as $k) {
            $kegiatan = Kegiatan::firstOrCreate([
                'nama' => trim($k['nama']),
                'tanggal' => Carbon::parse($k['tanggal'])->format('Y-m-d'),
            ]);
            $kegiatanIds[] = $kegiatan->id;
        }

        $disimpan = 0;
        foreach ($validated['guru'] as $g) {
            foreach ($g['status'] as $idx => $kode) {
                if (!$kode || !isset($kegiatanIds[$idx])) continue;

                Kehadiran::updateOrCreate(
                    ['guru_id' => $g['guru_id'], 'kegiatan_id' => $kegiatanIds[$idx]],
                    [
                        'tanggal' => $validated['kegiatan'][$idx]['tanggal'],
                        'status' => $kode,
                        'sumber' => 'excel_sync',
                    ]
                );
                $disimpan++;
            }
        }

        return response()->json(['kegiatan_dibuat' => count($kegiatanIds), 'kehadiran_disimpan' => $disimpan]);
    }

    // POST /api/kegiatan
    // Body: { nama, tanggal, tahun_ajaran_id?, kehadiran?: [{ guru_id, status }] }
    // status dari frontend: "hadir" | "izin" | "alpa" -> dipetakan ke H/I/A
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'tanggal' => 'required|date',
            'tahun_ajaran_id' => 'nullable|exists:tahun_ajaran,id',
            'kehadiran' => 'nullable|array',
            'kehadiran.*.guru_id' => 'required_with:kehadiran|exists:guru,id',
            'kehadiran.*.status' => 'required_with:kehadiran|in:hadir,izin,alpa',
        ]);

        $kegiatan = DB::transaction(function () use ($validated) {
            $kegiatan = Kegiatan::create([
                'nama' => $validated['nama'],
                'tanggal' => $validated['tanggal'],
                'tahun_ajaran_id' => $validated['tahun_ajaran_id'] ?? null,
            ]);

            $statusMap = ['hadir' => 'H', 'izin' => 'I', 'alpa' => 'A'];
            foreach ($validated['kehadiran'] ?? [] as $row) {
                Kehadiran::create([
                    'guru_id' => $row['guru_id'],
                    'kegiatan_id' => $kegiatan->id,
                    'tanggal' => $kegiatan->tanggal,
                    'status' => $statusMap[$row['status']],
                    'sumber' => 'manual',
                ]);
            }

            return $kegiatan;
        });

        return response()->json($kegiatan, 201);
    }

    // POST /api/kegiatan/{kegiatan}/kehadiran
    // Body: { guru_id, status: "hadir"|"izin"|"alpa", reason?: string }
    // Dipakai waktu ubah status kehadiran satu guru di satu kegiatan (dropdown di tabel presensi kegiatan).
    public function updateAttendance(Request $request, Kegiatan $kegiatan)
    {
        $validated = $request->validate([
            'guru_id' => 'required|exists:guru,id',
            'status' => 'required|in:hadir,izin,alpa,sakit,dinas',
            'reason' => 'nullable|string|max:255',
        ]);

        $statusMap = ['hadir' => 'H', 'izin' => 'I', 'alpa' => 'A', 'sakit' => 'S', 'dinas' => 'D'];

        $kehadiran = Kehadiran::updateOrCreate(
            ['guru_id' => $validated['guru_id'], 'kegiatan_id' => $kegiatan->id],
            [
                'tanggal' => $kegiatan->tanggal,
                'status' => $statusMap[$validated['status']],
                'keterangan' => $validated['reason'] ?? null,
                'sumber' => 'manual',
            ]
        );

        return response()->json($kehadiran);
    }
}
