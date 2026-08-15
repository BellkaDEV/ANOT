<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'lucas@univ.edu.br'],
            [
                'name' => 'Lucas Mendes',
                'password' => Hash::make('password123'),
            ]
        );

        User::firstOrCreate(
            ['email' => 'ana@univ.edu.br'],
            [
                'name' => 'Ana Carolina Silva',
                'password' => Hash::make('password123'),
            ]
        );
    }
}
