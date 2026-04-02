<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('reservation_id')
                  ->unique() // 1 reserva = máximo 1 pago
                  ->constrained('reservations')
                  ->cascadeOnDelete();

            // El importe real cobrado (puede diferir del precio de la partida
            // si el admin aplica descuento manual)
            $table->decimal('amount', 6, 2);

            // cash  → efectivo en mano
            // bizum → transferencia Bizum
            // free  → cubierto por free_game_credit (precio = 0)
            $table->enum('method', ['cash', 'bizum', 'free'])->default('cash');

            // pending → el admin aún no ha confirmado el cobro
            // paid    → cobrado y confirmado
            // refunded → devuelto
            $table->enum('status', ['pending', 'paid', 'refunded'])->default('pending');

            // Quién marcó el pago (siempre el admin)
            $table->foreignId('confirmed_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->text('notes')->nullable()->comment('Ej: pagó con billete de 50');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            // Índices
            $table->index('status');
            $table->index('method');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
