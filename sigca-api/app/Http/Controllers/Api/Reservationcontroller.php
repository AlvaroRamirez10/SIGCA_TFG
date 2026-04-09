<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FreeGameCredit;
use App\Models\Game;
use App\Models\Payment;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ReservationController extends Controller
{
    // -------------------------------------------------------
    // RUTAS JUGADOR
    // -------------------------------------------------------

    /**
     * El jugador hace una reserva en una partida.
     * Lógica:
     *   1. Verifica que la partida existe y tiene plazas
     *   2. Verifica que el jugador no está bloqueado
     *   3. Si el jugador está warned → permite pero devuelve alerta
     *   4. Si tiene crédito gratis disponible → lo aplica automáticamente
     *   5. Crea la reserva y el pago pendiente en una transacción
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'game_id'          => ['required', 'exists:games,id'],
            'use_free_credit'  => ['nullable', 'boolean'],
        ]);

        $player = $request->user()->player;
        $game   = Game::findOrFail($request->game_id);

        // Verificaciones previas
        if ($player->isBlocked()) {
            return response()->json([
                'message' => 'Tu cuenta está bloqueada. Contacta con el administrador.',
            ], Response::HTTP_FORBIDDEN);
        }

        if (! $game->isPublished()) {
            return response()->json([
                'message' => 'Esta partida no está disponible.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($game->isFull()) {
            return response()->json([
                'message' => 'No quedan plazas disponibles en esta partida.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Verificar que no tiene ya una reserva en esta partida
        $existing = Reservation::where('player_id', $player->id)
            ->where('game_id', $game->id)
            ->whereNot('status', 'cancelled')
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Ya tienes una reserva en esta partida.',
            ], Response::HTTP_CONFLICT);
        }

        // Verificar si quiere usar crédito gratis y tiene uno disponible
        $freeCredit    = null;
        $useFreeCredit = $request->boolean('use_free_credit', false);

        if ($useFreeCredit) {
            $freeCredit = FreeGameCredit::where('status', 'available')
                ->whereHas('loyaltyCard', fn($q) => $q->where('player_id', $player->id))
                ->first();
        }

        $reservation = DB::transaction(function () use ($player, $game, $freeCredit) {
            $reservation = Reservation::create([
                'player_id'      => $player->id,
                'game_id'        => $game->id,
                'free_credit_id' => $freeCredit?->id,
                'status'         => $freeCredit ? 'confirmed' : 'pending',
            ]);

            if ($freeCredit) {
                // Marcamos el crédito como usado
                $freeCredit->update([
                    'status'                => 'used',
                    'used_in_reservation_id' => $reservation->id,
                    'used_at'               => now(),
                ]);

                // Creamos el pago con método free
                Payment::create([
                    'reservation_id' => $reservation->id,
                    'amount'         => 0.00,
                    'method'         => 'free',
                    'status'         => 'paid',
                    'paid_at'        => now(),
                ]);
            } else {
                // Pago pendiente normal
                Payment::create([
                    'reservation_id' => $reservation->id,
                    'amount'         => $game->price,
                    'method'         => 'cash',
                    'status'         => 'pending',
                ]);
            }

            // Actualizamos plazas — si se llena cambiamos estado
            if ($game->isFull()) {
                $game->update(['status' => 'full']);
            }

            return $reservation;
        });

        $reservation->load(['game', 'payment']);

        $response = [
            'message'     => $freeCredit
                ? '¡Reserva confirmada con tu partida gratis!'
                : 'Reserva creada. Pendiente de pago.',
            'reservation' => $reservation,
        ];

        // Advertencia si el jugador está en estado warned
        if ($player->isWarned()) {
            $response['warning'] = "Atención: tienes {$player->noshow_count} inasistencias registradas.";
        }

        return response()->json($response, Response::HTTP_CREATED);
    }

    /**
     * El jugador ve sus propias reservas.
     */
    public function index(Request $request): JsonResponse
    {
        $player       = $request->user()->player;
        $reservations = Reservation::where('player_id', $player->id)
            ->with(['game', 'payment'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['reservations' => $reservations]);
    }

    /**
     * El jugador cancela su reserva.
     * Solo se puede cancelar si la partida no ha empezado aún.
     */
    public function destroy(Request $request, Reservation $reservation): JsonResponse
    {
        $player = $request->user()->player;

        // Verificar que la reserva pertenece al jugador
        if ($reservation->player_id !== $player->id) {
            return response()->json([
                'message' => 'No tienes permiso para cancelar esta reserva.',
            ], Response::HTTP_FORBIDDEN);
        }

        if ($reservation->status === 'cancelled') {
            return response()->json([
                'message' => 'Esta reserva ya está cancelada.',
            ], Response::HTTP_CONFLICT);
        }

        if ($reservation->game->starts_at <= now()) {
            return response()->json([
                'message' => 'No puedes cancelar una reserva de una partida que ya ha comenzado.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        DB::transaction(function () use ($reservation) {
            // Si tenía crédito gratis aplicado, lo devolvemos
            if ($reservation->free_credit_id) {
                FreeGameCredit::find($reservation->free_credit_id)->update([
                    'status'                 => 'available',
                    'used_in_reservation_id' => null,
                    'used_at'                => null,
                ]);
            }

            $reservation->update(['status' => 'cancelled']);
            $reservation->payment?->update(['status' => 'refunded']);

            // Liberar la plaza — si la partida estaba full vuelve a published
            if ($reservation->game->status === 'full') {
                $reservation->game->update(['status' => 'published']);
            }
        });

        return response()->json([
            'message' => 'Reserva cancelada correctamente.',
        ]);
    }

    // -------------------------------------------------------
    // RUTAS ADMIN
    // -------------------------------------------------------

    /**
     * El admin ve todas las reservas con filtros.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Reservation::with(['player.user', 'game', 'payment'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('game_id')) {
            $query->where('game_id', $request->game_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('player_id')) {
            $query->where('player_id', $request->player_id);
        }

        $reservations = $query->paginate(20);

        return response()->json($reservations);
    }

    /**
     * El admin confirma el pago de una reserva.
     */
    public function confirmPayment(Request $request, Reservation $reservation): JsonResponse
    {
        $request->validate([
            'method' => ['required', 'in:cash,bizum'],
            'notes'  => ['nullable', 'string', 'max:200'],
        ]);

        if ($reservation->status === 'confirmed') {
            return response()->json([
                'message' => 'Esta reserva ya está confirmada.',
            ], Response::HTTP_CONFLICT);
        }

        DB::transaction(function () use ($request, $reservation) {
            $reservation->update(['status' => 'confirmed']);

            $reservation->payment()->updateOrCreate(
                ['reservation_id' => $reservation->id],
                [
                    'amount'       => $reservation->game->price,
                   'method' => $request->input('method'),
                    'status'       => 'paid',
                    'confirmed_by' => $request->user()->id,
                    'notes'        => $request->input('notes'),
                    'paid_at'      => now(),
                ]
            );
        });

        $reservation->load(['player.user', 'game', 'payment']);

        return response()->json([
            'message'     => 'Pago confirmado correctamente.',
            'reservation' => $reservation,
        ]);
    }

    /**
     * El jugador ve su cartilla de sellos.
     */
    public function loyalty(Request $request): JsonResponse
    {
        $player      = $request->user()->player;
        $loyaltyCard = $player->loyaltyCard()->with('freeGameCredits')->first();

        return response()->json([
            'loyalty_card'      => $loyaltyCard,
            'stamps_count'      => $loyaltyCard->stamps_count,
            'stamps_required'   => config('sigca.loyalty_stamps_required', 5),
            'stamps_remaining'  => config('sigca.loyalty_stamps_required', 5) - $loyaltyCard->stamps_count,
            'available_credits' => $loyaltyCard->freeGameCredits()->where('status', 'available')->count(),
        ]);
    }
}