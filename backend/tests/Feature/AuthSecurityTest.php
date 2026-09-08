<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_with_valid_credentials_succeeds(): void
    {
        $user = User::factory()->create([
            'email' => 'aluno.real@universidade.edu.br',
            'password' => Hash::make('senhaSegura123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'aluno.real@universidade.edu.br',
            'password' => 'senhaSegura123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user', 'message'])
            ->assertJsonPath('user.email', 'aluno.real@universidade.edu.br');

        $this->assertNotEmpty($response->json('token'));
    }

    public function test_login_with_non_existent_account_fails_generically(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'fantasma@inexistente.com',
            'password' => 'senhaQualquer',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('message', 'Credenciais inválidas.');
    }

    public function test_login_with_wrong_password_fails_generically(): void
    {
        User::factory()->create([
            'email' => 'usuario.existente@test.com',
            'password' => Hash::make('senhaCorreta123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'usuario.existente@test.com',
            'password' => 'senhaErrada999',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('message', 'Credenciais inválidas.');
    }

    public function test_login_failures_do_not_reveal_whether_email_exists(): void
    {
        User::factory()->create([
            'email' => 'usuario.existente@test.com',
            'password' => Hash::make('senhaCorreta123'),
        ]);

        $unknownEmail = $this->postJson('/api/login', [
            'email' => 'fantasma@inexistente.com',
            'password' => 'senhaErrada999',
        ]);
        $wrongPassword = $this->postJson('/api/login', [
            'email' => 'usuario.existente@test.com',
            'password' => 'senhaErrada999',
        ]);

        $this->assertSame(
            $unknownEmail->json('message'),
            $wrongPassword->json('message'),
        );
    }

    public function test_accessing_protected_route_without_token_fails(): void
    {
        $this->getJson('/api/classes')->assertStatus(401);
    }

    public function test_accessing_protected_route_with_invalid_token_fails(): void
    {
        $this->withHeader('Authorization', 'Bearer token_ficticio_e_invalido_123')
            ->getJson('/api/classes')
            ->assertStatus(401);
    }

    public function test_user_registration_creates_account_and_hashes_password(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Matheus Henrique',
            'email' => 'matheus.henrique@universidade.edu.br',
            'password' => 'MinhaSenhaSegura2026',
            'password_confirmation' => 'MinhaSenhaSegura2026',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['token', 'user']);

        $this->assertDatabaseHas('users', [
            'email' => 'matheus.henrique@universidade.edu.br',
        ]);

        $createdUser = User::where('email', 'matheus.henrique@universidade.edu.br')->first();
        $this->assertNotEquals('MinhaSenhaSegura2026', $createdUser->password);
        $this->assertTrue(Hash::check('MinhaSenhaSegura2026', $createdUser->password));
    }

    public function test_logout_all_revokes_all_tokens_for_the_user(): void
    {
        $user = User::factory()->create();
        $tokenOne = $user->createToken('device-one')->plainTextToken;
        $tokenTwo = $user->createToken('device-two')->plainTextToken;

        $response = $this->withToken($tokenOne)->postJson('/api/logout-all');

        $response->assertOk();
        $this->assertDatabaseCount('personal_access_tokens', 0);
        Auth::forgetGuards();
        $this->withToken($tokenOne)->getJson('/api/me')->assertUnauthorized();
        $this->withToken($tokenTwo)->getJson('/api/me')->assertUnauthorized();
    }
}
