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
        ]);

        // PENTING: kolom nip itu unique. Kalau dibiarin string kosong "" (bukan null), guru
        // kedua yang NIP-nya kosong bakal gagal disimpan karena "" == "" dianggap bentrok.
        // NULL di database gak dianggap bentrok sama NULL lain, makanya harus di-null-in eksplisit.
        $validated['nip'] = !empty($validated['nip'] ?? null) ? trim($validated['nip']) : null;

        $guru = Guru::create($validated);

        return response()->json($guru, 201);
    }

    // DELETE /api/guru/{id}
    public function destroy(Guru $guru)
    {
        $guru->delete();
        return response()->json(['message' => 'Guru dihapus']);
    }

    // POST /api/guru/import
    // Body: { rows: [{ nama, jabatan, nip }, ...] }
    // Cocokin berdasarkan nama pakai fuzzy match (toleran typo kecil/beda format gelar):
    // ada yang mirip -> update guru itu, gak ada yang mirip -> tambah guru baru.
    // Ini penting biar re-import file yang ejaan namanya dikit beda gak bikin guru DOBEL
    // (dobel guru itu penyebab paling umum kenapa data ketidakhadiran "nyasar" ke entri yang
    // gak tampil di Dashboard - datanya nyantol ke guru_id duplikat yang berbeda).
    public function import(Request $request)
    {
        $validated = $request->validate([
            'rows' => 'required|array|min:1',
            'rows.*.nama' => 'required|string|max:255',
            'rows.*.jabatan' => 'nullable|string|max:255',
            'rows.*.nip' => 'nullable|string|max:50',
        ]);

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
                ]);
                $allGuru->push($baru);
                $added++;
            }
        }

        return response()->json(['added' => $added, 'updated' => $updated]);
    }
}
