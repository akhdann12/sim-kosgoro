<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    // Rekap kehadiran KBM harian per guru (sumber sinkronisasi Excel)
    public function up(): void
    {
        Schema::create('kehadiran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guru_id')->constrained('guru')->cascadeOnDelete();
            $table->foreignId('kegiatan_id')->nullable()->constrained('kegiatan')->nullOnDelete();
            $table->date('tanggal');
            $table->enum('status', ['H', 'I', 'S', 'A']); // Hadir, Izin, Sakit, Alpa
            $table->string('keterangan')->nullable();
            $table->string('sumber')->default('manual'); // manual | excel_sync
            $table->timestamps();

            $table->unique(['guru_id', 'tanggal', 'kegiatan_id'], 'kehadiran_unique_entry');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kehadiran');
    }
};
