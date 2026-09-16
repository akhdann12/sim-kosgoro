<?php

namespace App\Imports;

use App\Models\Guru;
use App\Models\Kehadiran;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Illuminate\Support\Carbon;

/**
 * Import kehadiran dari file Excel harian sekolah.
 * Format kolom yang diharapkan (header row):
 * nip | nama_guru | tanggal | status | keterangan
 *
 * status: H (Hadir) / I (Izin) / S (Sakit) / A (Alpa)
 * tanggal: format bebas yang bisa dibaca Carbon/Excel date (dd/mm/yyyy disarankan)
 */
class KehadiranImport implements ToModel, WithHeadingRow, SkipsEmptyRows
{
    public function model(array $row)
    {
        // Cari guru berdasarkan NIP, kalau tidak ada coba cocokkan nama
        $guru = Guru::where('nip', $row['nip'] ?? null)->first()
            ?? Guru::where('nama', 'like', '%' . trim($row['nama_guru'] ?? '') . '%')->first();

        if (!$guru) {
            // Guru tidak ditemukan di master data -> skip baris ini
            return null;
        }

        $tanggal = $this->parseTanggal($row['tanggal'] ?? null);
        if (!$tanggal) {
            return null;
        }

        $status = strtoupper(trim($row['status'] ?? 'H'));
        if (!in_array($status, ['H', 'I', 'S', 'A'])) {
            $status = 'H';
        }

        // updateOrCreate biar aman kalau file di-sync ulang / ada baris duplikat
        Kehadiran::updateOrCreate(
            [
                'guru_id' => $guru->id,
                'tanggal' => $tanggal,
                'kegiatan_id' => null,
            ],
            [
                'status' => $status,
                'keterangan' => $row['keterangan'] ?? null,
                'sumber' => 'excel_sync',
            ]
        );

        // Sudah disimpan manual di atas, jadi tidak perlu ToModel simpan lagi
        return null;
    }

    private function parseTanggal($value): ?string
    {
        if (!$value) return null;

        try {
            // Excel kadang kirim serial number tanggal
            if (is_numeric($value)) {
                return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value)->format('Y-m-d');
            }
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }
}
