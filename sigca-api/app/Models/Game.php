<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by',
        'title',
        'description',
        'location',
        'starts_at',
        'max_slots',
        'price',
        'status',
        'notes',
    ];

    protected $casts = [
        'starts_at'  => 'datetime',
        'price'      => 'decimal:2',
        'max_slots'  => 'integer',
    ];

    // -------------------------------------------------------
    // Relaciones
    // -------------------------------------------------------

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    // -------------------------------------------------------
    // Helpers
    // -------------------------------------------------------

    public function confirmedReservations()
    {
        return $this->reservations()->where('status', 'confirmed');
    }

    public function availableSlots(): int
    {
        return $this->max_slots - $this->confirmedReservations()->count();
    }

    public function isFull(): bool
    {
        return $this->availableSlots() <= 0;
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }
}