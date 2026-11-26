<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    public function index()
    {
        return response()->json([
            'name' => 'ANOT API',
            'status' => 'online',
            'version' => config('app.version', '1.0.0'),
        ]);
    }

    public function health()
    {
        $checks = [
            'database' => $this->databaseCheck(),
            'cache' => $this->cacheCheck(),
        ];

        $healthy = collect($checks)->every(
            fn (string $status): bool => $status === 'ok',
        );

        return response()->json([
            'status' => $healthy ? 'ok' : 'degraded',
            'version' => config('app.version', '1.0.0'),
            'timestamp' => now()->toIso8601String(),
            'checks' => $checks,
        ], 200);
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

    private function cacheCheck(): string
    {
        try {
            Cache::put('_health_check', true, 10);
            $val = Cache::get('_health_check');

            return $val === true ? 'ok' : 'unavailable';
        } catch (Throwable) {
            return 'unavailable';
        }
    }
}
