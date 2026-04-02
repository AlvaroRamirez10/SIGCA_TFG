<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoyaltyCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'player_id',
        'stamps_count',
        'total_stamps_earned',
        'total_credits_earned',
    ];

    protected $casts = [
        'stamps_count'         => 'integer',
        'total_stamps_earned'  => 'integer',
        'total_credits_earned' => 'integer',
    ];

    // -------------------------------------------------------
    // Relaciones
    // -------------------------------------------------------

    public function player()
    {
        return $this->belongsTo(Player::class);
    }

    public function freeGameCredits()
    {
        return $this->hasMany(FreeGameCredit::class);
    }

    // -------------------------------------------------------
    // Helpers
    // -------------------------------------------------------

    public function availableCredits()
    {
        return $this->freeGameCredits()->where('status', 'available');
    }

    public function hasAvailableCredit(): bool
    {
        return $this->availableCredits()->exists();
    }
}