<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Crea el único usuario administrador del sistema.
     *
     * Ejecutar con: php artisan db:seed --class=AdminSeeder
     *
     * Cambiar las credenciales antes de cualquier despliegue.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@sigca.local'],
            [
                'name'     => 'Administrador SIGCA',
                'password' => Hash::make('sigca'),
                'role'     => 'admin',
                'phone'    => null,
            ]
        );

        $this->command->info('Admin creado: admin@sigca.local / sigca');
    }
}
