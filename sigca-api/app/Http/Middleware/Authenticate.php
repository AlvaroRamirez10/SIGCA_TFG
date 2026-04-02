<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Sobreescribimos redirectTo para que nunca intente
     * redirigir a la ruta 'login' — al devolver null
     * Laravel lanza AuthenticationException que nosotros
     * capturamos en bootstrap/app.php y devolvemos JSON.
     */
    protected function redirectTo(Request $request): ?string
    {
        return null;
    }
}