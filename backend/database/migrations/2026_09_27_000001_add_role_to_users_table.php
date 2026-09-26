<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Dua role:
 *  - super_admin: bisa lakuin semua (tambah/ubah/hapus/import data, atur Tahun Ajaran, dst)
 *  - admin: cuma bisa LIHAT data (Dashboard, tabel Ketidakhadiran, Presensi Kegiatan, Data Master
 *    Guru), TAPI tetap bisa Export/Cetak PDF. Gak bisa nambah/ubah/hapus/import apapun.
 *
 * Default 'super_admin' buat akun yang udah ada sebelum kolom ini ditambahkan, biar gak ada yang
 * tiba-tiba kehilangan akses begitu migration ini jalan.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('super_admin')->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
