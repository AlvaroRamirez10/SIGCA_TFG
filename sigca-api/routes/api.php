<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PlayerController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AttendanceController;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::apiResource('players', PlayerController::class);
        Route::patch('reservations/{reservation}/attendance', [AttendanceController::class, 'update']);
    });

    Route::middleware('role:player')->prefix('player')->group(function () {
        // próximas fases
    });
});