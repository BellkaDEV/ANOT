<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\SchoolClass;
use Illuminate\Support\Facades\RateLimiter;

class AuthenticationHardeningAndAbuseTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('login');
        RateLimiter::clear('register');
        RateLimiter::clear('join-class');
    }

    public function test_rejects_weak_password_under_12_characters()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Teste Senha Fraca',
            'email' => 'fraca@anot.app',
            'password' => 'senha123', // apenas 8 chars
            'password_confirmation' => 'senha123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['password']);
    }

    public function test_normalizes_email_with_trim_and_lowercase()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Teste Email Normalizado',
            'email' => '  NORMALIZADO@ANOT.APP  ',
            'password' => 'SenhaForte1234!',
            'password_confirmation' => 'SenhaForte1234!',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email' => 'normalizado@anot.app',
        ]);

        // Login com e-mail com espaços e maiúsculas
        $loginRes = $this->postJson('/api/login', [
            'email' => ' Normalizado@ANOT.app ',
            'password' => 'SenhaForte1234!',
        ]);

        $loginRes->assertStatus(200)
                 ->assertJsonStructure(['token', 'user']);
    }

    public function test_protected_route_requires_authentication()
    {
        $response = $this->getJson('/api/classes');
        $response->assertStatus(401);
    }

    public function test_login_rate_limiting_triggers_after_5_failed_attempts()
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', [
                'email' => 'hacker@anot.app',
                'password' => 'errada123456789',
            ]);
        }

        // A 6ª tentativa deve ser bloqueada com 429
        $response6 = $this->postJson('/api/login', [
            'email' => 'hacker@anot.app',
            'password' => 'errada123456789',
        ]);

        $response6->assertStatus(429);
    }
}
