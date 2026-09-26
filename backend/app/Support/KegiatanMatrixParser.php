<?php

namespace App\Support;

/**
 * Format asli sekolah buat "Jurnal & Log Kehadiran Guru Per Kegiatan" itu BUKAN daftar
 * (Nama Kegiatan, Tanggal) per baris, tapi matrix: baris = guru, kolom = kegiatan, isinya
 * langsung status kehadiran ("Hadir"/"Alpa"/"Izin"/"Sakit"). Header-nya 3 baris berlapis:
 *
 *   No | Nama Guru | Jabatan | Status Kehadiran Kegiatan (merged, judul grup doang)
 *   Jenis Kegiatan |  |  | IHT (merged 2 kolom) | MAULID | WORKSHOP
 *                  |  |  | Hari 1 | Hari 2 |
 *
 * Kolom yang merged di Google Sheets, begitu di-export ke Excel/CSV, cuma nyimpen teksnya di
 * kolom PALING KIRI dari area merge-nya - kolom lain di sebelah kanannya kosong. Makanya kolom
 * "IHT" cuma keisi di satu kolom, tapi "Hari 1"/"Hari 2" di baris bawahnya nunjukkin itu masih
 * bagian dari grup yang sama, jadi nama kegiatannya digabung jadi "IHT - Hari 1" / "IHT - Hari 2".
 *
 * Sheet ini juga gak punya kolom tanggal eksplisit (cuma nama kegiatan) - jadi hasil deteksi
 * matrix ini masih perlu tanggal per kolom yang diisi manual oleh user sebelum benar-benar
 * disimpan (lihat KegiatanController::parse() & importMatrix()).
 *
 * Kalau file yang diupload TERNYATA format lama (kolom "Nama Kegiatan" + "Tanggal" per baris),
 * parser ini otomatis fallback ke situ juga - jadi satu pintu import buat dua kemungkinan format.
 */
class KegiatanMatrixParser
{
    private const KANDIDAT_NAMA_GURU = ['namaguru', 'nama'];
    private const KANDIDAT_JABATAN = ['jabatan'];
    private const KANDIDAT_NAMA_KEGIATAN_FLAT = ['nama', 'namakegiatan', 'namaagenda', 'namaevent', 'kegiatan', 'agenda'];
    private const KANDIDAT_TANGGAL_FLAT = ['tanggal', 'tgl', 'tanggalkegiatan', 'tanggalagenda'];

    public static function detect(array $rows): array
    {
        $rows = array_values($rows);

        $headerIdx = self::cariBarisHeaderMatrix($rows);
        if ($headerIdx !== null) {
            return self::parseMatrix($rows, $headerIdx);
        }

        $flatHeaderIdx = self::cariBarisHeaderFlat($rows);
        if ($flatHeaderIdx !== null) {
            return self::parseFlat($rows, $flatHeaderIdx);
        }

        return [
            'type' => null,
            'error' => 'Format file gak dikenali. Harus ada baris header dengan kolom "Nama Guru" + "Jabatan" '
                . '(format matrix per kegiatan), atau "Nama Kegiatan" + "Tanggal" (format daftar biasa).',
        ];
    }

    // ---------- FORMAT MATRIX (guru x kegiatan) ----------

    private static function cariBarisHeaderMatrix(array $rows): ?int
    {
        foreach ($rows as $idx => $row) {
            $norm = array_map(fn ($c) => self::normalisasi((string) $c), $row);
            if (in_array('namaguru', $norm, true) && in_array('jabatan', $norm, true)) {
                return $idx;
            }
        }
        return null;
    }

    private static function parseMatrix(array $rows, int $headerIdx): array
    {
        $headerRow = array_values($rows[$headerIdx] ?? []);
        $namaColIdx = self::cariKolom($headerRow, self::KANDIDAT_NAMA_GURU, 1);
        $jabatanColIdx = self::cariKolom($headerRow, self::KANDIDAT_JABATAN, 2);
        $dataStartCol = max($namaColIdx, $jabatanColIdx) + 1;

        // 2 baris sesudah header utama: baris grup kegiatan, lalu baris sub-hari (kalau ada)
        $groupRow = array_values($rows[$headerIdx + 1] ?? []);
        $subRow = array_values($rows[$headerIdx + 2] ?? []);
        $totalCols = max(count($headerRow), count($groupRow), count($subRow));

        $kolomNama = []; // colIdx (relatif ke $dataStartCol, urut) => nama kegiatan final
        $lastGroup = null;
        for ($c = $dataStartCol; $c < $totalCols; $c++) {
            $group = trim((string) ($groupRow[$c] ?? ''));
            $sub = trim((string) ($subRow[$c] ?? ''));

            if ($group !== '') {
                $lastGroup = $group;
                $kolomNama[$c] = $sub !== '' ? "{$group} - {$sub}" : $group;
            } elseif ($sub !== '' && $lastGroup !== null) {
                // kolom ini kosong di baris grup karena cell "grup"-nya ke-merge dari kolom
                // sebelah kiri - tapi baris sub-hari-nya keisi, jadi ini lanjutan grup yang sama
                $kolomNama[$c] = "{$lastGroup} - {$sub}";
            }
            // group & sub dua-duanya kosong -> bukan kolom kegiatan yang valid, diabaikan
        }

        if (empty($kolomNama)) {
            return [
                'type' => 'matrix', 'columns' => [], 'guru' => [],
                'error' => 'Gak nemu kolom kegiatan yang valid (baris nama grup kegiatan & sub-judulnya kosong semua).',
            ];
        }

        $kolomIdxUrut = array_keys($kolomNama); // urutan kolom asli di sheet, dipakai buat ambil status per baris guru

        $dataStart = $headerIdx + 3;
        $guruRows = [];
        for ($i = $dataStart; $i < count($rows); $i++) {
            $row = $rows[$i];
            $namaGuru = trim((string) ($row[$namaColIdx] ?? ''));
            if ($namaGuru === '') continue; // baris kosong nyempil, lewati aja - jangan berhenti total

            $statusPerKolom = [];
            foreach ($kolomIdxUrut as $c) {
                $statusPerKolom[] = self::normalisasiStatus($row[$c] ?? '');
            }

            $guruRows[] = [
                'nama' => $namaGuru,
                'jabatan' => trim((string) ($row[$jabatanColIdx] ?? '')),
                'status' => $statusPerKolom,
            ];
        }

        return [
            'type' => 'matrix',
            'columns' => array_values($kolomNama),
            'guru' => $guruRows,
        ];
    }

    private static function normalisasiStatus($value): ?string
    {
        $v = mb_strtolower(trim((string) $value));
        if ($v === '') return null;
        if (str_contains($v, 'sakit')) return 'S';
        if (str_contains($v, 'izin') || str_contains($v, 'ijin')) return 'I';
        if (str_contains($v, 'alpa') || str_contains($v, 'alfa') || str_contains($v, 'tanpa keterangan')) return 'A';
        if (str_contains($v, 'dinas')) return 'D';
        if (str_contains($v, 'hadir')) return 'H';
        return null; // teks yang gak dikenali - jangan ditebak, biarin kosong
    }

    // ---------- FORMAT FLAT (fallback: Nama Kegiatan + Tanggal per baris) ----------

    private static function cariBarisHeaderFlat(array $rows): ?int
    {
        foreach ($rows as $idx => $row) {
            $norm = array_map(fn ($c) => self::normalisasi((string) $c), $row);
            $adaNama = array_intersect(self::KANDIDAT_NAMA_KEGIATAN_FLAT, $norm);
            $adaTanggal = array_intersect(self::KANDIDAT_TANGGAL_FLAT, $norm);
            if (!empty($adaNama) && !empty($adaTanggal)) return $idx;
        }
        return null;
    }

    private static function parseFlat(array $rows, int $headerIdx): array
    {
        $headerRow = array_values($rows[$headerIdx] ?? []);
        $namaIdx = null;
        $tanggalIdx = null;
        foreach ($headerRow as $idx => $cell) {
            $norm = self::normalisasi((string) $cell);
            if ($namaIdx === null && in_array($norm, self::KANDIDAT_NAMA_KEGIATAN_FLAT, true)) $namaIdx = $idx;
            if ($tanggalIdx === null && in_array($norm, self::KANDIDAT_TANGGAL_FLAT, true)) $tanggalIdx = $idx;
        }

        $out = [];
        for ($i = $headerIdx + 1; $i < count($rows); $i++) {
            $row = $rows[$i];
            $nama = trim((string) ($row[$namaIdx] ?? ''));
            $tanggal = GridAbsensiParser::parseTanggalFleksibel($row[$tanggalIdx] ?? null);
            if ($nama === '' || !$tanggal) continue;
            $out[] = ['nama' => $nama, 'tanggal' => $tanggal];
        }

        return ['type' => 'flat', 'rows' => $out];
    }

    private static function cariKolom(array $headerRow, array $kandidat, int $fallback): int
    {
        foreach ($headerRow as $idx => $cell) {
            if (in_array(self::normalisasi((string) $cell), $kandidat, true)) return $idx;
        }
        return $fallback;
    }

    private static function normalisasi(string $s): string
    {
        return strtolower(preg_replace('/[^a-z0-9]/i', '', $s));
    }
}
