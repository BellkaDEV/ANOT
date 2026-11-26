<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthFlowRegressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_with_non_existent_account_fails_immediately_with_401(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'naoexiste@anot.app',
            'password' => 'Senha123456',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('message', 'Credenciais inválidas.');
    }

    public function test_login_with_wrong_password_fails_with_401(): void
    {
        User::factory()->create([
            'email' => 'aluno@anot.app',
            'password' => Hash::make('SenhaCerta123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'aluno@anot.app',
            'password' => 'SenhaErrada123',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('message', 'Credenciais inválidas.');
    }

    public function test_login_with_empty_fields_returns_422_with_validation_errors(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => '',
            'password' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_register_with_malformed_email_does_not_claim_email_is_already_registered(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Aluno Teste',
            'email' => 'email-invalido-sem-arroba',
            'password' => 'SenhaForte123',
            'password_confirmation' => 'SenhaForte123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        $message = $response->json('message');
        $this->assertStringNotContainsString('já está cadastrado', $message);
    }

    public function test_register_with_duplicate_email_returns_friendly_duplicate_error(): void
    {
        User::factory()->create([
            'email' => 'duplicado@anot.app',
        ]);

        $response = $this->postJson('/api/register', [
            'name' => 'Outro Aluno',
            'email' => 'duplicado@anot.app',
            'password' => 'SenhaForte123',
            'password_confirmation' => 'SenhaForte123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email'])
            ->assertJsonPath('errors.email.0', 'Este e-mail já está cadastrado no sistema.');
    }

    public function test_register_and_retrieve_current_user_me_flow(): void
    {
        $register = $this->postJson('/api/register', [
            'name' => 'Maria Silva',
            'email' => 'maria.silva@anot.app',
            'password' => 'SenhaForte123',
            'password_confirmation' => 'SenhaForte123',
        ]);

        $register->assertStatus(201)
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);

        $token = $register->json('token');

        $me = $this->withToken($token)->getJson('/api/me');
        $me->assertStatus(200)
            ->assertJsonPath('user.email', 'maria.silva@anot.app')
            ->assertJsonPath('user.name', 'Maria Silva');
    }
}
