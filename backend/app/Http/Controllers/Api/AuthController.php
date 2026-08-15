<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
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
                'password' => 'required|string|min:6|confirmed',
                'avatar_url' => 'nullable|string|url',
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

        $token = $user->createToken('anot_auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Usuário registrado com sucesso.',
            'user' => $user,
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

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Usuário ou senha inválidos.'
            ], 401);
        }

        $token = $user->createToken('anot_auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }
}
