<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['name' => 'ANOT API', 'status' => 'online']);
});

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()->toIso8601String()]);
});
