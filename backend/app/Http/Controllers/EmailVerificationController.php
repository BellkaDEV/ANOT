<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class EmailVerificationController extends Controller
{
    public function verify(Request $request, int $id, string $hash): View|JsonResponse
    {
        $user = User::findOrFail($id);

        abort_unless(hash_equals(sha1($user->getEmailForVerification()), $hash), 403);

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        if ($request->expectsJson()) {
            return response()->json(['message' => 'E-mail verificado com sucesso.']);
        }

        return view('auth.verified');
    }

    public function resend(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Este e-mail já foi verificado.']);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'E-mail de verificação enviado.'], 202);
    }
}
