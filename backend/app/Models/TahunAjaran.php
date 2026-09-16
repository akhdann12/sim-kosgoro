<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TahunAjaran extends Model
{
    protected $table = 'tahun_ajaran';

    protected $fillable = ['nama', 'semester', 'tanggal_mulai', 'tanggal_selesai', 'aktif'];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
    ];

    public function kegiatan()
    {
        return $this->hasMany(Kegiatan::class);
    }
}
