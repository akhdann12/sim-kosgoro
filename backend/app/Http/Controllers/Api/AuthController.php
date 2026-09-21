<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // POST /api/login  (throttle:6,1 - max 6x percobaan/menit biar gak gampang di-brute-force)
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            // Pesan error sengaja gak nyebutin "email gak ketemu" vs "password salah" biar
            // orang luar gak bisa nebak-nebak email mana yang valid di sistem (user enumeration).
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        // Hapus token lama sebelum bikin baru, biar gak numpuk token nganggur per user
        $user->tokens()->delete();
        $token = $user->createToken('sim-kosgoro-spa')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    // POST /api/logout (auth:sanctum)
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil']);
    }

    // GET /api/user (auth:sanctum) - dipanggil frontend buat cek siapa yang lagi login
    public function user(Request $request)
    {
        return response()->json($request->user());
    }
}
