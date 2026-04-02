<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('players', function (Blueprint $table) {
            $table->id();

            // Vinculo 1:1 con users — cuando un jugador se registra en la web
            // se crea su user Y su player profile en la misma transacción
            $table->foreignId('user_id')
                  ->unique()
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->string('alias', 60)->nullable()->comment('Nombre de campo en el airsoft');
            $table->string('phone', 20)->nullable();

            // Sistema de alertas RF.7
            // Desnormalizado intencionalmente: O(1) en la consulta de alerta
            // Se actualiza via Observer cuando attended cambia a false
            $table->unsignedSmallInteger('noshow_count')->default(0);

            // active    → jugador normal
            // warned    → ha superado el umbral de no-shows (alerta visual al admin)
            // blocked   → el admin lo ha bloqueado manualmente
            $table->enum('status', ['active', 'warned', 'blocked'])->default('active');

            $table->text('notes')->nullable()->comment('Notas internas del admin');
            $table->timestamps();

            // Índices de consulta frecuente
            $table->index('status');
            $table->index('noshow_count');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('players');
    }
};
