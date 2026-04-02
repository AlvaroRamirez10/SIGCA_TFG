<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_cards', function (Blueprint $table) {
            $table->id();

            // 1:1 con players — se crea automáticamente al crear el player
            // via el Observer PlayerObserver@created
            $table->foreignId('player_id')
                  ->unique()
                  ->constrained('players')
                  ->cascadeOnDelete();

            // Sellos actuales en el ciclo en curso (0-4)
            // Al llegar a 5 se resetea a 0 y se genera un free_game_credit
            $table->unsignedTinyInteger('stamps_count')->default(0);

            // Acumulado histórico de sellos (nunca se resetea)
            // Útil para estadísticas y para el TFG
            $table->unsignedSmallInteger('total_stamps_earned')->default(0);

            // Cuántas partidas gratis ha ganado en total (histórico)
            $table->unsignedSmallInteger('total_credits_earned')->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_cards');
    }
};
