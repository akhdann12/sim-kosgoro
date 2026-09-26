<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;

/**
 * Baca file yang diupload user (CSV atau Excel) jadi array baris mentah (0-based index, tiap
 * baris array cell mentah) - bentuk yang sama persis dipakai GridAbsensiParser & KegiatanMatrixParser
 * baik file-nya CSV maupun Excel.
 *
 * PENTING: file .csv dibaca pakai fungsi PHP bawaan (fopen + fgetcsv) - GAK BUTUH package
 * tambahan apapun. File .xlsx/.xls baru butuh package "phpoffice/phpspreadsheet" (composer
 * require phpoffice/phpspreadsheet). Ini sengaja dipisah gitu supaya sekolah yang export dari
 * Google Sheets sebagai CSV (paling umum & paling gampang) tetap bisa langsung jalan tanpa
 * kepentok dependency composer yang belum ke-install / gak bisa diinstall (misal lagi kena
 * masalah jaringan ke packagist.org).
 */
class SpreadsheetReader
{
    /**
     * @throws \RuntimeException kalau file .xlsx/.xls diupload tapi package phpspreadsheet belum ke-install
     */
    public static function readRows(UploadedFile $file): array
    {
        $ext = strtolower($file->getClientOriginalExtension());
        $path = $file->getRealPath();

        if ($ext === 'csv' || $ext === 'txt') {
            return self::readCsv($path);
        }

        return self::readExcel($path);
    }

    private static function readCsv(string $path): array
    {
        $rows = [];
        $handle = fopen($path, 'r');
        if ($handle === false) {
            throw new \RuntimeException('Gak bisa buka file CSV-nya.');
        }

        // Lewatin BOM UTF-8 di awal file kalau ada (umum banget di file yang di-export dari
        // Google Sheets/Excel), biar cell pertama di baris pertama gak kebawa karakter aneh.
        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            rewind($handle);
        }

        while (($row = fgetcsv($handle)) !== false) {
            $rows[] = $row;
        }
        fclose($handle);

        return $rows;
    }

    private static function readExcel(string $path): array
    {
        if (!class_exists(\PhpOffice\PhpSpreadsheet\IOFactory::class)) {
            throw new \RuntimeException(
                'Package "phpoffice/phpspreadsheet" belum ke-install di server, jadi file .xlsx/.xls belum bisa '
                . 'dibaca. Jalankan "composer require phpoffice/phpspreadsheet" di folder backend (butuh koneksi '
                . 'internet ke packagist.org), ATAU buat sementara export file-nya sebagai .csv dari Google '
                . 'Sheets/Excel (File > Download > Comma Separated Values) - format CSV bisa langsung dipakai '
                . 'tanpa package tambahan.'
            );
        }

        $rows = \PhpOffice\PhpSpreadsheet\IOFactory::load($path)
            ->getActiveSheet()
            ->toArray(null, true, false, false);

        return $rows;
    }
}
