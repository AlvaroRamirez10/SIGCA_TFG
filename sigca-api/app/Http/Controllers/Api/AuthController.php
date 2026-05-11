<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\LoyaltyCard;
use App\Models\Player;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    /**
     * Registro de nuevo jugador desde la web pública.
     *
     * Crea en una sola transacción:
     *   1. User  (role = player)
     *   2. Player (perfil extendido)
     *   3. LoyaltyCard (cartilla de sellos vacía)
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
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
            ]);

            LoyaltyCard::create([
                'player_id' => $player->id,
            ]);

            return $user;
        });

        $token = $user->createToken('web-player')->plainTextToken;

        return response()->json([
            'message' => '¡Bienvenido a SIGCA!',
            'token'   => $token,
            'user'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ], Response::HTTP_CREATED);
    }

    /**
     * Login compartido para admin y player.
     * El frontend usa el campo "role" de la respuesta
     * para redirigir al área correcta.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Credenciales incorrectas.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $tokenName = $user->isAdmin() ? 'admin-token' : 'player-token';
        $token     = $user->createToken($tokenName)->plainTextToken;

        return response()->json([
            'message' => 'Login correcto.',
            'token'   => $token,
            'user'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ]);
    }

    /**
     * Logout — revoca solo el token actual.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }

    /**
     * Devuelve los datos del usuario autenticado.
     * El frontend llama a este endpoint al arrancar
     * para verificar si el token sigue siendo válido.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('player.loyaltyCard');

        return response()->json([
            'user' => $user,
        ]);
    }
}