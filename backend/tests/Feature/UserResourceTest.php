<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_me_returns_the_public_user_contract_without_private_fields(): void
    {
        $user = User::factory()->create([
            'name' => 'Aluno ANOT',
            'email' => 'aluno@anot.test',
            'password' => Hash::make('SenhaSegura123'),
            'email_verified_at' => Carbon::parse('2026-09-19 12:00:00'),
            'is_platform_admin' => true,
            'is_suspended' => false,
        ]);

        $token = $user->createToken('resource-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email', 'avatar_url', 'email_verified_at'],
            ])
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.email', 'aluno@anot.test')
            ->assertJsonPath('user.email_verified_at', '2026-09-19T12:00:00+00:00')
            ->assertJsonMissingPath('user.password')
            ->assertJsonMissingPath('user.is_platform_admin')
            ->assertJsonMissingPath('user.is_suspended')
            ->assertJsonMissingPath('user.remember_token');
    }
}
