<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CupboardController;
use App\Http\Controllers\Api\PlaceController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\BorrowingController;
use App\Http\Controllers\Api\AuditLogController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Cupboards & Places
    Route::apiResource('cupboards', CupboardController::class);
    Route::apiResource('places', PlaceController::class);

    // Items
    Route::apiResource('items', ItemController::class);
    Route::patch('/items/{item}/quantity', [ItemController::class, 'updateQuantity']);

    // Borrowings
    Route::get('/borrowings', [BorrowingController::class, 'index']);
    Route::post('/borrowings', [BorrowingController::class, 'store']);
    Route::get('/borrowings/{borrowing}', [BorrowingController::class, 'show']);
    Route::patch('/borrowings/{borrowing}/return', [BorrowingController::class, 'returnItem']);

    // Audit Logs
    Route::get('/audit-logs', [AuditLogController::class, 'index']);

    // Admin only routes
    Route::middleware('admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });
});