<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kegiatan;
use App\Models\Kehadiran;
use App\Models\Guru;
use Illuminate\Http\Request;

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
                return $row ? $row->status : null;
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
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'tanggal' => 'required|date',
            'tahun_ajaran_id' => 'nullable|exists:tahun_ajaran,id',
        ]);

        $kegiatan = Kegiatan::create($validated);

        return response()->json($kegiatan, 201);
    }
}
