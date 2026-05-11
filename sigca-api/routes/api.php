<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PlayerController;
use App\Http\Controllers\Api\ReservationController;
use Illuminate\Support\Facades\Route;

// -------------------------------------------------------
// Rutas públicas — sin token
// -------------------------------------------------------
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// Rutas públicas de partidas (para ver calendario sin login)
Route::get('/games', [GameController::class, 'publicIndex']);
Route::get('/games/{game}', [GameController::class, 'publicShow']);

// -------------------------------------------------------
// Rutas protegidas — requieren token Sanctum válido
// -------------------------------------------------------
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // --------------------------------------------------
    // Rutas exclusivas del ADMIN
    // --------------------------------------------------
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        
        // Dashboard con estadísticas
        Route::get('/dashboard', [DashboardController::class, 'index']);
        
        // Gestión de jugadores (CRUD completo + bonos manuales)
        Route::post('players/{player}/credits', [PlayerController::class, 'addCredit']);
        Route::delete('players/{player}/credits', [PlayerController::class, 'removeCredit']);
        Route::apiResource('players', PlayerController::class);
        
        // Gestión de partidas (CRUD completo)
        Route::delete('games/cleanup', [GameController::class, 'cleanup']);
        Route::apiResource('games', GameController::class);
        Route::patch('games/{game}/status', [GameController::class, 'updateStatus']);
        
        // Gestión de reservas
        Route::get('/reservations', [ReservationController::class, 'adminIndex']);
        Route::get('/reservations/{reservation}', [ReservationController::class, 'show']);
        Route::patch('/reservations/{reservation}/confirm', [ReservationController::class, 'confirm']);
        Route::delete('/reservations/{reservation}', [ReservationController::class, 'destroy']);
        
        // Control de asistencia
        Route::patch('/reservations/{reservation}/attendance', [AttendanceController::class, 'update']);
        
        // Gestión de pagos
        Route::get('/payments', [PaymentController::class, 'index']);
        Route::get('/payments/summary', [PaymentController::class, 'summary']);
        Route::get('/payments/{payment}', [PaymentController::class, 'show']);
        Route::post('/payments', [PaymentController::class, 'store']);
        Route::put('/payments/{payment}', [PaymentController::class, 'updateStatus']);
        Route::patch('/payments/{payment}/confirm', [PaymentController::class, 'confirmPayment']);
        Route::delete('/payments/{payment}', [PaymentController::class, 'destroy']);

        // Gestión de administradores
        Route::get('/admins', [AdminController::class, 'index']);
        Route::post('/admins', [AdminController::class, 'store']);
        Route::get('/admins/{admin}', [AdminController::class, 'show']);
        Route::put('/admins/{admin}', [AdminController::class, 'update']);
        Route::delete('/admins/{admin}', [AdminController::class, 'destroy']);

        // Notificaciones
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
        Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    });

    // --------------------------------------------------
    // Rutas exclusivas del PLAYER (jugador registrado)
    // --------------------------------------------------
    Route::middleware('role:player')->prefix('player')->group(function () {
        // Ver mis reservas
        Route::get('/reservations', [ReservationController::class, 'index']);
        
        // Crear nueva reserva
        Route::post('/reservations', [ReservationController::class, 'store']);
        
        // Cancelar mi reserva
        Route::delete('/reservations/{reservation}', [ReservationController::class, 'destroy']);
        
        // Ver mi cartilla de fidelización
        Route::get('/loyalty', [ReservationController::class, 'loyalty']);
        
        // Perfil del jugador (ver, editar, eliminar cuenta)
        Route::get('/profile', [PlayerController::class, 'profile']);
        Route::put('/profile', [PlayerController::class, 'updateProfile']);
        Route::post('/profile/avatar', [PlayerController::class, 'uploadAvatar']);
        Route::put('/profile/password', [PlayerController::class, 'changePassword']);
        Route::delete('/profile', [PlayerController::class, 'deleteAccount']);
    });
});