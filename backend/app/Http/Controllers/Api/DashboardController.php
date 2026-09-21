<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Models\Kehadiran;
use App\Models\Ketidakhadiran;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    // GET /api/dashboard/rekap?start=2026-07-01&end=2026-12-31
    public function rekap(Request $request)
    {
        $start = $request->query('start');
        $end = $request->query('end');

        $guruList = Guru::where('aktif', true)
            ->whereNotIn('jabatan', ['Tenaga Administrasi', 'Tenaga Kebersihan'])
            ->get();

        $ketidakhadiranAll = Ketidakhadiran::query()
            ->when($start, fn ($q) => $q->whereDate('tanggal', '>=', $start))
            ->when($end, fn ($q) => $q->whereDate('tanggal', '<=', $end))
            ->get()
            ->groupBy('guru_id');

        $kegiatanAll = Kehadiran::whereNotNull('kegiatan_id')
            ->when($start, fn ($q) => $q->whereDate('tanggal', '>=', $start))
            ->when($end, fn ($q) => $q->whereDate('tanggal', '<=', $end))
            ->get()
            ->groupBy('guru_id');

        // PENTING: total hari wajib dihitung dari KALENDER (Senin-Jumat di rentang tanggal),
        // BUKAN dari jumlah data yang kebetulan ada. Ini yang bikin defaultnya "hadir" kalau
        // gak ada catatan ketidakhadiran sama sekali buat guru itu - sebelumnya total ikut jadi
        // 0 kalau belum ada data ketidakhadiran yang kesimpen, makanya Dashboard kelihatan 0 semua.
        $totalHariEfektif = ($start && $end) ? $this->hitungHariEfektif($start, $end) : 0;

        $rekap = $guruList->map(function (Guru $guru) use ($ketidakhadiranAll, $kegiatanAll, $totalHariEfektif) {
            $ketidakhadiranGuru = $ketidakhadiranAll->get($guru->id, collect());

            // Kalau satu guru punya lebih dari satu catatan ketidakhadiran di tanggal yang sama
            // (misal izin di jam 1-4 terus alpa di jam 7-10), ambil yang "terparah" biar gak
            // dihitung dobel di hari yang sama. Prioritas: Alpa > Sakit > Izin/Dinas Luar.
            $absenPerHari = $ketidakhadiranGuru
                ->groupBy(fn ($row) => $row->tanggal->format('Y-m-d'))
                ->map(function ($rows) {
                    $prioritas = ['A' => 3, 'S' => 2, 'I' => 1, 'D' => 1];
                    return $rows->sortByDesc(fn ($r) => $prioritas[$r->kode] ?? 0)->first()->kode;
                });

            $i = $absenPerHari->filter(fn ($k) => in_array($k, ['I', 'D']))->count();
            $s = $absenPerHari->filter(fn ($k) => $k === 'S')->count();
            $a = $absenPerHari->filter(fn ($k) => $k === 'A')->count();
            $hariAbsen = $absenPerHari->count();

            // DEFAULT HADIR: kalau guru gak ada catatan ketidakhadiran di suatu hari efektif,
            // hari itu otomatis dianggap Hadir - gak perlu ada yang manual nyatetin "hadir".
            $h = max($totalHariEfektif - $hariAbsen, 0);

            // Kehadiran event/kegiatan (Presensi Kegiatan) itu obligasi terpisah dari hari
            // ngajar harian, jadi ditambahkan di atas hitungan harian - kalau ada yang alpa/izin
            // di suatu event, itu juga ikut ngurangin persentase di sini.
            $kegiatanRows = $kegiatanAll->get($guru->id, collect());
            $h += $kegiatanRows->where('status', 'H')->count();
            $i += $kegiatanRows->where('status', 'I')->count();
            $s += $kegiatanRows->where('status', 'S')->count();
            $a += $kegiatanRows->where('status', 'A')->count();

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

    // Hitung jumlah hari Senin-Jumat di antara $start dan $end (inklusif).
    // Ganti array hari di bawah kalau sekolah masuk Sabtu juga (tambahin 6).
    private function hitungHariEfektif(string $start, string $end): int
    {
        $startDate = Carbon::parse($start)->startOfDay();
        $endDate = Carbon::parse($end)->startOfDay();
        if ($endDate->lt($startDate)) return 0;

        $count = 0;
        $cursor = $startDate->copy();
        while ($cursor->lte($endDate)) {
            if (in_array($cursor->dayOfWeekIso, [1, 2, 3, 4, 5])) { // Senin=1 ... Jumat=5
                $count++;
            }
            $cursor->addDay();
        }
        return $count;
    }

    private function predikat(float $persen, int $alpa): string
    {
        if ($persen < 70) return 'Perlu Pembinaan';
        if ($alpa >= 1 && $persen < 90) return 'Cukup';
        return 'Sangat Baik';
    }
}