<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Verificar si el índice existe antes de eliminarlo
        $indexExists = DB::select("SHOW INDEX FROM reservations WHERE Key_name = 'reservations_player_id_game_id_unique'");
        
        if (!empty($indexExists)) {
            DB::statement('ALTER TABLE reservations DROP INDEX reservations_player_id_game_id_unique');
        }
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->unique(['player_id', 'game_id']);
        });
    }
};