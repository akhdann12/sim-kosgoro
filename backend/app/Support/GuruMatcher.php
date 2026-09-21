<?php

namespace App\Support;

use App\Models\Guru;
use Illuminate\Support\Collection;

/**
 * Pencocokan nama guru yang toleran typo & beda format penulisan gelar.
 *
 * Contoh yang harus tetep nyambung:
 *   "Laras Dwi Febriyani, A.Md.Kom"  <->  "Laras Dwi Febriani, A.Md.Kom"   (typo 1 huruf)
 *   "Holilah Rahmawati, S.Si, M.Pd"  <->  "Holilah Rahmawati, S.Si"        (gelar beda)
 *   "Risma Rosita, S.Sth"            <->  "Risma Rosita A. S. S.Th"        (format beda)
 *
 * Caranya: normalisasi (huruf kecil semua, buang tanda baca/gelar), lalu dibandingkan pakai
 * similar_text() (persentase kemiripan). Bukan exact match, bukan cuma substring LIKE.
 */
class GuruMatcher
{
    public static function normalizeName(string $name): string
    {
        $name = strtolower($name);
        $name = preg_replace('/[^a-z\s]/', ' ', $name); // buang tanda baca, angka, titik gelar
        $name = preg_replace('/\s+/', ' ', trim($name));
        return $name;
    }

    /**
     * Cari guru paling mirip dari koleksi yang udah di-load (efisien buat dipanggil di dalam loop,
     * gak query database berkali-kali). Return null kalau gak ada yang cukup mirip.
     */
    public static function findBestMatch(string $namaDicari, Collection $guruList, int $minScore = 72): ?Guru
    {
        $namaDicari = trim($namaDicari);
        if ($namaDicari === '') return null;

        $target = self::normalizeName($namaDicari);
        if ($target === '') return null;

        $best = null;
        $bestScore = 0;

        foreach ($guruList as $guru) {
            $candidate = self::normalizeName($guru->nama);
            similar_text($target, $candidate, $percent);

            if ($percent > $bestScore) {
                $bestScore = $percent;
                $best = $guru;
            }
        }

        return $bestScore >= $minScore ? $best : null;
    }

    /** Sama seperti findBestMatch, tapi query sendiri dari database (dipakai di luar loop). */
    public static function findBestMatchByQuery(string $namaDicari, int $minScore = 72): ?Guru
    {
        return self::findBestMatch($namaDicari, Guru::all(), $minScore);
    }
}
