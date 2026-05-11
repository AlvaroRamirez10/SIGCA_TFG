<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Player extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'alias',
        'phone',
        'avatar',
        'noshow_count',
        'status',
        'notes',
    ];

    protected $casts = [
        'noshow_count' => 'integer',
    ];

    // -------------------------------------------------------
    // Relaciones
    // -------------------------------------------------------

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function loyaltyCard()
    {
        return $this->hasOne(LoyaltyCard::class);
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    // -------------------------------------------------------
    // Helpers de estado
    // -------------------------------------------------------

    public function isWarned(): bool
    {
        return $this->status === 'warned';
    }

    public function isBlocked(): bool
    {
        return $this->status === 'blocked';
    }
}