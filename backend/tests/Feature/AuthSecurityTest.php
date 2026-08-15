<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_with_valid_credentials_succeeds()
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

    public function test_login_with_non_existent_account_fails()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'fantasma@inexistente.com',
            'password' => 'senhaQualquer',
        ]);

        $response->assertStatus(401)
                 ->assertJsonPath('message', 'Usuário ou senha inválidos.');
    }

    public function test_login_with_wrong_password_fails()
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
                 ->assertJsonPath('message', 'Usuário ou senha inválidos.');
    }

    public function test_accessing_protected_route_without_token_fails()
    {
        $response = $this->getJson('/api/classes');

        $response->assertStatus(401);
    }

    public function test_accessing_protected_route_with_invalid_token_fails()
    {
        $response = $this->withHeader('Authorization', 'Bearer token_ficticio_e_invalido_123')
                         ->getJson('/api/classes');

        $response->assertStatus(401);
    }

    public function test_user_registration_creates_account_and_hashes_password()
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
}
