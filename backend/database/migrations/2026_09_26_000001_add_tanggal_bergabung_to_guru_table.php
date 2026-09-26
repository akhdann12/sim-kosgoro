<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Guru yang gabung di tengah semester (bukan dari awal tahun ajaran) butuh tanggal referensi
 * biar Dashboard gak menghitung hari SEBELUM dia gabung sebagai "Hadir" secara default.
 * Kalau kolom ini NULL, guru dianggap sudah ada sejak awal periode manapun (perilaku lama).
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('guru', function (Blueprint $table) {
            $table->date('tanggal_bergabung')->nullable()->after('aktif');
        });
    }

    public function down(): void
    {
        Schema::table('guru', function (Blueprint $table) {
            $table->dropColumn('tanggal_bergabung');
        });
    }
};
