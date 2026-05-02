<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        User::create([
            'name'     => 'Admin',
            'email'    => 'admin@inventory.com',
            'password' => Hash::make('admin123'),
            'role'     => 'admin',
        ]);

        // Staff user
        User::create([
            'name'     => 'Staff User',
            'email'    => 'staff@inventory.com',
            'password' => Hash::make('staff123'),
            'role'     => 'staff',
        ]);
    }
}