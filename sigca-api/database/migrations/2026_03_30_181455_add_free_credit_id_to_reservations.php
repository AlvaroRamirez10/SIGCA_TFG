<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ahora que free_game_credits ya existe, podemos añadir
     * la FK que cierra el ciclo reservations ↔ free_game_credits.
     *
     * Una reserva puede estar cubierta por un crédito gratuito.
     * Si el crédito se borra (no debería ocurrir), la FK queda null.
     */
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->foreignId('free_credit_id')
                  ->nullable()
                  ->after('status')
                  ->constrained('free_game_credits')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropForeign(['free_credit_id']);
            $table->dropColumn('free_credit_id');
        });
    }
};
