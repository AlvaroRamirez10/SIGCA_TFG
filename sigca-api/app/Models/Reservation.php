<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'player_id',
        'game_id',
        'free_credit_id',
        'status',
        'attended',
    ];

    protected $casts = [
        'attended' => 'boolean',
    ];

    // Transient flag: set to true in the controller when the reservation
    // is covered by a free credit so the Observer skips the stamp award.
    public bool $skipStamp = false;

    // -------------------------------------------------------
    // Relaciones
    // -------------------------------------------------------

    public function player()
    {
        return $this->belongsTo(Player::class);
    }

    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function freeCredit()
    {
        return $this->belongsTo(FreeGameCredit::class, 'free_credit_id');
    }

    // -------------------------------------------------------
    // Helpers
    // -------------------------------------------------------

    public function isCoveredByCredit(): bool
    {
        return $this->free_credit_id !== null;
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isConfirmed(): bool
    {
        return $this->status === 'confirmed';
    }
}