<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FreeGameCredit extends Model
{
    use HasFactory;

    protected $fillable = [
        'loyalty_card_id',
        'used_in_reservation_id',
        'status',
        'earned_at',
        'used_at',
    ];

    protected $casts = [
        'earned_at' => 'datetime',
        'used_at'   => 'datetime',
    ];

    // -------------------------------------------------------
    // Relaciones
    // -------------------------------------------------------

    public function loyaltyCard()
    {
        return $this->belongsTo(LoyaltyCard::class);
    }

    public function usedInReservation()
    {
        return $this->belongsTo(Reservation::class, 'used_in_reservation_id');
    }

    // -------------------------------------------------------
    // Helpers
    // -------------------------------------------------------

    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }
}