<?php

namespace App\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Format rekap ketidakhadiran yang sebenarnya dipakai sekolah BUKAN tabel panjang (satu baris per
 * kejadian), tapi grid: baris = guru, kolom = tanggal (dropdown isinya jumlah jam gak hadir), dan
 * di paling bawah ada baris "Keterangan" isinya catatan bebas per tanggal.
 *
 * Masalahnya: guru sering nulis ketidakhadirannya di baris Keterangan itu ("Bu Holilah tidak masuk
 * 3 jam") padahal cell dropdown di baris & kolom yang seharusnya dibiarkan kosong. Parser ini:
 *   1. Nemuin baris header (kolom tanggal) & baris Keterangan secara otomatis (posisi bebas).
 *   2. Baca angka yang sudah keisi manual di cell dropdown (kalau ada).
 *   3. Baca & parse teks bebas di baris Keterangan per kolom tanggal, cari nama guru yang
 *      disebut + jam (kalau ada) + kode ketidakhadirannya (lihat KeteranganAbsensiParser).
 *   4. Gabungkan keduanya: kalau cell dropdown kosong tapi ada di teks Keterangan, itu yang
 *      dipakai buat "nembak" langsung ke tanggal & guru yang tepat - sesuai kebutuhan supaya
 *      guru yang salah tempat nulis tetap kecatat ke kolom yang benar.
 */
class GridAbsensiParser
{
    private const BULAN_ID = [
        'januari' => 1, 'februari' => 2, 'maret' => 3, 'april' => 4, 'mei' => 5, 'juni' => 6,
        'juli' => 7, 'agustus' => 8, 'september' => 9, 'oktober' => 10, 'november' => 11, 'desember' => 12,
    ];

    /**
     * @param array $rows Baris mentah spreadsheet (0-based index), tiap baris array cell mentah.
     * @return array{records: array, ringkasan: array}
     */
    public static function parse(array $rows, Collection $guruList): array
    {
        $rows = array_values($rows);
        $headerIdx = self::cariBarisHeader($rows);
        if ($headerIdx === null) {
            return [
                'records' => [],
                'ringkasan' => [
                    'error' => 'Gak nemu baris header (kolom "Nama Guru" diikuti kolom-kolom tanggal) di file ini.',
                ],
            ];
        }

        $headerRow = array_values($rows[$headerIdx]);
        $namaColIdx = self::cariKolomNama($headerRow);

        $kolomTanggal = []; // colIdx => Y-m-d
        foreach ($headerRow as $colIdx => $cell) {
            if ($colIdx <= $namaColIdx) continue;
            $tgl = self::parseTanggalFleksibel($cell);
            if ($tgl) $kolomTanggal[$colIdx] = $tgl;
        }

        // cari baris "Keterangan" di bawah header (biasanya paling bawah, setelah semua baris guru)
        $keteranganIdx = null;
        for ($i = $headerIdx + 1; $i < count($rows); $i++) {
            $cell = $rows[$i][$namaColIdx] ?? '';
            if (self::normalisasi((string) $cell) === 'keterangan') {
                $keteranganIdx = $i;
                break;
            }
        }
        $batasBarisGuru = $keteranganIdx ?? count($rows);

        $namaTidakKetemu = [];
        $dropdownByKey = []; // "guruId|tanggal" => jam (int)

        for ($i = $headerIdx + 1; $i < $batasBarisGuru; $i++) {
            $row = $rows[$i] ?? [];
            $namaGuru = trim((string) ($row[$namaColIdx] ?? ''));
            if ($namaGuru === '') continue;

            $guru = GuruMatcher::findBestMatch($namaGuru, $guruList);
            if (!$guru) {
                $namaTidakKetemu[] = $namaGuru;
                continue;
            }

            foreach ($kolomTanggal as $colIdx => $tanggal) {
                $jam = self::parseAngka($row[$colIdx] ?? null);
                if ($jam !== null && $jam > 0) {
                    $dropdownByKey["{$guru->id}|{$tanggal}"] = $jam;
                }
            }
        }

        // parse baris Keterangan per kolom tanggal
        $dariKeterangan = []; // "guruId|tanggal" => item hasil KeteranganAbsensiParser
        if ($keteranganIdx !== null) {
            $row = $rows[$keteranganIdx] ?? [];
            foreach ($kolomTanggal as $colIdx => $tanggal) {
                $teks = trim((string) ($row[$colIdx] ?? ''));
                if ($teks === '') continue;
                foreach (KeteranganAbsensiParser::parse($teks, $guruList) as $item) {
                    $dariKeterangan["{$item['guru']->id}|{$tanggal}"] = $item;
                }
            }
        }

        // gabungkan: dropdown (manual, jam paling akurat) + keterangan (nemuin yang KELEWAT
        // di dropdown, dan ngasih kode/pengganti/catatan yang lebih detail)
        $records = [];
        $overlap = 0;
        $semuaKey = array_unique(array_merge(array_keys($dropdownByKey), array_keys($dariKeterangan)));

        foreach ($semuaKey as $key)
        {
            [$guruId, $tanggal] = explode('|', $key, 2);
            $adaDropdown = array_key_exists($key, $dropdownByKey);
            $adaKeterangan = array_key_exists($key, $dariKeterangan);

            if ($adaDropdown && $adaKeterangan) {
                $overlap++;
                $k = $dariKeterangan[$key];
                $records[] = [
                    'guru_id' => (int) $guruId, 'tanggal' => $tanggal,
                    'jam' => $dropdownByKey[$key], 'kode' => $k['kode'],
                    'guru_pengganti' => $k['pengganti'], 'catatan' => $k['catatan'],
                    'sumber' => 'dropdown+keterangan',
                ];
            } elseif ($adaDropdown) {
                $records[] = [
                    'guru_id' => (int) $guruId, 'tanggal' => $tanggal,
                    'jam' => $dropdownByKey[$key], 'kode' => 'I', 'guru_pengganti' => null,
                    'catatan' => 'Terisi jumlah jam di kolom tanggal, tanpa rincian keterangan.',
                    'sumber' => 'dropdown',
                ];
            } else {
                $k = $dariKeterangan[$key];
                $records[] = [
                    'guru_id' => (int) $guruId, 'tanggal' => $tanggal,
                    'jam' => $k['jam'], 'kode' => $k['kode'], 'guru_pengganti' => $k['pengganti'],
                    'catatan' => $k['catatan'], 'sumber' => 'keterangan',
                ];
            }
        }

        return [
            'records' => $records,
            'ringkasan' => [
                'total_kolom_tanggal' => count($kolomTanggal),
                'total_baris_guru' => $batasBarisGuru - $headerIdx - 1,
                'dari_dropdown' => count($dropdownByKey),
                'dari_keterangan' => count($dariKeterangan),
                // ini angka yang paling penting buat user: berapa entri yang KETOLONG kepasang
                // ke kolom yang benar padahal cuma ditulis di teks bebas Keterangan
                'tertolong_dari_keterangan' => count($dariKeterangan) - $overlap,
                'nama_tidak_ketemu' => array_values(array_unique($namaTidakKetemu)),
            ],
        ];
    }

    private static function cariBarisHeader(array $rows): ?int
    {
        foreach ($rows as $idx => $row) {
            foreach ($row as $cell) {
                if (in_array(self::normalisasi((string) $cell), ['namaguru', 'nama'], true)) {
                    return $idx;
                }
            }
        }
        return null;
    }

    private static function cariKolomNama(array $headerRow): int
    {
        foreach ($headerRow as $colIdx => $cell) {
            if (in_array(self::normalisasi((string) $cell), ['namaguru', 'nama'], true)) {
                return $colIdx;
            }
        }
        return 1; // fallback: kolom "Nama Guru" biasanya kolom ke-2 (index 1) di format sekolah ini
    }

    private static function normalisasi(string $s): string
    {
        return strtolower(preg_replace('/[^a-z0-9]/i', '', $s));
    }

    private static function parseAngka($value): ?int
    {
        if ($value === null || $value === '') return null;
        if (is_numeric($value)) return (int) round((float) $value);
        return null;
    }

    // Public (bukan private) - dipakai ulang juga sama KegiatanMatrixParser buat format Excel
    // event yang juga punya kolom tanggal fleksibel (dd/mm/yyyy atau teks Indonesia).
    public static function parseTanggalFleksibel($value): ?string
    {
        if ($value === null || $value === '') return null;

        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        if (is_numeric($value)) {
            // Excel serial date - dibatasi rentang wajar biar gak salah anggap angka jam biasa
            if ($value > 20000 && $value < 60000) {
                try {
                    return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value)->format('Y-m-d');
                } catch (\Throwable $e) {
                    return null;
                }
            }
            return null;
        }

        $value = trim((string) $value);
        if ($value === '') return null;

        if (preg_match('#^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$#', $value, $m)) {
            $day = (int) $m[1];
            $month = (int) $m[2];
            if ($day <= 31 && $month <= 12) {
                try {
                    return Carbon::createFromFormat('d/m/Y', "{$day}/{$month}/{$m[3]}")->format('Y-m-d');
                } catch (\Throwable $e) {
                    // lanjut ke parser lain di bawah
                }
            }
        }

        // format teks Indonesia, contoh: "29 Juli 2026", "10 Agustus 2026"
        if (preg_match('/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/u', $value, $m)) {
            $bulan = self::BULAN_ID[mb_strtolower($m[2])] ?? null;
            if ($bulan) {
                try {
                    return Carbon::createFromDate((int) $m[3], $bulan, (int) $m[1])->format('Y-m-d');
                } catch (\Throwable $e) {
                    // lanjut ke parser lain di bawah
                }
            }
        }

        try {
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }
}
