<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('player_id')
                  ->constrained('players')
                  ->restrictOnDelete(); // No borrar player si tiene reservas

            $table->foreignId('game_id')
                  ->constrained('games')
                  ->restrictOnDelete(); // No borrar partida si tiene reservas

            // pending   → reservado, pendiente de pago
            // confirmed → pago confirmado por el admin
            // cancelled → cancelada por jugador o admin
            $table->enum('status', ['pending', 'confirmed', 'cancelled'])->default('pending');

            // NULL = partida no jugada aún
            // true  = asistió (suma sello en loyalty_card)
            // false = no-show (suma noshow_count en player)
            $table->boolean('attended')->nullable()->default(null);

            // FK a free_game_credits se añade en migración posterior
            // para evitar referencia circular (reservations ↔ free_game_credits)
            // $table->foreignId('free_credit_id') — ver migración 000008

            $table->timestamps();

            // Un jugador no puede reservar la misma partida dos veces
            $table->unique(['player_id', 'game_id']);

            // Índices de consulta frecuente
            $table->index('status');
            $table->index('attended');
            $table->index(['game_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
