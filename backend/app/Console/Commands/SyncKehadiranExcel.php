<?php

namespace App\Console\Commands;

use App\Imports\KehadiranImport;
use Illuminate\Console\Command;
use Maatwebsite\Excel\Facades\Excel;

/**
 * Sinkronisasi harian dari file Excel presensi guru yang sudah ada.
 *
 * Cara pakai manual:
 *   php artisan sync:kehadiran-excel
 *   php artisan sync:kehadiran-excel /path/lain/presensi.xlsx
 *
 * Jadwalkan otomatis tiap hari lewat scheduler (lihat routes/console.php).
 */
class SyncKehadiranExcel extends Command
{
    protected $signature = 'sync:kehadiran-excel {path?}';

    protected $description = 'Sinkronisasi data kehadiran guru dari file Excel harian';

    public function handle(): int
    {
        $path = $this->argument('path') ?? config('kosgoro.excel_sync_path');

        if (!$path || !file_exists($path)) {
            $this->error("File Excel tidak ditemukan di: {$path}");
            $this->line('Set path default lewat env EXCEL_SYNC_PATH, atau kirim argument path.');
            return self::FAILURE;
        }

        $this->info("Memulai sinkronisasi dari: {$path}");

        Excel::import(new KehadiranImport, $path);

        $this->info('Sinkronisasi kehadiran selesai.');
        return self::SUCCESS;
    }
}
