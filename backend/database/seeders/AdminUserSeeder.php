<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Bikin akun pertama (Waka Kurikulum / Admin) buat login begitu sistem online.
 *
 * Cara pakai (jalanin SEKALI aja setelah migrate di server production):
 *   php artisan db:seed --class=AdminUserSeeder
 *
 * PENTING: ganti email & password di bawah, atau lebih aman lagi, pakai environment
 * variable (ADMIN_EMAIL, ADMIN_PASSWORD) biar password gak ke-commit ke git.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('ADMIN_EMAIL', 'kosgoro-kosgoro@smk-kosgoro.sch.id');
        $password = env('ADMIN_PASSWORD', 'Kosgoro-Kosgoro26!');

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Kharisma Larasyudha',
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]
        );

        $this->command->info("Akun admin siap: {$email}");
        $this->command->warn('Segera login dan ganti password default ini!');
    }
}
