<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Guru extends Model
{
    protected $table = 'guru';

    protected $fillable = ['nama', 'nip', 'jabatan', 'mapel', 'aktif'];

    public function kehadiran()
    {
        return $this->hasMany(Kehadiran::class);
    }

    public function ketidakhadiran()
    {
        return $this->hasMany(Ketidakhadiran::class);
    }
}
