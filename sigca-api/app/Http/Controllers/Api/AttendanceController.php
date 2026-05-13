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
        ], [
            'attended.required' => 'El campo de asistencia es obligatorio.',
            'attended.boolean'  => 'El valor de asistencia debe ser verdadero o falso.',
        ]);

        // Protección: no se puede cambiar la asistencia de una reserva cancelada
        if ($reservation->status === 'cancelled') {
            return response()->json([
                'message' => 'No se puede registrar asistencia en una reserva cancelada.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Protección: la partida debe haber comenzado ya
        if ($reservation->game->starts_at > now()) {
            return response()->json([
                'message' => 'No se puede registrar asistencia antes de que comience la partida.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Protección: si ya está marcada no la sobreescribimos sin querer
        if (! is_null($reservation->attended)) {
            return response()->json([
                'message' => 'La asistencia ya fue registrada. Contacta con el administrador para corregirla.',
            ], Response::HTTP_CONFLICT);
        }

        // Signal the Observer to skip the stamp when the slot was covered by a free credit
        if ($reservation->free_credit_id !== null) {
            $reservation->skipStamp = true;
        }

        $reservation->update(['attended' => $request->attended]);

        // Recargamos con las relaciones actualizadas por el Observer
        $reservation->load(['player.user', 'player.loyaltyCard', 'game', 'payment']);

        $player = $reservation->player;

        $attendedMessage = $reservation->skipStamp
            ? 'Asistencia confirmada.'
            : 'Asistencia confirmada. Sello añadido.';

        return response()->json([
            'message'     => $request->attended
                ? $attendedMessage
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