<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            // Primero eliminar la foreign key si existe
            $table->dropForeign(['free_credit_id']);
            
            // Luego eliminar el índice unique
            $table->dropUnique(['player_id', 'game_id']);
            
            // Volver a crear la foreign key
            $table->foreign('free_credit_id')
                ->references('id')
                ->on('free_game_credits')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropForeign(['free_credit_id']);
            $table->unique(['player_id', 'game_id']);
            $table->foreign('free_credit_id')
                ->references('id')
                ->on('free_game_credits')
                ->nullOnDelete();
        });
    }
};