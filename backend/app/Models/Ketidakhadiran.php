<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ketidakhadiran extends Model
{
    protected $table = 'ketidakhadiran';

    protected $fillable = [
        'guru_id', 'mapel', 'hari', 'tanggal', 'jam_ke', 'kelas', 'kode', 'guru_pengganti', 'catatan',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'kelas' => 'array',
    ];

    public function guru()
    {
        return $this->belongsTo(Guru::class);
    }
}
