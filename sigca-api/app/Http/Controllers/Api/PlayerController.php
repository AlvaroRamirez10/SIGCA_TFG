<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Player\StorePlayerRequest;
use App\Http\Requests\Player\UpdatePlayerRequest;
use App\Models\LoyaltyCard;
use App\Models\Player;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Storage;

class PlayerController extends Controller
{
    /**
     * Listar todos los jugadores con su cartilla de sellos.
     * Soporta búsqueda por nombre/alias y filtro por estado.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Player::with(['user', 'loyaltyCard' => function ($q) {
                $q->withCount(['freeGameCredits as available_credits' => fn($q) => $q->where('status', 'available')]);
            }])
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

            LoyaltyCard::create([
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
            $userFields = $request->only(['name', 'email', 'phone']);
            if ($request->filled('password')) {
                $userFields['password'] = Hash::make($request->password);
            }
            if (!empty($userFields)) {
                $player->user->update($userFields);
            }

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

    // ========================================================================
    // MÉTODOS DE PERFIL (para el jugador autenticado)
    // ========================================================================

    /**
     * Ver el perfil del jugador autenticado
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();
        $player = $user->player;

        if (!$player) {
            return response()->json([
                'message' => 'No se encontró el perfil de jugador.'
            ], 404);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'player' => [
                'id' => $player->id,
                'alias' => $player->alias,
                'phone' => $player->phone,
                'birthdate' => $player->birthdate,
                'avatar' => $player->avatar,
                'status' => $player->status,
                'no_show_count' => $player->no_show_count,
            ]
        ]);
    }

    /**
     * Actualizar perfil del jugador autenticado
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $request->user()->id,
            'alias' => 'sometimes|string|max:100',
            'phone' => 'nullable|string|max:20',
        ]);

        DB::beginTransaction();
        try {
            $user = $request->user();
            $player = $user->player;

            // Actualizar user
            if (isset($validated['name'])) {
                $user->name = $validated['name'];
            }
            if (isset($validated['email'])) {
                $user->email = $validated['email'];
            }
            $user->save();

            // Actualizar player
            if (isset($validated['alias'])) {
                $player->alias = $validated['alias'];
            }
            if (isset($validated['phone'])) {
                $player->phone = $validated['phone'];
            }
            $player->save();

            DB::commit();

            return response()->json([
                'message' => 'Perfil actualizado correctamente',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'player' => [
                    'id' => $player->id,
                    'alias' => $player->alias,
                    'phone' => $player->phone,
                    'avatar' => $player->avatar,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al actualizar el perfil',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Subir avatar del jugador
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg|max:2048', // 2MB máximo
        ]);

        $player = $request->user()->player;

        if (!$player) {
            return response()->json(['message' => 'Jugador no encontrado'], 404);
        }

        try {
            // Eliminar avatar anterior si existe
            if ($player->avatar && Storage::disk('public')->exists($player->avatar)) {
                Storage::disk('public')->delete($player->avatar);
            }

            // Guardar nuevo avatar
            $path = $request->file('avatar')->store('avatars', 'public');
            $player->update(['avatar' => $path]);

            return response()->json([
                'message' => 'Avatar actualizado correctamente',
                'avatar' => $path,
                'avatar_url' => asset('storage/' . $path)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al subir el avatar',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cambiar contraseña del jugador
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        // Verificar contraseña actual
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'La contraseña actual es incorrecta',
                'errors' => [
                    'current_password' => ['La contraseña actual es incorrecta']
                ]
            ], 422);
        }

        // Actualizar contraseña
        $user->password = Hash::make($validated['new_password']);
        $user->save();

        return response()->json([
            'message' => 'Contraseña actualizada correctamente'
        ]);
    }

    /**
     * Eliminar cuenta del jugador (él mismo)
     */
    public function deleteAccount(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        // Verificar contraseña
        if (!Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Contraseña incorrecta',
                'errors' => [
                    'password' => ['La contraseña es incorrecta']
                ]
            ], 422);
        }

        try {
            DB::transaction(function () use ($user) {
                // Eliminar avatar si existe
                $player = $user->player;
                if ($player && $player->avatar && Storage::disk('public')->exists($player->avatar)) {
                    Storage::disk('public')->delete($player->avatar);
                }

                // Eliminar usuario (cascade eliminará el player)
                $user->delete();
            });

            return response()->json([
                'message' => 'Cuenta eliminada correctamente'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al eliminar la cuenta',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // -------------------------------------------------------
    // RUTAS ADMIN — gestión manual de bonos
    // -------------------------------------------------------

    /**
     * El admin añade un bono de partida gratis a un jugador (sorteo en campo, etc.).
     */
    public function addCredit(Player $player): JsonResponse
    {
        $loyaltyCard = $player->loyaltyCard;

        if (!$loyaltyCard) {
            return response()->json(['message' => 'El jugador no tiene tarjeta de fidelización.'], 404);
        }

        \App\Models\FreeGameCredit::create([
            'loyalty_card_id' => $loyaltyCard->id,
            'status'          => 'available',
            'earned_at'       => now(),
        ]);

        $loyaltyCard->increment('total_credits_earned');

        $available = $loyaltyCard->freeGameCredits()->where('status', 'available')->count();

        return response()->json([
            'message'           => 'Bono gratis añadido correctamente.',
            'available_credits' => $available,
        ]);
    }

    /**
     * El admin quita un bono de partida gratis disponible a un jugador.
     */
    public function removeCredit(Player $player): JsonResponse
    {
        $loyaltyCard = $player->loyaltyCard;

        if (!$loyaltyCard) {
            return response()->json(['message' => 'El jugador no tiene tarjeta de fidelización.'], 404);
        }

        $credit = $loyaltyCard->freeGameCredits()->where('status', 'available')->first();

        if (!$credit) {
            return response()->json(['message' => 'El jugador no tiene bonos disponibles.'], 422);
        }

        $credit->delete();

        $available = $loyaltyCard->freeGameCredits()->where('status', 'available')->count();

        return response()->json([
            'message'           => 'Bono gratis eliminado correctamente.',
            'available_credits' => $available,
        ]);
    }
}