<?php

// Config tambahan khusus SIM Kosgoro. Copy file ini ke config/kosgoro.php pada project Laravel.
return [
    // Lokasi file Excel presensi kehadiran harian yang mau disinkron otomatis tiap hari.
    'excel_sync_path' => env('EXCEL_SYNC_PATH', storage_path('app/presensi/presensi_harian.xlsx')),

    // Lokasi file Excel ketidakhadiran guru (guru izin/sakit/alpa/dinas luar) yang mau disinkron otomatis.
    'excel_ketidakhadiran_path' => env('EXCEL_KETIDAKHADIRAN_PATH', storage_path('app/presensi/ketidakhadiran.xlsx')),
];
