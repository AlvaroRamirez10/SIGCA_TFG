<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Player\StorePlayerRequest;
use App\Http\Requests\Player\UpdatePlayerRequest;
use App\Models\Player;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class PlayerController extends Controller
{
    /**
     * Listar todos los jugadores con su cartilla de sellos.
     * Soporta búsqueda por nombre/alias y filtro por estado.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Player::with(['user', 'loyaltyCard'])
            ->orderBy('created_at', 'desc');

        // Filtro por estado: ?status=warned
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Búsqueda por nombre o alias: ?search=carlos
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%"))
                  ->orWhere('alias', 'like', "%{$search}%");
            });
        }

        $players = $query->paginate(20);

        return response()->json($players);
    }

    /**
     * Crear un jugador manualmente desde la app del admin.
     * Crea User + Player + LoyaltyCard en una sola transacción.
     */
    public function store(StorePlayerRequest $request): JsonResponse
    {
        $player = DB::transaction(function () use ($request) {
            $user = User::create([
                'name'     => $request->name,
                'email'    => $request->email,
                'password' => Hash::make($request->password),
                'role'     => 'player',
                'phone'    => $request->phone,
            ]);

            $player = Player::create([
                'user_id' => $user->id,
                'alias'   => $request->alias,
                'phone'   => $request->phone,
                'notes'   => $request->notes,
            ]);

            \App\Models\LoyaltyCard::create([
                'player_id' => $player->id,
            ]);

            return $player;
        });

        $player->load(['user', 'loyaltyCard']);

        return response()->json([
            'message' => 'Jugador creado correctamente.',
            'player'  => $player,
        ], Response::HTTP_CREATED);
    }

    /**
     * Ver el detalle completo de un jugador.
     * Incluye historial de reservas y cartilla.
     */
    public function show(Player $player): JsonResponse
    {
        $player->load([
            'user',
            'loyaltyCard.freeGameCredits',
            'reservations.game',
            'reservations.payment',
        ]);

        return response()->json([
            'player' => $player,
        ]);
    }

    /**
     * Editar datos de un jugador.
     * El admin puede cambiar nombre, alias, teléfono, estado y notas.
     */
    public function update(UpdatePlayerRequest $request, Player $player): JsonResponse
    {
        DB::transaction(function () use ($request, $player) {
            // Actualizamos el User asociado si vienen datos de él
            if ($request->filled('name') || $request->filled('email')) {
                $player->user->update(
                    $request->only(['name', 'email', 'phone'])
                );
            }

            // Actualizamos el perfil del jugador
            $player->update(
                $request->only(['alias', 'phone', 'status', 'notes'])
            );
        });

        $player->load(['user', 'loyaltyCard']);

        return response()->json([
            'message' => 'Jugador actualizado correctamente.',
            'player'  => $player,
        ]);
    }

    /**
     * Borrar un jugador.
     *
     * ⚠️  Si tiene reservas, la BD lanzará un error por restrictOnDelete.
     * En ese caso devolvemos un mensaje claro en lugar de un 500.
     * La alternativa correcta es cambiar su estado a 'blocked'.
     */
    public function destroy(Player $player): JsonResponse
    {
        try {
            DB::transaction(function () use ($player) {
                $player->user->delete(); // cascade borra el player también
            });

            return response()->json([
                'message' => 'Jugador eliminado correctamente.',
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json([
                'message' => 'No se puede eliminar un jugador con reservas. Cambia su estado a "bloqueado" en su lugar.',
            ], Response::HTTP_CONFLICT);
        }
    }
}