<?php

use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\KegiatanController;
use App\Http\Controllers\Api\KetidakhadiranController;
use App\Http\Controllers\Api\ExportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| SEMUA route di bawah ini WAJIB login (Sanctum) + dibatasi rate limit,
| biar gak bisa diakses/di-spam orang luar yang gak punya akun.
| 'throttle:api' pakai limiter default Laravel (60 request/menit/user).
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    // Dashboard rekap kehadiran guru mengajar
    Route::get('/dashboard/rekap', [DashboardController::class, 'rekap']);

    // Presensi kegiatan (jurnal per event/agenda)
    Route::get('/kegiatan', [KegiatanController::class, 'index']);
    Route::get('/kegiatan/matrix', [KegiatanController::class, 'matrix']);
    Route::post('/kegiatan', [KegiatanController::class, 'store']);

    // Ketidakhadiran & disposisi inval
    Route::get('/ketidakhadiran', [KetidakhadiranController::class, 'index']);
    Route::post('/ketidakhadiran', [KetidakhadiranController::class, 'store']);
    Route::get('/ketidakhadiran/dari-spreadsheet', [KetidakhadiranController::class, 'fromSpreadsheet']);

    // Export rekap (pilihan periode: week / month / months_back / semester)
    Route::get('/export/kehadiran', [ExportController::class, 'kehadiran']);
});

// GET /api/user -> dipakai frontend buat cek "siapa yang lagi login" (disediakan otomatis
// oleh Laravel Breeze/Sanctum saat instalasi, ini cuma dokumentasi biar kelihatan lengkap)
// Route::middleware('auth:sanctum')->get('/user', fn (Request $r) => $r->user());
