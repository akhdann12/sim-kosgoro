<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Exports\KehadiranExport;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Facades\Excel;

class ExportController extends Controller
{
    /**
     * GET /api/export/kehadiran?period=week|month|months_back|semester&months=3&format=xlsx|csv
     *
     * period:
     *  - week          -> minggu ini (Senin - Minggu)
     *  - month         -> bulan ini
     *  - months_back   -> N bulan ke belakang (pakai param `months`, default 1)
     *  - semester      -> semester aktif berjalan (tabel tahun_ajaran, kolom aktif = true)
     */
    public function kehadiran(Request $request)
    {
        $period = $request->query('period', 'month');
        $format = $request->query('format', 'xlsx');
        $months = (int) $request->query('months', 1);

        [$start, $end, $label] = $this->resolveRange($period, $months);

        $fileName = "rekap-kehadiran-{$period}-" . $start->format('Ymd') . "-{$end->format('Ymd')}.{$format}";

        $writerType = $format === 'csv'
            ? \Maatwebsite\Excel\Excel::CSV
            : \Maatwebsite\Excel\Excel::XLSX;

        return Excel::download(new KehadiranExport($start, $end, $label), $fileName, $writerType);
    }

    private function resolveRange(string $period, int $months): array
    {
        $now = Carbon::now();

        switch ($period) {
            case 'week':
                return [$now->copy()->startOfWeek(), $now->copy()->endOfWeek(), 'Rekap Minggu Ini'];

            case 'months_back':
                $months = max(1, $months);
                return [$now->copy()->subMonths($months)->startOfMonth(), $now->copy()->endOfMonth(), "Rekap {$months} Bulan Terakhir"];

            case 'semester':
                $aktif = TahunAjaran::where('aktif', true)->first();
                if ($aktif) {
                    return [Carbon::parse($aktif->tanggal_mulai), Carbon::parse($aktif->tanggal_selesai), "Rekap Semester {$aktif->semester} {$aktif->nama}"];
                }
                // fallback kalau belum ada data tahun ajaran aktif: 6 bulan terakhir
                return [$now->copy()->subMonths(6), $now->copy(), 'Rekap Semester (fallback 6 bulan)'];

            case 'month':
            default:
                return [$now->copy()->startOfMonth(), $now->copy()->endOfMonth(), 'Rekap Bulan Ini'];
        }
    }
}
