<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dateTime('ends_at')
                  ->nullable()
                  ->after('starts_at')
                  ->comment('Fecha y hora de fin — usada para limpieza automática');
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn('ends_at');
        });
    }
};
