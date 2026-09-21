<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\GuruController;
use App\Http\Controllers\Api\KegiatanController;
use App\Http\Controllers\Api\KetidakhadiranController;
use App\Http\Controllers\Api\ExportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Login: dibatasi rate limit ketat (6x percobaan/menit) biar gak gampang
| di-brute-force, dan gak perlu login buat bisa nyoba login (jelas ya).
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');

/*
|--------------------------------------------------------------------------
| SEMUA route di bawah ini WAJIB login (Sanctum token) + dibatasi rate limit,
| biar gak bisa diakses/di-spam orang luar yang gak punya akun.
| 'throttle:api' pakai limiter default Laravel (60 request/menit/user).
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Data Master Guru - source of truth semua halaman
    Route::get('/guru', [GuruController::class, 'index']);
    Route::post('/guru', [GuruController::class, 'store']);
    Route::delete('/guru/{guru}', [GuruController::class, 'destroy']);
    Route::post('/guru/import', [GuruController::class, 'import']);

    // Dashboard rekap kehadiran guru mengajar
    Route::get('/dashboard/rekap', [DashboardController::class, 'rekap']);

    // Presensi kegiatan (jurnal per event/agenda)
    Route::get('/kegiatan', [KegiatanController::class, 'index']);
    Route::get('/kegiatan/matrix', [KegiatanController::class, 'matrix']);
    Route::post('/kegiatan', [KegiatanController::class, 'store']);
    Route::post('/kegiatan/{kegiatan}/kehadiran', [KegiatanController::class, 'updateAttendance']);

    // Ketidakhadiran & disposisi inval
    Route::get('/ketidakhadiran', [KetidakhadiranController::class, 'index']);
    Route::post('/ketidakhadiran', [KetidakhadiranController::class, 'store']);
    Route::get('/ketidakhadiran/dari-spreadsheet', [KetidakhadiranController::class, 'fromSpreadsheet']);

    // Export rekap (pilihan periode: week / month / months_back / semester)
    Route::get('/export/kehadiran', [ExportController::class, 'kehadiran']);
});
