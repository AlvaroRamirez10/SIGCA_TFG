<?php

namespace App\Observers;

use App\Models\FreeGameCredit;
use App\Models\Reservation;
use Illuminate\Support\Facades\DB;

class ReservationObserver
{
    /**
     * Fired after a Reservation is updated.
     * Only acts when the 'attended' field changes for the first time.
     */
    public function updated(Reservation $reservation): void
    {
        if (! $reservation->wasChanged('attended') || is_null($reservation->attended)) {
            return;
        }

        if ($reservation->attended === true) {
            $this->handleAttended($reservation);
        } else {
            $this->handleNoShow($reservation);
        }
    }

    private function handleAttended(Reservation $reservation): void
    {
        DB::transaction(function () use ($reservation) {
            $player      = $reservation->player;
            $loyaltyCard = $player->loyaltyCard;
            $required    = config('sigca.loyalty_stamps_required', 5);

            $newCount = $loyaltyCard->stamps_count + 1;
            $loyaltyCard->increment('total_stamps_earned');

            if ($newCount >= $required) {
                $loyaltyCard->update(['stamps_count' => 0]);
                $loyaltyCard->increment('total_credits_earned');

                FreeGameCredit::create([
                    'loyalty_card_id' => $loyaltyCard->id,
                    'status'          => 'available',
                ]);
            } else {
                $loyaltyCard->update(['stamps_count' => $newCount]);
            }
        });
    }

    private function handleNoShow(Reservation $reservation): void
    {
        DB::transaction(function () use ($reservation) {
            $player    = $reservation->player;
            $threshold = config('sigca.noshow_threshold', 3);

            $player->increment('noshow_count');
            $player->refresh();

            if ($player->noshow_count >= $threshold * 2 && $player->status !== 'blocked') {
                $player->update(['status' => 'blocked']);
            } elseif ($player->noshow_count >= $threshold && $player->status === 'active') {
                $player->update(['status' => 'warned']);
            }
        });
    }
}
