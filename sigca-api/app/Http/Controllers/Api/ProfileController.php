<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    // Ver perfil
    public function show(Request $request)
    {
        $user = $request->user();
        $player = $user->player;

        return response()->json([
            'user' => $user,
            'player' => $player,
        ]);
    }

    // Actualizar perfil
    public function update(Request $request)
    {
        $user = $request->user();
        $player = $user->player;

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'alias' => 'sometimes|string|max:100',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
        ]);

        // Actualizar usuario
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

        return response()->json([
            'message' => 'Perfil actualizado correctamente',
            'user' => $user->fresh(),
            'player' => $player->fresh(),
        ]);
    }

    // Subir avatar
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $player = $request->user()->player;

        // Eliminar avatar anterior si existe
        if ($player->avatar) {
            Storage::disk('public')->delete($player->avatar);
        }

        // Guardar nueva imagen
        $path = $request->file('avatar')->store('avatars', 'public');
        $player->avatar = $path;
        $player->save();

        return response()->json([
            'message' => 'Avatar actualizado correctamente',
            'avatar_url' => Storage::url($path),
        ]);
    }

    // Cambiar contraseña
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = $request->user();

        // Verificar contraseña actual
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'La contraseña actual es incorrecta',
            ], 422);
        }

        // Actualizar contraseña
        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'message' => 'Contraseña actualizada correctamente',
        ]);
    }

    // Eliminar cuenta
    public function destroy(Request $request)
    {
        $request->validate([
            'password' => 'required',
        ]);

        $user = $request->user();

        // Verificar contraseña
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Contraseña incorrecta',
            ], 422);
        }

        $player = $user->player;

        // Eliminar avatar si existe
        if ($player->avatar) {
            Storage::disk('public')->delete($player->avatar);
        }

        // Eliminar usuario (cascade eliminará el player)
        $user->delete();

        return response()->json([
            'message' => 'Cuenta eliminada correctamente',
        ]);
    }
}