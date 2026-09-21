<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kegiatan;
use App\Models\Kehadiran;
use App\Models\Guru;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
                'status' => $statusPerKegiatan,
            ];
        });

        return response()->json([
            'kegiatan' => $kegiatanList->map(fn ($k) => ['id' => $k->id, 'nama' => $k->nama, 'tanggal' => $k->tanggal->format('d M Y')]),
            'data' => $matrix,
        ]);
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
            'status' => 'required|in:hadir,izin,alpa',
            'reason' => 'nullable|string|max:255',
        ]);

        $statusMap = ['hadir' => 'H', 'izin' => 'I', 'alpa' => 'A'];

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
