<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password as PasswordBroker;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        if ($request->has('email')) {
            $request->merge([
                'email' => strtolower(trim($request->email)),
            ]);
        }

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email',
                'password' => [
                    'required',
                    'string',
                    Password::min(8)->mixedCase()->numbers(),
                    'confirmed',
                ],
                'avatar_url' => 'nullable|string|url',
            ], [
                'password' => 'A senha não atende aos requisitos mínimos.',
                'password.min' => 'A senha não atende aos requisitos mínimos.',
                'password.mixed' => 'A senha não atende aos requisitos mínimos.',
                'password.numbers' => 'A senha não atende aos requisitos mínimos.',
            ]);
        } catch (ValidationException $e) {
            $errors = $e->errors();
            if (isset($errors['email'])) {
                return response()->json([
                    'message' => 'Este e-mail já está cadastrado no sistema.',
                    'errors' => $errors,
                ], 422);
            }
            throw $e;
        }

        $user = User::create([
            'name' => trim($validated['name']),
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'avatar_url' => $validated['avatar_url'] ?? null,
        ]);

        event(new Registered($user));

        $token = $user->createToken('anot_auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Usuário registrado com sucesso.',
            'user' => UserResource::make($user),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        if ($request->has('email')) {
            $request->merge([
                'email' => strtolower(trim($request->email)),
            ]);
        }

        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Credenciais inválidas.',
            ], 401);
        }

        if ($user->is_suspended) {
            return response()->json([
                'message' => 'Esta conta está suspensa. Entre em contato com o suporte.',
            ], 403);
        }

        $token = $user->createToken('anot_auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'user' => UserResource::make($user),
            'token' => $token,
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
        ]);

        PasswordBroker::sendResetLink(['email' => strtolower(trim($validated['email']))]);

        return response()->json([
            'message' => 'Se o e-mail estiver cadastrado, enviaremos instruções para redefinir a senha.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'email' => 'required|string|email',
            'password' => [
                'required',
                'string',
                Password::min(8)->mixedCase()->numbers(),
                'confirmed',
            ],
        ]);

        $status = PasswordBroker::reset(
            [
                'email' => strtolower(trim($validated['email'])),
                'password' => $validated['password'],
                'password_confirmation' => $request->input('password_confirmation'),
                'token' => $validated['token'],
            ],
            function (User $user, string $password): void {
                $user->forceFill(['password' => Hash::make($password)])->save();
                $user->tokens()->delete();
            },
        );

        if ($status !== PasswordBroker::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Não foi possível redefinir a senha com os dados informados.',
            ], 422);
        }

        return response()->json([
            'message' => 'Senha redefinida com sucesso. Faça login novamente.',
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }

    public function logoutAll(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Todas as sessões foram encerradas com sucesso.',
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => UserResource::make($request->user()),
        ]);
    }

    public function deleteAccount(Request $request)
    {
        $validated = $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'A senha informada está incorreta.',
            ], 422);
        }

        DB::transaction(function () use ($user): void {
            $user->tokens()->delete();
            $user->delete();
        });

        return response()->json([
            'message' => 'Conta excluída com sucesso.',
        ]);
    }
}
