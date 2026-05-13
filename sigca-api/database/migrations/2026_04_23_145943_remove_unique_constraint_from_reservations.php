<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $indexExists = DB::select("SHOW INDEX FROM reservations WHERE Key_name = 'reservations_player_id_game_id_unique'");

        if (!empty($indexExists)) {
            // Soltar la FK que usa ese índice, borrar el índice y reconstruir la FK
            Schema::table('reservations', function (Blueprint $table) {
                $table->dropForeign(['player_id']);
            });

            DB::statement('ALTER TABLE reservations DROP INDEX reservations_player_id_game_id_unique');

            Schema::table('reservations', function (Blueprint $table) {
                $table->foreign('player_id')->references('id')->on('players')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->unique(['player_id', 'game_id']);
        });
    }
};