<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id();

            // El admin que crea la partida
            $table->foreignId('created_by')
                  ->constrained('users')
                  ->restrictOnDelete();

            $table->string('title');
            $table->text('description')->nullable();
            $table->string('location');
            $table->dateTime('starts_at')->comment('Fecha y hora de inicio');
            $table->unsignedSmallInteger('max_slots')->comment('Plazas máximas');
            $table->decimal('price', 6, 2)->default(0.00)->comment('Precio por entrada en euros');

            // draft      → el admin la está preparando, no visible en web
            // published  → visible en calendario público
            // full       → sold out, sin plazas (se calcula automáticamente)
            // cancelled  → cancelada
            // finished   → ya se jugó
            $table->enum('status', ['draft', 'published', 'full', 'cancelled', 'finished'])
                  ->default('draft');

            $table->text('notes')->nullable()->comment('Notas internas del admin');
            $table->timestamps();

            // Índices: las consultas más frecuentes son por status y fecha
            $table->index('status');
            $table->index('starts_at');
            $table->index(['status', 'starts_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
