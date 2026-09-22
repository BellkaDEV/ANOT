<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    public function index()
    {
        return response()->json([
            'name' => 'ANOT API',
            'status' => 'online',
            'version' => env('APP_VERSION', 'unknown'),
        ]);
    }

    public function health()
    {
        $checks = [
            'database' => $this->databaseCheck(),
        ];

        $healthy = collect($checks)->every(
            fn (string $status): bool => $status === 'ok',
        );

        return response()->json([
            'status' => $healthy ? 'ok' : 'degraded',
            'version' => env('APP_VERSION', 'unknown'),
            'timestamp' => now()->toIso8601String(),
            'checks' => $checks,
        ], $healthy ? 200 : 503);
    }

    private function databaseCheck(): string
    {
        try {
            DB::select('select 1');

            return 'ok';
        } catch (Throwable) {
            return 'unavailable';
        }
    }
}
