<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\PlayerController;
use Illuminate\Support\Facades\Route;

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
        Route::patch('games/{game}/status', [GameController::class, 'updateStatus']);
    });

    Route::middleware('role:player')->prefix('player')->group(function () {
        // Fase 5
    });
});