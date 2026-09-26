<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\GuruController;
use App\Http\Controllers\Api\KegiatanController;
use App\Http\Controllers\Api\KetidakhadiranController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\TahunAjaranController;
use App\Http\Controllers\Api\UserController;
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

    /*
    |----------------------------------------------------------------------
    | READ-ONLY: bisa diakses SEMUA role yang login (super_admin & admin),
    | termasuk export/cetak PDF - role "admin" tetap butuh ini buat kerjanya
    | (liat data + download laporan), cuma gak boleh ubah apa-apa.
    |----------------------------------------------------------------------
    */
    Route::get('/guru', [GuruController::class, 'index']);
    Route::get('/tahun-ajaran', [TahunAjaranController::class, 'index']);
    Route::get('/dashboard/rekap', [DashboardController::class, 'rekap']);
    Route::get('/kegiatan', [KegiatanController::class, 'index']);
    Route::get('/kegiatan/matrix', [KegiatanController::class, 'matrix']);
    Route::get('/ketidakhadiran', [KetidakhadiranController::class, 'index']);
    Route::get('/export/kehadiran', [ExportController::class, 'kehadiran']);

    /*
    |----------------------------------------------------------------------
    | WRITE (tambah/ubah/hapus/import): KHUSUS super_admin. Role "admin"
    | kena 403 kalau nyoba akses salah satu dari ini (dicek di frontend
    | juga biar tombolnya gak ditampilin sama sekali, tapi validasi yang
    | sesungguhnya tetap di sini).
    |----------------------------------------------------------------------
    */
    Route::middleware('super_admin')->group(function () {
        // Data Master Guru
        Route::post('/guru', [GuruController::class, 'store']);
        Route::put('/guru/{guru}', [GuruController::class, 'update']);
        Route::patch('/guru/{guru}', [GuruController::class, 'update']);
        Route::delete('/guru/{guru}', [GuruController::class, 'destroy']);
        Route::post('/guru/import', [GuruController::class, 'import']);

        // Tahun Ajaran
        Route::post('/tahun-ajaran', [TahunAjaranController::class, 'store']);
        Route::put('/tahun-ajaran/{tahunAjaran}', [TahunAjaranController::class, 'update']);
        Route::post('/tahun-ajaran/{tahunAjaran}/aktifkan', [TahunAjaranController::class, 'aktifkan']);
        Route::delete('/tahun-ajaran/{tahunAjaran}', [TahunAjaranController::class, 'destroy']);

        // Presensi kegiatan
        Route::post('/kegiatan', [KegiatanController::class, 'store']);
        Route::put('/kegiatan/{kegiatan}', [KegiatanController::class, 'update']);
        Route::post('/kegiatan/parse', [KegiatanController::class, 'parse']);
        Route::post('/kegiatan/import-matrix', [KegiatanController::class, 'importMatrix']);
        Route::post('/kegiatan/{kegiatan}/kehadiran', [KegiatanController::class, 'updateAttendance']);

        // Ketidakhadiran & disposisi inval
        Route::post('/ketidakhadiran', [KetidakhadiranController::class, 'store']);
        Route::get('/ketidakhadiran/dari-spreadsheet', [KetidakhadiranController::class, 'fromSpreadsheet']);
        Route::post('/ketidakhadiran/import-grid', [KetidakhadiranController::class, 'importGrid']);
        Route::get('/ketidakhadiran/dari-spreadsheet-grid', [KetidakhadiranController::class, 'fromSpreadsheetGrid']);

        // Manajemen akun
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });
});
