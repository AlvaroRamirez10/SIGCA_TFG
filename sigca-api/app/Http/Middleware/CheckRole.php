<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Verifica que el usuario autenticado tiene el rol requerido.
     *
     * Uso en rutas:
     *   ->middleware('role:admin')
     *   ->middleware('role:player')
     *   ->middleware('role:admin,player')  // cualquiera de los dos
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! $request->user()) {
            return response()->json([
                'message' => 'No autenticado.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (! in_array($request->user()->role, $roles)) {
            return response()->json([
                'message' => 'No tienes permiso para realizar esta acción.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}