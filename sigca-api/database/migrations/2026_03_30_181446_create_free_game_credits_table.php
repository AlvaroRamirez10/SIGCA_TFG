<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('free_game_credits', function (Blueprint $table) {
            $table->id();

            $table->foreignId('loyalty_card_id')
                  ->constrained('loyalty_cards')
                  ->cascadeOnDelete();

            // En qué reserva se canjeó este crédito (nullable = aún sin usar)
            $table->foreignId('used_in_reservation_id')
                  ->nullable()
                  ->constrained('reservations')
                  ->nullOnDelete();

            // available → generado, esperando ser canjeado
            // used      → ya canjeado en una reserva
            $table->enum('status', ['available', 'used'])->default('available');

            // Cuándo se ganó (al completar 5 asistencias)
            $table->timestamp('earned_at')->useCurrent();

            // Cuándo se canjeó
            $table->timestamp('used_at')->nullable();

            $table->timestamps();

            // Índice para consultar créditos disponibles de un jugador rápido
            $table->index(['loyalty_card_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('free_game_credits');
    }
};
