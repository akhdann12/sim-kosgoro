<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * Manajemen akun (khusus Super Admin, dijaga middleware 'super_admin' di routes/api.php).
 * Dipakai buat bikin akun "Admin" (view-only) atau Super Admin lain tanpa harus lewat
 * artisan tinker/seeder manual di server.
 */
class UserController extends Controller
{
    // GET /api/users
    public function index()
    {
        return response()->json(User::orderBy('name')->get(['id', 'name', 'email', 'role', 'created_at']));
    }

    // POST /api/users
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['super_admin', 'admin'])],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'email_verified_at' => now(),
        ]);

        return response()->json($user->only(['id', 'name', 'email', 'role']), 201);
    }

    // PUT /api/users/{user}
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'role' => ['sometimes', 'required', Rule::in(['super_admin', 'admin'])],
        ]);

        // Jaga-jaga: jangan sampai super_admin terakhir nurunin role dirinya sendiri jadi admin
        // biasa, kejadian gak ada satupun akun yang bisa ngelola sistem lagi.
        if (($validated['role'] ?? null) === 'admin' && $user->id === $request->user()->id) {
            $masihAdaSuperAdminLain = User::where('role', 'super_admin')->where('id', '!=', $user->id)->exists();
            if (!$masihAdaSuperAdminLain) {
                return response()->json(['message' => 'Gak bisa menurunkan role akun sendiri - ini satu-satunya Super Admin yang tersisa.'], 422);
            }
        }

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json($user->only(['id', 'name', 'email', 'role']));
    }

    // DELETE /api/users/{user}
    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Gak bisa menghapus akun sendiri yang lagi login.'], 422);
        }

        if ($user->role === 'super_admin') {
            $masihAdaSuperAdminLain = User::where('role', 'super_admin')->where('id', '!=', $user->id)->exists();
            if (!$masihAdaSuperAdminLain) {
                return response()->json(['message' => 'Gak bisa menghapus Super Admin terakhir di sistem.'], 422);
            }
        }

        $user->delete();

        return response()->json(['message' => 'Akun dihapus']);
    }
}
