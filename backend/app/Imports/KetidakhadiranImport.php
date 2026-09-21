<?php

namespace App\Imports;

use App\Models\Guru;
use App\Models\Ketidakhadiran;
use App\Support\GuruMatcher;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Illuminate\Support\Carbon;

/**
 * Import data ketidakhadiran guru dari file Excel yang dipakai sekolah sehari-hari.
 * Format kolom yang diharapkan (header row, bebas urutan):
 * nama_guru | mata_pelajaran | hari | tanggal | jam_ke | kelas | kode | guru_pengganti | catatan
 *
 * kode: S (Sakit) / I (Izin) / A (Alpa) / D (Dinas Luar)
 * kelas: boleh lebih dari satu, pisahkan dengan koma. Contoh: "X RPL, XI TKJ"
 */
class KetidakhadiranImport implements ToModel, WithHeadingRow, SkipsEmptyRows
{
    public function model(array $row)
    {
        $namaGuru = trim($row['nama_guru'] ?? $row['nama'] ?? '');
        if (!$namaGuru) {
            return null;
        }

        // Pencocokan fuzzy - toleran typo kecil & beda format gelar
        $guru = GuruMatcher::findBestMatchByQuery($namaGuru);
        if (!$guru) {
            // Guru tidak ada di master data -> skip baris ini biar gak nyasar ke guru yang salah
            return null;
        }

        $tanggal = $this->parseTanggal($row['tanggal'] ?? null);
        if (!$tanggal) {
            return null;
        }

        $kode = strtoupper(trim($row['kode'] ?? 'A'));
        if (!in_array($kode, ['S', 'I', 'A', 'D'])) {
            $kode = 'A';
        }

        $kelasRaw = $row['kelas'] ?? '';
        $kelas = $kelasRaw ? array_map('trim', explode(',', $kelasRaw)) : [];

        // updateOrCreate biar file yang di-sync ulang gak bikin data dobel
        Ketidakhadiran::updateOrCreate(
            [
                'guru_id' => $guru->id,
                'tanggal' => $tanggal,
                'jam_ke' => $row['jam_ke'] ?? null,
            ],
            [
                'mapel' => $row['mata_pelajaran'] ?? $row['mapel'] ?? null,
                'hari' => $row['hari'] ?? Carbon::parse($tanggal)->translatedFormat('l'),
                'kelas' => $kelas,
                'kode' => $kode,
                'guru_pengganti' => $row['guru_pengganti'] ?? $row['pengganti'] ?? null,
                'catatan' => $row['catatan'] ?? $row['keterangan'] ?? null,
            ]
        );

        return null; // sudah disimpan manual di atas
    }

    private function parseTanggal($value): ?string
    {
        if (!$value) return null;

        try {
            if (is_numeric($value)) {
                return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value)->format('Y-m-d');
            }

            $value = trim((string) $value);
            // Format Indonesia (d/m/Y) dicoba dulu secara eksplisit - Carbon::parse() polos
            // nebak slash-date sebagai format Amerika (m/d/Y), yang bisa geser tanggalnya diam-diam.
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
