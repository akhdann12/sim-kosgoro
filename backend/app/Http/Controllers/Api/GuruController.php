<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guru;
use App\Support\GuruMatcher;
use Illuminate\Http\Request;

class GuruController extends Controller
{
    // GET /api/guru
    public function index()
    {
        return response()->json(Guru::where('aktif', true)->orderBy('id')->get());
    }

    // POST /api/guru
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'jabatan' => 'required|string|max:255',
            'mapel' => 'nullable|string|max:255',
            'nip' => 'nullable|string|max:50',
            // Tanggal guru ini resmi mulai mengajar/aktif di sistem. Dipakai Dashboard biar guru
            // yang gabung di tengah semester gak dihitung "Hadir" buat hari-hari sebelum dia ada.
            // Kosongin kalau guru itu sudah ada sejak awal tahun ajaran / gak perlu batasan.
            'tanggal_bergabung' => 'nullable|date',
        ]);

        // PENTING: kolom nip itu unique. Kalau dibiarin string kosong "" (bukan null), guru
        // kedua yang NIP-nya kosong bakal gagal disimpan karena "" == "" dianggap bentrok.
        // NULL di database gak dianggap bentrok sama NULL lain, makanya harus di-null-in eksplisit.
        $validated['nip'] = !empty($validated['nip'] ?? null) ? trim($validated['nip']) : null;
        $validated['tanggal_bergabung'] = $validated['tanggal_bergabung'] ?? null;

        $guru = Guru::create($validated);

        return response()->json($guru, 201);
    }

    // PUT/PATCH /api/guru/{guru} - dipakai buat ubah data guru, termasuk set/ubah tanggal_bergabung
    // guru yang gabung di tengah semester (fitur ini penting biar Dashboard gak nganggep dia "Hadir"
    // sejak awal periode padahal belum ngajar).
    public function update(Request $request, Guru $guru)
    {
        $validated = $request->validate([
            'nama' => 'sometimes|required|string|max:255',
            'jabatan' => 'sometimes|required|string|max:255',
            'mapel' => 'nullable|string|max:255',
            'nip' => 'nullable|string|max:50',
            'tanggal_bergabung' => 'nullable|date',
        ]);

        if (array_key_exists('nip', $validated)) {
            $validated['nip'] = !empty($validated['nip']) ? trim($validated['nip']) : null;
        }

        $guru->update($validated);

        return response()->json($guru);
    }

    // DELETE /api/guru/{id}
    public function destroy(Guru $guru)
    {
        $guru->delete();
        return response()->json(['message' => 'Guru dihapus']);
    }

    // POST /api/guru/import
    // Body: { rows: [{ nama, jabatan, nip }, ...], tanggal_bergabung_default?: "YYYY-MM-DD" }
    // Cocokin berdasarkan nama pakai fuzzy match (toleran typo kecil/beda format gelar):
    // ada yang mirip -> update guru itu, gak ada yang mirip -> tambah guru baru.
    // Ini penting biar re-import file yang ejaan namanya dikit beda gak bikin guru DOBEL
    // (dobel guru itu penyebab paling umum kenapa data ketidakhadiran "nyasar" ke entri yang
    // gak tampil di Dashboard - datanya nyantol ke guru_id duplikat yang berbeda).
    //
    // tanggal_bergabung_default: dipakai HANYA buat guru yang BENERAN BARU dibikin di import ini
    // (biasanya diisi otomatis = tanggal mulai Tahun Ajaran, pas lagi mode setup awal). Guru yang
    // sudah ada & cuma di-update datanya TIDAK ikut ketimpa tanggal_bergabung-nya oleh ini.
    public function import(Request $request)
    {
        $validated = $request->validate([
            'rows' => 'required|array|min:1',
            'rows.*.nama' => 'required|string|max:255',
            'rows.*.jabatan' => 'nullable|string|max:255',
            'rows.*.nip' => 'nullable|string|max:50',
            'tanggal_bergabung_default' => 'nullable|date',
        ]);

        $tanggalBergabungDefault = $validated['tanggal_bergabung_default'] ?? null;

        $added = 0;
        $updated = 0;
        $allGuru = Guru::all(); // dipakai sebagai kandidat pencocokan, ikut nambah tiap ada guru baru dibikin

        foreach ($validated['rows'] as $row) {
            $existing = GuruMatcher::findBestMatch($row['nama'], $allGuru, 85); // ambang tinggi biar gak salah gabung 2 guru beda orang

            if ($existing) {
                $existing->update([
                    'jabatan' => $row['jabatan'] ?: $existing->jabatan,
                    'nip' => $row['nip'] ?: $existing->nip,
                ]);
                $updated++;
            } else {
                $baru = Guru::create([
                    'nama' => trim($row['nama']),
                    'jabatan' => $row['jabatan'] ?: 'Guru Mapel',
                    'nip' => $row['nip'] ?: null,
                    'tanggal_bergabung' => $tanggalBergabungDefault,
                ]);
                $allGuru->push($baru);
                $added++;
            }
        }

        return response()->json(['added' => $added, 'updated' => $updated]);
    }
}
