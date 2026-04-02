<?php

namespace App\Observers;

use App\Models\FreeGameCredit;
use App\Models\Reservation;

class ReservationObserver
{
    /**
     * Se dispara cuando se actualiza una reserva.
     * Detecta cambios en el campo 'attended' para:
     *   - attended = false → incrementar noshow_count y actualizar status
     *   - attended = true  → añadir sello de fidelización
     */
    public function updated(Reservation $reservation): void
    {
        // Solo actuamos si el campo 'attended' ha cambiado
        if (! $reservation->wasChanged('attended')) {
            return;
        }

        $player = $reservation->player;

        // -------------------------------------------------------
        // NO-SHOW: el jugador no asistió
        // -------------------------------------------------------
        if ($reservation->attended === false) {
            $player->increment('noshow_count');
            $player->refresh(); // recargamos para tener el valor actualizado

            $threshold = config('sigca.noshow_threshold', 3);

            if ($player->noshow_count >= $threshold) {
                $player->update(['status' => 'warned']);
            }

            return;
        }

        // -------------------------------------------------------
        // ASISTIÓ: sumamos sello de fidelización
        // -------------------------------------------------------
        if ($reservation->attended === true) {
            $loyaltyCard = $player->loyaltyCard;

            $loyaltyCard->increment('stamps_count');
            $loyaltyCard->increment('total_stamps_earned');
            $loyaltyCard->refresh();

            $stampsRequired = config('sigca.loyalty_stamps_required', 5);

            // ¿Ha completado el ciclo de sellos?
            if ($loyaltyCard->stamps_count >= $stampsRequired) {
                // Generamos la partida gratis
                FreeGameCredit::create([
                    'loyalty_card_id' => $loyaltyCard->id,
                    'status'          => 'available',
                    'earned_at'       => now(),
                ]);

                // Actualizamos contadores históricos y reseteamos ciclo
                $loyaltyCard->update([
                    'stamps_count'        => 0,
                    'total_credits_earned' => $loyaltyCard->total_credits_earned + 1,
                ]);
            }
        }
    }
}