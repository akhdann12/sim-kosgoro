<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    // Catatan ketidakhadiran + disposisi guru pengganti (inval)
    public function up(): void
    {
        Schema::create('ketidakhadiran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('guru_id')->constrained('guru')->cascadeOnDelete();
            $table->string('mapel')->nullable();
            $table->string('hari');
            $table->date('tanggal');
            $table->string('jam_ke')->nullable(); // "Jam 1 - 4"
            $table->json('kelas')->nullable(); // ["X RPL", "XI TKJ"]
            $table->enum('kode', ['S', 'I', 'A', 'D']); // Sakit, Izin, Alpa, Dinas Luar
            $table->string('guru_pengganti')->nullable(); // Inval: nama guru / Tugas Mandiri
            $table->string('catatan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ketidakhadiran');
    }
};
