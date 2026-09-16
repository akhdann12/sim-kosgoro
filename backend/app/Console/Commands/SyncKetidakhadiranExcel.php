<?php

namespace App\Console\Commands;

use App\Imports\KetidakhadiranImport;
use Illuminate\Console\Command;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Sinkronisasi data ketidakhadiran guru dari file Excel yang sudah dipakai sekolah.
 *
 * Cara pakai manual:
 *   php artisan sync:ketidakhadiran-excel
 *   php artisan sync:ketidakhadiran-excel /path/lain/ketidakhadiran.xlsx
 *
 * Jadwalkan otomatis (misal tiap 15 menit) lewat scheduler, lihat routes/console.php.
 */
class SyncKetidakhadiranExcel extends Command
{
    protected $signature = 'sync:ketidakhadiran-excel {path?}';

    protected $description = 'Sinkronisasi data ketidakhadiran guru dari file Excel';

    public function handle(): int
    {
        $path = $this->argument('path') ?? config('kosgoro.excel_ketidakhadiran_path');

        if (!$path || !file_exists($path)) {
            $this->error("File Excel tidak ditemukan di: {$path}");
            $this->line('Set path default lewat env EXCEL_KETIDAKHADIRAN_PATH, atau kirim argument path.');
            return self::FAILURE;
        }

        $this->info("Memulai sinkronisasi ketidakhadiran dari: {$path}");

        Excel::import(new KetidakhadiranImport, $path);

        $this->info('Sinkronisasi ketidakhadiran selesai.');
        return self::SUCCESS;
    }
}
