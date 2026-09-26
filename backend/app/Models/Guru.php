<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Guru extends Model
{
    protected $table = 'guru';

    protected $fillable = ['nama', 'nip', 'jabatan', 'mapel', 'aktif', 'tanggal_bergabung'];

    protected $casts = [
        'tanggal_bergabung' => 'date',
    ];

    public function kehadiran()
    {
        return $this->hasMany(Kehadiran::class);
    }

    public function ketidakhadiran()
    {
        return $this->hasMany(Ketidakhadiran::class);
    }
}
