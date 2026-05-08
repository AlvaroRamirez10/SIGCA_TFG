<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Game\StoreGameRequest;
use App\Http\Requests\Game\UpdateGameRequest;
use App\Models\FreeGameCredit;
use App\Models\Game;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class GameController extends Controller
{
    // -------------------------------------------------------
    // RUTAS PÚBLICAS
    // -------------------------------------------------------

    /**
     * Calendario público — solo partidas publicadas.
     * Ordenadas por fecha ascendente (las más próximas primero).
     */
    public function publicIndex(): JsonResponse
    {
        $games = Game::where('status', 'published')
            ->where('starts_at', '>=', now())
            ->orderBy('starts_at', 'asc')
            ->get()
            ->map(function (Game $game) {
                return [
                    'id'              => $game->id,
                    'title'           => $game->title,
                    'description'     => $game->description,
                    'location'        => $game->location,
                    'starts_at'       => $game->starts_at,
                    'max_slots'       => $game->max_slots,
                    'available_slots' => $game->availableSlots(),
                    'price'           => $game->price,
                    'status'          => $game->status,
                ];
            });

        return response()->json(['games' => $games]);
    }

    /**
     * Detalle público de una partida.
     * Solo accesible si está publicada.
     */
    public function publicShow(Game $game): JsonResponse
    {
        if (! \in_array($game->status, ['published', 'full'])) {
            return response()->json([
                'message' => 'Partida no encontrada.',
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'game' => [
                'id'              => $game->id,
                'title'           => $game->title,
                'description'     => $game->description,
                'location'        => $game->location,
                'starts_at'       => $game->starts_at,
                'max_slots'       => $game->max_slots,
                'available_slots' => $game->availableSlots(),
                'price'           => $game->price,
                'status'          => $game->status,
            ],
        ]);
    }

    // -------------------------------------------------------
    // RUTAS ADMIN
    // -------------------------------------------------------

    /**
     * Listar todas las partidas para el admin.
     * Incluye todos los estados y notas internas.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Game::with([
            'reservations' => fn($q) => $q->whereNotIn('status', ['cancelled'])
                                          ->with('player.user', 'payment')
                                          ->orderBy('created_at', 'asc'),
        ])
            ->withCount([
                'reservations as total_reservations',
                'reservations as reserved_slots' => fn($q) => $q->whereNotIn('status', ['cancelled']),
            ])
            ->orderBy('starts_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $games = $query->paginate(20);

        return response()->json($games);
    }

    /**
     * Crear una nueva partida.
     */
    public function store(StoreGameRequest $request): JsonResponse
    {
        $game = Game::create([
            'created_by'  => $request->user()->id,
            'title'       => $request->title,
            'description' => $request->description,
            'location'    => $request->location,
            'starts_at'   => $request->starts_at,
            'ends_at'     => $request->ends_at,
            'max_slots'   => $request->max_slots,
            'price'       => $request->price,
            'status'      => $request->status ?? 'draft',
            'notes'       => $request->notes,
        ]);

        return response()->json([
            'message' => 'Partida creada correctamente.',
            'game'    => $game,
        ], Response::HTTP_CREATED);
    }

    /**
     * Detalle completo de una partida para el admin.
     * Incluye lista de jugadores reservados y pagos.
     */
    public function show(Game $game): JsonResponse
    {
        $game->load([
            'reservations.player.user',
            'reservations.payment',
        ]);

        $game->loadCount([
            'reservations as total_reservations',
            'reservations as confirmed_reservations' => fn($q) => $q->where('status', 'confirmed'),
        ]);

        return response()->json(['game' => $game]);
    }

    /**
     * Editar una partida existente.
     */
    public function update(UpdateGameRequest $request, Game $game): JsonResponse
    {
        $game->update($request->validated());

        return response()->json([
            'message' => 'Partida actualizada correctamente.',
            'game'    => $game,
        ]);
    }

    /**
     * Borrar una partida.
     * Permitido si: draft, cancelled, finished, o ya ha pasado ends_at.
     * Elimina reservas y pagos en cascada (FK es restrictOnDelete).
     */
    public function destroy(Game $game): JsonResponse
    {
        $isPast = $game->ends_at && $game->ends_at->isPast();

        if (! \in_array($game->status, ['draft', 'cancelled', 'finished']) && ! $isPast) {
            return response()->json([
                'message' => 'Solo se pueden eliminar partidas finalizadas, canceladas o en borrador.',
            ], Response::HTTP_CONFLICT);
        }

        DB::transaction(function () use ($game) {
            $this->deleteGameCascade($game);
        });

        return response()->json(['message' => 'Partida eliminada correctamente.']);
    }

    /**
     * Eliminar todas las partidas cuya fecha de fin ya pasó.
     */
    public function cleanup(): JsonResponse
    {
        $games = Game::whereNotNull('ends_at')->where('ends_at', '<', now())->get();

        if ($games->isEmpty()) {
            return response()->json(['message' => 'No hay partidas finalizadas para limpiar.']);
        }

        $count = $games->count();

        $controller = $this;
        DB::transaction(function () use ($games, $controller) {
            foreach ($games as $game) {
                /** @var Game $game */
                $controller->deleteGameCascade($game);
            }
        });

        return response()->json([
            'message' => "Se han eliminado {$count} partida(s) finalizada(s).",
            'deleted' => $count,
        ]);
    }

    public function deleteGameCascade(Game $game): void
    {
        $reservationIds = $game->reservations()->pluck('id');

        if ($reservationIds->isNotEmpty()) {
            // Liberar créditos gratis vinculados a estas reservas
            FreeGameCredit::whereIn('used_in_reservation_id', $reservationIds)
                ->update(['status' => 'available', 'used_in_reservation_id' => null, 'used_at' => null]);

            // Eliminar pagos → reservas → partida
            Payment::whereIn('reservation_id', $reservationIds)->delete();
            $game->reservations()->delete();
        }

        $game->delete();
    }

    /**
     * Cambiar el estado de una partida.
     * Endpoint dedicado para transiciones de estado claras.
     */
    public function updateStatus(Request $request, Game $game): JsonResponse
    {
        $request->validate([
            'status' => ['required', Rule::in(['draft', 'published', 'cancelled', 'finished'])],
        ], [
            'status.required' => 'El estado es obligatorio.',
            'status.in'       => 'Estado no válido. Opciones: borrador, publicada, cancelada, finalizada.',
        ]);

        $game->update(['status' => $request->status]);

        // Si se publica, verificamos si ya está llena
        if ($request->status === 'published' && $game->isFull()) {
            $game->update(['status' => 'full']);
        }

        // Si se cancela, anulamos todas las reservas activas y sus pagos
        if ($request->status === 'cancelled') {
            DB::transaction(function () use ($game) {
                $reservations = $game->reservations()
                    ->whereNotIn('status', ['cancelled'])
                    ->with('payment')
                    ->get();

                foreach ($reservations as $reservation) {
                    // Devolver crédito gratuito si se usó
                    if ($reservation->free_credit_id) {
                        FreeGameCredit::where('id', $reservation->free_credit_id)->update([
                            'status'                 => 'available',
                            'used_in_reservation_id' => null,
                            'used_at'                => null,
                        ]);
                    }

                    // Reembolsar si estaba pagado, eliminar si estaba pendiente
                    if ($reservation->payment) {
                        if ($reservation->payment->status === 'paid') {
                            $reservation->payment->update(['status' => 'refunded']);
                        } else {
                            $reservation->payment->delete();
                        }
                    }

                    $reservation->update(['status' => 'cancelled']);
                }
            });
        }

        return response()->json([
            'message' => "Estado actualizado a '{$game->status}'.",
            'game'    => $game,
        ]);
    }
}
