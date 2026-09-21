<?php

namespace App\Exports;

use App\Models\Guru;
use App\Models\Kehadiran;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Illuminate\Support\Carbon;

class KehadiranExport implements FromCollection, WithHeadings, WithTitle
{
    public function __construct(
        private Carbon $start,
        private Carbon $end,
        private string $label
    ) {}

    public function title(): string
    {
        return $this->label;
    }

    public function headings(): array
    {
        return ['No', 'Nama Guru', 'NIP', 'Jabatan', 'Hadir', 'Izin', 'Sakit', 'Alpa', 'Total', '% Kehadiran', 'Predikat'];
    }

    public function collection()
    {
        $guruList = Guru::where('aktif', true)
            ->whereNotIn('jabatan', ['Tenaga Administrasi', 'Tenaga Kebersihan'])
            ->orderBy('nama')->get();

        return $guruList->values()->map(function (Guru $guru, int $idx) {
            $rows = Kehadiran::where('guru_id', $guru->id)
                ->whereDate('tanggal', '>=', $this->start)
                ->whereDate('tanggal', '<=', $this->end)
                ->get();

            $h = $rows->where('status', 'H')->count();
            $i = $rows->where('status', 'I')->count();
            $s = $rows->where('status', 'S')->count();
            $a = $rows->where('status', 'A')->count();
            $total = $h + $i + $s + $a;
            $persen = $total > 0 ? round(($h / $total) * 100, 1) : 0;

            $predikat = $persen < 70 ? 'Perlu Pembinaan' : ($a >= 1 && $persen < 90 ? 'Cukup' : 'Sangat Baik');

            return [
                $idx + 1,
                $guru->nama,
                $guru->nip,
                $guru->jabatan,
                $h, $i, $s, $a, $total,
                $persen . '%',
                $predikat,
            ];
        });
    }
}
