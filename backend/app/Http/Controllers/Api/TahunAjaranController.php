<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;

/**
 * CRUD Tahun Ajaran.
 *
 * Sebelumnya daftar tahun ajaran & rentang tanggal tiap semester di-hardcode di frontend
 * (lib/periodUtils.js) - termasuk beberapa tanggal "percobaan" yang gak relevan lagi di kondisi
 * nyata. Sekarang tahun ajaran sepenuhnya data dinamis: user input sendiri nama tahun ajarannya,
 * semester, dan tanggal mulai/selesai lewat halaman ini, tersimpan di database (tabel
 * tahun_ajaran yang modelnya sudah ada dari awal).
 */
class TahunAjaranController extends Controller
{
    // GET /api/tahun-ajaran
    public function index()
    {
        return response()->json(
            TahunAjaran::orderByDesc('tanggal_mulai')->get()
        );
    }

    // POST /api/tahun-ajaran
    // Body: { nama: "2027/2028", semester: "ganjil"|"genap", tanggal_mulai, tanggal_selesai, aktif? }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:50',
            'semester' => 'required|in:ganjil,genap',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'aktif' => 'nullable|boolean',
        ]);

        // Biar gak ada tahun ajaran yang persis sama (nama + semester) dobel kesimpen gak sengaja
        $sudahAda = TahunAjaran::where('nama', $validated['nama'])
            ->where('semester', $validated['semester'])
            ->exists();
        if ($sudahAda) {
            return response()->json([
                'message' => "Tahun Ajaran {$validated['nama']} semester {$validated['semester']} sudah ada.",
            ], 422);
        }

        $jadiAktif = (bool) ($validated['aktif'] ?? false);

        $tahunAjaran = TahunAjaran::create([
            'nama' => $validated['nama'],
            'semester' => $validated['semester'],
            'tanggal_mulai' => $validated['tanggal_mulai'],
            'tanggal_selesai' => $validated['tanggal_selesai'],
            'aktif' => $jadiAktif,
        ]);

        if ($jadiAktif) {
            TahunAjaran::where('id', '!=', $tahunAjaran->id)->update(['aktif' => false]);
        }

        return response()->json($tahunAjaran, 201);
    }

    // PUT /api/tahun-ajaran/{tahunAjaran}
    public function update(Request $request, TahunAjaran $tahunAjaran)
    {
        $validated = $request->validate([
            'nama' => 'sometimes|required|string|max:50',
            'semester' => 'sometimes|required|in:ganjil,genap',
            'tanggal_mulai' => 'sometimes|required|date',
            'tanggal_selesai' => 'sometimes|required|date|after_or_equal:tanggal_mulai',
        ]);

        $tahunAjaran->update($validated);

        return response()->json($tahunAjaran);
    }

    // POST /api/tahun-ajaran/{tahunAjaran}/aktifkan - jadiin satu-satunya tahun ajaran yang aktif
    // (dipakai buat nentuin default tampilan & fallback export "semester berjalan").
    public function aktifkan(TahunAjaran $tahunAjaran)
    {
        TahunAjaran::query()->update(['aktif' => false]);
        $tahunAjaran->update(['aktif' => true]);

        return response()->json($tahunAjaran);
    }

    // DELETE /api/tahun-ajaran/{tahunAjaran}
    public function destroy(TahunAjaran $tahunAjaran)
    {
        $tahunAjaran->delete();
        return response()->json(['message' => 'Tahun ajaran dihapus']);
    }
}
