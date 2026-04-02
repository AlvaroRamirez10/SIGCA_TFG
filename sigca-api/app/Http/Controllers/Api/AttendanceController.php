<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class AttendanceController extends Controller
{
    /**
     * Marca la asistencia de un jugador en una partida.
     * El Observer se encarga del resto:
     *   - Si attended = false → incrementa noshow_count, actualiza status si toca
     *   - Si attended = true  → añade sello de fidelización, genera crédito si toca
     */
    public function update(Request $request, Reservation $reservation): JsonResponse
    {
        $request->validate([
            'attended' => ['required', 'boolean'],
        ]);

        // Protección: no se puede cambiar la asistencia de una reserva cancelada
        if ($reservation->status === 'cancelled') {
            return response()->json([
                'message' => 'No se puede registrar asistencia en una reserva cancelada.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Protección: si ya está marcada no la sobreescribimos sin querer
        if (! is_null($reservation->attended)) {
            return response()->json([
                'message' => 'La asistencia ya fue registrada. Contacta con el administrador para corregirla.',
            ], Response::HTTP_CONFLICT);
        }

        $reservation->update(['attended' => $request->attended]);

        // Recargamos con las relaciones actualizadas por el Observer
        $reservation->load(['player.loyaltyCard', 'player']);

        $player = $reservation->player;

        return response()->json([
            'message'     => $request->attended
                ? 'Asistencia confirmada. Sello añadido.'
                : "No-show registrado. Total faltas: {$player->noshow_count}.",
            'reservation' => $reservation,
            'player'      => [
                'id'           => $player->id,
                'status'       => $player->status,
                'noshow_count' => $player->noshow_count,
                'stamps_count' => $player->loyaltyCard->stamps_count,
            ],
        ]);
    }
}