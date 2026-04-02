<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Game\StoreGameRequest;
use App\Http\Requests\Game\UpdateGameRequest;
use App\Models\Game;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
        if (! $game->isPublished()) {
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
        $query = Game::withCount([
            'reservations as total_reservations',
            'reservations as confirmed_reservations' => fn($q) => $q->where('status', 'confirmed'),
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
     * Solo se puede borrar si está en draft o cancelled.
     */
    public function destroy(Game $game): JsonResponse
    {
        if (! in_array($game->status, ['draft', 'cancelled'])) {
            return response()->json([
                'message' => 'Solo se pueden eliminar partidas en estado draft o cancelled.',
            ], Response::HTTP_CONFLICT);
        }

        $game->delete();

        return response()->json([
            'message' => 'Partida eliminada correctamente.',
        ]);
    }

    /**
     * Cambiar el estado de una partida.
     * Endpoint dedicado para transiciones de estado claras.
     */
    public function updateStatus(Request $request, Game $game): JsonResponse
    {
        $request->validate([
            'status' => ['required', Rule::in(['draft', 'published', 'cancelled', 'finished'])],
        ]);

        $game->update(['status' => $request->status]);

        // Si se publica, verificamos si ya está llena
        if ($request->status === 'published' && $game->isFull()) {
            $game->update(['status' => 'full']);
        }

        return response()->json([
            'message' => "Estado actualizado a '{$game->status}'.",
            'game'    => $game,
        ]);
    }
}
