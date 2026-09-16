<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kegiatan extends Model
{
    protected $table = 'kegiatan';

    protected $fillable = ['tahun_ajaran_id', 'nama', 'tanggal'];

    protected $casts = [
        'tanggal' => 'date',
    ];

    public function kehadiran()
    {
        return $this->hasMany(Kehadiran::class);
    }
}
