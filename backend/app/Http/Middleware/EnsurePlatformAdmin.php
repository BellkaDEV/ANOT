<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlatformAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user?->is_platform_admin || $user->is_suspended) {
            if (! $request->expectsJson()) {
                abort(403);
            }

            return response()->json([
                'message' => 'Acesso restrito à administração da plataforma.',
            ], 403);
        }

        return $next($request);
    }
}
