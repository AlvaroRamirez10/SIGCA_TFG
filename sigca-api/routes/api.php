<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\PlayerController;
use App\Http\Controllers\Api\ReservationController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ProfileController;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

Route::get('/games',        [GameController::class, 'publicIndex']);
Route::get('/games/{game}', [GameController::class, 'publicShow']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::apiResource('players', PlayerController::class);
        Route::patch('reservations/{reservation}/attendance', [AttendanceController::class, 'update']);
        Route::apiResource('games', GameController::class);
        Route::patch('games/{game}/status',                   [GameController::class, 'updateStatus']);
        Route::get('reservations',                            [ReservationController::class, 'adminIndex']);
        Route::patch('reservations/{reservation}/confirm',    [ReservationController::class, 'confirmPayment']);
        Route::get('dashboard', [DashboardController::class, 'index']);
    });

    Route::middleware('role:player')->prefix('player')->group(function () {
        Route::get('reservations',                  [ReservationController::class, 'index']);
        Route::post('reservations',                 [ReservationController::class, 'store']);
        Route::delete('reservations/{reservation}', [ReservationController::class, 'destroy']);
        Route::get('loyalty',                       [ReservationController::class, 'loyalty']);
        
        // Rutas de perfil
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
        Route::put('/profile/password', [ProfileController::class, 'changePassword']);
        Route::delete('/profile', [ProfileController::class, 'destroy']);
    });
});