<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', fn() => response()->json(['status' => 'ok', 'service' => 'review-service']));
Route::get('/ready',  fn() => response()->json(['status' => 'ready']));

Route::prefix('reviews')->group(function () {
    Route::get('/',                 [\App\Http\Controllers\ReviewController::class, 'index']);
    Route::post('/',                [\App\Http\Controllers\ReviewController::class, 'store']);
    Route::get('/{id}',             [\App\Http\Controllers\ReviewController::class, 'show']);
    Route::put('/{id}',             [\App\Http\Controllers\ReviewController::class, 'update']);
    Route::delete('/{id}',          [\App\Http\Controllers\ReviewController::class, 'destroy']);
    Route::get('/listing/{listingId}', [\App\Http\Controllers\ReviewController::class, 'byListing']);
});
