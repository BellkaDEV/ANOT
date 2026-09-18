<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlatformAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->is_platform_admin) {
            return response()->json([
                'message' => 'Acesso restrito à administração da plataforma.',
            ], 403);
        }

        return $next($request);
    }
}
