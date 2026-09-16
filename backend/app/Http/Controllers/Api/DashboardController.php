<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Kehadiran;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    // GET /api/dashboard/rekap?start=2026-07-01&end=2026-12-31
    public function rekap(Request $request)
    {
        $start = $request->query('start');
        $end = $request->query('end');

        $guruList = Guru::where('aktif', true)->get();

        $rekap = $guruList->map(function (Guru $guru) use ($start, $end) {
            $query = Kehadiran::where('guru_id', $guru->id);
            if ($start) $query->whereDate('tanggal', '>=', $start);
            if ($end) $query->whereDate('tanggal', '<=', $end);

            $rows = $query->get();
            $h = $rows->where('status', 'H')->count();
            $i = $rows->where('status', 'I')->count();
            $s = $rows->where('status', 'S')->count();
            $a = $rows->where('status', 'A')->count();
            $total = $h + $i + $s + $a;
            $persen = $total > 0 ? round(($h / $total) * 100, 1) : 0;

            return [
                'guru_id' => $guru->id,
                'nama' => $guru->nama,
                'nip' => $guru->nip,
                'jabatan' => $guru->jabatan,
                'h' => $h, 'i' => $i, 's' => $s, 'a' => $a,
                'total' => $total,
                'persen' => $persen,
                'predikat' => $this->predikat($persen, $a),
            ];
        });

        return response()->json([
            'total_guru' => $guruList->count(),
            'rata_rata_kehadiran' => round($rekap->avg('persen'), 1),
            'data' => $rekap->values(),
        ]);
    }

    private function predikat(float $persen, int $alpa): string
    {
        if ($persen < 70) return 'Perlu Pembinaan';
        if ($alpa >= 1 && $persen < 90) return 'Cukup';
        return 'Sangat Baik';
    }
}
