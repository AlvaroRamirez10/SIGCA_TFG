<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AdminController extends Controller
{
    public function index()
    {
        $admins = User::where('role', 'admin')
                      ->select('id', 'name', 'email', 'phone', 'created_at')
                      ->orderBy('name')
                      ->get();

        return response()->json($admins);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'                  => 'required|string|max:255',
            'email'                 => 'required|email|unique:users,email',
            'password'              => ['required', 'confirmed', Password::min(8)],
            'phone'                 => 'nullable|string|max:20',
        ], [
            'name.required'         => 'El nombre es obligatorio.',
            'email.required'        => 'El email es obligatorio.',
            'email.unique'          => 'Ya existe un usuario con ese email.',
            'password.required'     => 'La contraseña es obligatoria.',
            'password.confirmed'    => 'Las contraseñas no coinciden.',
        ]);

        $admin = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => 'admin',
            'phone'    => $validated['phone'] ?? null,
        ]);

        return response()->json([
            'message' => 'Administrador creado correctamente.',
            'admin'   => $admin->only('id', 'name', 'email', 'phone', 'created_at'),
        ], 201);
    }

    public function show(int $id)
    {
        $admin = User::where('role', 'admin')
                     ->select('id', 'name', 'email', 'phone', 'created_at')
                     ->findOrFail($id);

        return response()->json($admin);
    }

    public function update(Request $request, int $id)
    {
        $admin = User::where('role', 'admin')->findOrFail($id);

        $validated = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'email'    => 'sometimes|email|unique:users,email,' . $admin->id,
            'phone'    => 'nullable|string|max:20',
            'password' => 'sometimes|nullable|string|min:8',
        ], [
            'email.unique'    => 'Ya existe un usuario con ese email.',
            'password.min'    => 'La contraseña debe tener al menos 8 caracteres.',
        ]);

        if (isset($validated['password']) && $validated['password']) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $admin->update($validated);

        return response()->json([
            'message' => 'Administrador actualizado correctamente.',
            'admin'   => $admin->fresh()->only('id', 'name', 'email', 'phone', 'created_at'),
        ]);
    }

    public function destroy(Request $request, int $id)
    {
        $admin = User::where('role', 'admin')->findOrFail($id);

        if ($admin->id === $request->user()->id) {
            return response()->json([
                'message' => 'No puedes eliminar tu propia cuenta de administrador.',
            ], 403);
        }

        $admin->delete();

        return response()->json([
            'message' => 'Administrador eliminado correctamente.',
        ]);
    }
}
