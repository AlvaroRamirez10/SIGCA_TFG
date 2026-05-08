<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminNotification;
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
            'game_id'         => ['required', 'exists:games,id'],
            'use_free_credit' => ['nullable', 'boolean'],
        ], [
            'game_id.required' => 'La partida es obligatoria.',
            'game_id.exists'   => 'La partida indicada no existe.',
        ]);

        $player = $request->user()->player;
        $game = Game::findOrFail($request->game_id);

        // Verificaciones previas
        if ($player->isBlocked()) {
            return response()->json([
                'message' => 'Tu cuenta está bloqueada. Contacta con el administrador.',
            ], Response::HTTP_FORBIDDEN);
        }

        if (!$game->isPublished()) {
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
        $freeCredit = null;
        $useFreeCredit = $request->boolean('use_free_credit', false);

        if ($useFreeCredit) {
            $freeCredit = FreeGameCredit::where('status', 'available')
                ->whereHas('loyaltyCard', fn($q) => $q->where('player_id', $player->id))
                ->first();
        }

        $reservation = DB::transaction(function () use ($player, $game, $freeCredit) {
            $reservation = Reservation::create([
                'player_id' => $player->id,
                'game_id' => $game->id,
                'free_credit_id' => $freeCredit?->id,
                'status' => $freeCredit ? 'confirmed' : 'pending',
            ]);

            if ($freeCredit) {
                // Marcamos el crédito como usado
                $freeCredit->update([
                    'status' => 'used',
                    'used_in_reservation_id' => $reservation->id,
                    'used_at' => now(),
                ]);

                // Creamos el pago con método free
                Payment::create([
                    'reservation_id' => $reservation->id,
                    'amount' => 0.00,
                    'method' => 'free',
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);
            } else {
                // Pago pendiente normal — siempre Bizum
                Payment::create([
                    'reservation_id' => $reservation->id,
                    'amount' => $game->price,
                    'method' => 'bizum',
                    'status' => 'pending',
                ]);
            }

            // Actualizamos plazas — si se llena cambiamos estado
            if ($game->isFull()) {
                $game->update(['status' => 'full']);
            }

            return $reservation;
        });

        $reservation->load(['game', 'payment']);

        AdminNotification::create([
            'type'    => 'reservation_created',
            'title'   => 'Nueva reserva',
            'message' => "{$player->user->name} ha reservado plaza en \"{$game->title}\"."
                . ($freeCredit ? ' (Partida gratis)' : " ({$game->price}€ pendiente de Bizum)"),
            'data'    => [
                'reservation_id' => $reservation->id,
                'player_id'      => $player->id,
                'game_id'        => $game->id,
            ],
        ]);

        $response = [
            'message' => $freeCredit
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
        $player = $request->user()->player;
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
        $user = $request->user();

        if ($user->role !== 'admin') {
            $player = $user->player;

            if (!$player || $reservation->player_id !== $player->id) {
                return response()->json([
                    'message' => 'No tienes permiso para cancelar esta reserva.',
                ], Response::HTTP_FORBIDDEN);
            }
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

        // Capturamos los datos necesarios para la notificación antes de modificar nada
        $reservation->load(['player.user', 'game', 'payment']);
        $playerName    = $reservation->player->user->name;
        $gameTitle     = $reservation->game->title;
        $paymentWasPaid = $reservation->payment?->status === 'paid';
        $refundAmount  = $reservation->payment?->amount;

        DB::transaction(function () use ($reservation) {
            if ($reservation->free_credit_id) {
                $freeCredit = FreeGameCredit::find($reservation->free_credit_id);

                if ($freeCredit) {
                    $freeCredit->update([
                        'status' => 'available',
                        'used_in_reservation_id' => null,
                        'used_at' => null,
                    ]);
                }
            }

            $reservation->update(['status' => 'cancelled']);

            // Solo reembolsar si el pago ya estaba cobrado; si estaba pendiente, se elimina
            if ($reservation->payment) {
                if ($reservation->payment->status === 'paid') {
                    $reservation->payment->update(['status' => 'refunded']);
                } else {
                    $reservation->payment->delete();
                }
            }

            if ($reservation->game->status === 'full') {
                $reservation->game->update(['status' => 'published']);
            }
        });

        AdminNotification::create([
            'type'    => $paymentWasPaid ? 'refund_requested' : 'reservation_cancelled',
            'title'   => $paymentWasPaid ? 'Cancelación — reembolso pendiente' : 'Reserva cancelada',
            'message' => $paymentWasPaid
                ? "{$playerName} ha cancelado su reserva en \"{$gameTitle}\". Pago confirmado de {$refundAmount}€ — pendiente de reembolso por Bizum."
                : "{$playerName} ha cancelado su reserva en \"{$gameTitle}\".",
            'data'    => [
                'reservation_id' => $reservation->id,
                'player_id'      => $reservation->player->id,
                'game_id'        => $reservation->game->id,
                'refund_amount'  => $paymentWasPaid ? $refundAmount : null,
            ],
        ]);

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
     * El admin confirma una reserva pendiente (sin pago).
     */
    public function confirm(Reservation $reservation): JsonResponse
    {
        if ($reservation->status !== 'pending') {
            return response()->json([
                'message' => 'Solo se pueden confirmar reservas pendientes.',
            ], Response::HTTP_CONFLICT);
        }

        $reservation->update(['status' => 'confirmed']);
        $reservation->load(['player.user', 'game', 'payment']);

        return response()->json([
            'message'     => 'Reserva confirmada correctamente.',
            'reservation' => $reservation,
        ]);
    }

    /**
     * El admin confirma el pago de una reserva.
     */
    public function confirmPayment(Request $request, Reservation $reservation): JsonResponse
    {
        $request->validate([
            'method' => ['required', 'in:bizum'],
            'notes' => ['nullable', 'string', 'max:200'],
        ], [
            'method.required' => 'El método de pago es obligatorio.',
            'method.in'       => 'Método no válido.',
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
                    'amount' => $reservation->game->price,
                    'method' => $request->input('method'),
                    'status' => 'paid',
                    'confirmed_by' => $request->user()->id,
                    'notes' => $request->input('notes'),
                    'paid_at' => now(),
                ]
            );
        });

        $reservation->load(['player.user', 'game', 'payment']);

        return response()->json([
            'message' => 'Pago confirmado correctamente.',
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

        // Historial de sellos: una por cada reserva con attended = true
        $stampHistory = Reservation::where('player_id', $player->id)
            ->where('attended', true)
            ->with('game:id,title,starts_at')
            ->orderBy('updated_at', 'asc')
            ->get()
            ->values()
            ->map(fn($r, $i) => [
                'id'           => $r->id,
                'stamp_number' => $i + 1,
                'earned_at'    => $r->updated_at,
                'reservation'  => [
                    'id'   => $r->id,
                    'game' => $r->game ? ['title' => $r->game->title] : null,
                ],
            ]);

        $loyaltyCard->setRelation('stamps', $stampHistory);

        return response()->json([
            'loyalty_card'     => $loyaltyCard,
            'stamps_count'     => $loyaltyCard->stamps_count,
            'stamps_required'  => config('sigca.loyalty_stamps_required', 5),
            'stamps_remaining' => config('sigca.loyalty_stamps_required', 5) - $loyaltyCard->stamps_count,
            'available_credits' => $loyaltyCard->freeGameCredits()->where('status', 'available')->count(),
            'used_credits'      => $loyaltyCard->freeGameCredits()->where('status', 'used')->count(),
        ]);
    }
}