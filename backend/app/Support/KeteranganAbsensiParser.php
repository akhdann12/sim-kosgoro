<?php

namespace App\Support;

use App\Models\Guru;
use Illuminate\Support\Collection;

/**
 * Guru sering nulis ketidakhadiran di kolom "Keterangan" bebas teks (bukan di cell dropdown
 * jam per tanggal yang seharusnya), contoh nyata:
 *
 *   "Bu Holilah tidak masuk 3 jam"
 *   "pak yazid inval bu laras 8 jam, piket noya"
 *   "Furqon inval bu laras 2 jam"
 *   "Tegar piket, semua guru hadir repat waktu, Pak Adi tidak hadir 4 jam, Bu Noya sakit"
 *   "Bu Fetry inval Bu Noya, Bu Erfina ijin jaga ayahnya sakit, Bu Marsel telat 2 jam, Bu Eren telat 4 jam."
 *
 * Class ini mecah teks itu jadi klausa per orang, cari nama guru yang disebut (toleran nama
 * panggilan/singkatan/typo kecil - "Marsel" -> "Marselina", "Tegar" -> "Teghar"), lalu nentuin
 * kode ketidakhadirannya dari kata kunci yang ada. Kalau ada pola "X inval Y", yang dianggap
 * TIDAK HADIR adalah Y (yang digantikan), bukan X (yang piket gantiin) - "piket" doang tanpa kata
 * kunci ketidakhadiran lain dianggap HADIR makanya diabaikan.
 *
 * Jam ditulis di teks kalau ada ("3 jam", "8 jam"). Kalau gak disebutkan, jam dibiarkan NULL -
 * bukan ditebak - biar sistem penjadwalan/jam guru yang nentuin sendiri, sesuai instruksi: jangan
 * asal tembak jumlah jam kalau memang gak ada infonya di teks.
 */
class KeteranganAbsensiParser
{
    private const KODE_KEYWORDS = [
        // urutan penting: dicek dari atas, keyword lebih spesifik duluan
        'S' => ['sakit', 'demam', 'opname', 'dirawat', 'periksa dokter', 'ke dokter'],
        'D' => ['dinas', 'tugas luar', 'diklat', 'workshop', 'undangan dinas', 'rapat dinas'],
        'I' => [
            'izin', 'ijin', 'cuti', 'berobat', 'antar anak', 'jaga', 'urusan keluarga',
            'melahirkan', 'menikah', 'acara keluarga', 'keperluan keluarga',
        ],
        'A' => ['alpa', 'tanpa keterangan', 'tidak hadir', 'tidak masuk', 'tdk hadir', 'tdk masuk'],
    ];

    // Kata kerja yang nunjukin keterlambatan - dianggap ketidakhadiran parsial (kode Izin)
    private const KATA_TELAT = ['telat', 'terlambat'];

    // Stopword umum yang sering muncul & bisa mirip potongan nama - jangan dianggap nama guru
    private const STOPWORD = [
        'bu', 'ibu', 'pak', 'bapak', 'dan', 'semua', 'guru', 'piket', 'hadir', 'tepat',
        'waktu', 'repat', 'tidak', 'masuk', 'jam', 'inval', 'sakit', 'izin', 'ijin', 'alpa',
        'dinas', 'telat', 'terlambat', 'anak', 'ayahnya', 'ibunya', 'jaga', 'datang',
    ];

    /**
     * @return array<int, array{guru: Guru, jam: int|null, kode: string, pengganti: ?string, catatan: string}>
     */
    public static function parse(string $teks, Collection $guruList): array
    {
        $teks = trim($teks);
        if ($teks === '') return [];

        $hasil = [];
        $sudahDiproses = []; // guru_id yang udah dapet entry, biar 1 guru 1 tanggal gak dobel dari klausa lain

        // pecah per klausa (koma / titik) biar konteks satu orang gak ketuker ke orang lain
        $klausaList = preg_split('/[,.;\n]+/u', $teks) ?: [$teks];

        foreach ($klausaList as $klausa) {
            $klausa = trim($klausa);
            if ($klausa === '') continue;

            // Pola "X inval Y (N jam)" -> Y yang tidak hadir, X guru pengganti
            if (preg_match('/\binval\b/i', $klausa)) {
                $bagian = preg_split('/\binval\b/i', $klausa, 2);
                $kiri = $bagian[0] ?? '';
                $kanan = $bagian[1] ?? '';

                $pengganti = self::guruTerbaikDalamTeks($kiri, $guruList);
                $digantiList = self::semuaGuruDalamTeks($kanan, $guruList);

                foreach ($digantiList as $diganti) {
                    if (isset($sudahDiproses[$diganti->id])) continue;
                    $sudahDiproses[$diganti->id] = true;
                    $hasil[] = [
                        'guru' => $diganti,
                        'jam' => self::ekstrakJam($klausa),
                        'kode' => self::ekstrakKode($klausa) ?? 'I', // default Izin kalau ada yang inval-in tapi alasan gak disebut
                        'pengganti' => $pengganti?->nama,
                        'catatan' => $klausa,
                    ];
                }
                continue;
            }

            // "... piket" doang tanpa indikasi ketidakhadiran lain = guru itu HADIR (lagi piket),
            // bukan absen - jangan dianggap ketidakhadiran.
            $adaIndikasiAbsen = self::ekstrakKode($klausa) !== null || self::adaKataTelat($klausa);
            if (!$adaIndikasiAbsen) continue;

            $guruDisebut = self::semuaGuruDalamTeks($klausa, $guruList);
            if (empty($guruDisebut)) continue;

            $kode = self::ekstrakKode($klausa) ?? (self::adaKataTelat($klausa) ? 'I' : null);
            if ($kode === null) continue;

            $jam = self::ekstrakJam($klausa);

            foreach ($guruDisebut as $guru) {
                if (isset($sudahDiproses[$guru->id])) continue;
                $sudahDiproses[$guru->id] = true;
                $hasil[] = [
                    'guru' => $guru,
                    'jam' => $jam,
                    'kode' => $kode,
                    'pengganti' => null,
                    'catatan' => $klausa,
                ];
            }
        }

        return $hasil;
    }

    private static function adaKataTelat(string $klausa): bool
    {
        $lower = mb_strtolower($klausa);
        foreach (self::KATA_TELAT as $kw) {
            if (str_contains($lower, $kw)) return true;
        }
        return false;
    }

    private static function ekstrakKode(string $klausa): ?string
    {
        $lower = mb_strtolower($klausa);
        foreach (self::KODE_KEYWORDS as $kode => $keywords) {
            foreach ($keywords as $kw) {
                if (str_contains($lower, $kw)) return $kode;
            }
        }
        return null;
    }

    private static function ekstrakJam(string $klausa): ?int
    {
        if (preg_match('/(\d+)\s*jam/i', $klausa, $m)) {
            return (int) $m[1];
        }
        return null;
    }

    /**
     * Ambil SEMUA guru yang disebut dalam potongan teks (bisa lebih dari satu, dipisah "dan").
     * Exact match (nama panggilan == persis salah satu kata di nama guru) diprioritaskan di atas
     * kecocokan prefix/typo-tolerant, biar nama pendek yang jadi awalan nama guru lain (contoh:
     * "Laras" persis vs "Larasyudha" yang cuma diawali "laras") gak keduanya ketembak sekaligus.
     */
    private static function semuaGuruDalamTeks(string $teks, Collection $guruList): array
    {
        $kata = self::pecahKataSignifikan($teks);
        if (empty($kata)) return [];

        $hasil = [];
        // Per KATA (bukan per klausa) - biar exact-match satu kata gak "menang" nutupin
        // fuzzy-match kata lain yang beda orang dalam klausa yang sama.
        foreach ($kata as $w) {
            $exact = [];
            $fuzzy = [];
            foreach ($guruList as $guru) {
                foreach (self::pecahKataSignifikan($guru->nama) as $bagian) {
                    if (mb_strtolower($w) === mb_strtolower($bagian)) {
                        $exact[$guru->id] = $guru;
                    } elseif (self::kataMirip($w, $bagian)) {
                        $fuzzy[$guru->id] = $guru;
                    }
                }
            }
            foreach (($exact ?: $fuzzy) as $id => $guru) {
                $hasil[$id] = $guru;
            }
        }

        return array_values($hasil);
    }

    /** Ambil guru paling cocok (dipakai buat sisi "pengganti" dalam pola inval). */
    private static function guruTerbaikDalamTeks(string $teks, Collection $guruList): ?Guru
    {
        $semua = self::semuaGuruDalamTeks($teks, $guruList);
        return $semua[0] ?? null;
    }

    /** Pecah teks jadi kata-kata "signifikan" (>=3 huruf, bukan stopword umum). */
    private static function pecahKataSignifikan(string $teks): array
    {
        $bersih = preg_replace('/[^a-zA-Z\s]/', ' ', $teks);
        $kata = preg_split('/\s+/', trim($bersih)) ?: [];
        return array_values(array_filter($kata, function ($w) {
            $w = mb_strtolower($w);
            return mb_strlen($w) >= 3 && !in_array($w, self::STOPWORD, true);
        }));
    }

    /** Cocokkan kata sebutan (nama panggilan) dengan bagian nama guru - toleran singkatan & typo kecil. */
    private static function kataMirip(string $kata, string $bagianNama): bool
    {
        $kata = mb_strtolower($kata);
        $bagianNama = mb_strtolower($bagianNama);
        if ($kata === $bagianNama) return true;
        if (mb_strlen($kata) < 4 || mb_strlen($bagianNama) < 4) return false;

        // nama panggilan biasanya potongan awal nama asli ("Marsel" dari "Marselina") atau sebaliknya
        if (str_starts_with($bagianNama, $kata) || str_starts_with($kata, $bagianNama)) return true;

        // toleransi typo kecil ("Tegar" vs "Teghar")
        similar_text($kata, $bagianNama, $percent);
        return $percent >= 80;
    }
}
