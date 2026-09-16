<?php

use Illuminate\Support\Facades\Schedule;

// Sinkronisasi otomatis dari file Excel presensi, tiap hari jam 07:00 pagi
// (sebelum jam pertama KBM, jadi data hari sebelumnya sudah pasti fix)
Schedule::command('sync:kehadiran-excel')
    ->dailyAt('07:00')
    ->onOneServer()
    ->withoutOverlapping();

// Sinkronisasi ketidakhadiran guru (izin/sakit/alpa/dinas luar) tiap 15 menit,
// jadi begitu file Excel-nya diubah, sistem ikut update dalam hitungan menit.
Schedule::command('sync:ketidakhadiran-excel')
    ->everyFifteenMinutes()
    ->onOneServer()
    ->withoutOverlapping();
