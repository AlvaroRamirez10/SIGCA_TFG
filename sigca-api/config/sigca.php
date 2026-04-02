<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Umbral de No-Shows
    |--------------------------------------------------------------------------
    | Número de inasistencias sin aviso que activa la alerta sobre un jugador.
    | Cuando noshow_count alcanza este valor, el status pasa a 'warned'.
    | Cambia este valor en .env con: SIGCA_NOSHOW_THRESHOLD=3
    */
    'noshow_threshold' => env('SIGCA_NOSHOW_THRESHOLD', 3),

    /*
    |--------------------------------------------------------------------------
    | Sellos para partida gratis
    |--------------------------------------------------------------------------
    | Número de asistencias consecutivas necesarias para ganar una partida gratis.
    */
    'loyalty_stamps_required' => env('SIGCA_LOYALTY_STAMPS', 5),
];