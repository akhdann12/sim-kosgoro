<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Role "admin" cuma boleh LIHAT data (Dashboard, tabel-tabel, Export/Cetak PDF) - gak boleh
 * nambah/ubah/hapus/import apapun. Middleware ini dipasang di semua route write (POST/PUT/
 * PATCH/DELETE) selain login/logout, dan menolak dengan 403 kalau yang login bukan super_admin.
 */
class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || !$request->user()->isSuperAdmin()) {
            return response()->json([
                'message' => 'Aksi ini khusus untuk Super Admin. Akun Anda (Admin) hanya bisa melihat dan mengekspor data.',
            ], 403);
        }

        return $next($request);
    }
}
