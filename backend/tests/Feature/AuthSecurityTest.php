<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password as PasswordBroker;
use Illuminate\Support\Facades\URL;
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

    public function test_user_can_delete_account_only_with_current_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('senhaSegura123'),
        ]);
        $token = $user->createToken('account-deletion')->plainTextToken;

        $this->withToken($token)
            ->deleteJson('/api/account', ['password' => 'senhaErrada999'])
            ->assertStatus(422);

        $this->assertDatabaseHas('users', ['id' => $user->id]);

        $response = $this->withToken($token)
            ->deleteJson('/api/account', ['password' => 'senhaSegura123']);

        $response->assertOk()
            ->assertJsonPath('message', 'Conta excluída com sucesso.');
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $user->id]);

        Auth::forgetGuards();
        $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
    }

    public function test_user_can_change_password_and_revoke_all_sessions(): void
    {
        $user = User::factory()->create([
            'email' => 'password-change@anot.test',
            'password' => Hash::make('SenhaAntiga123'),
        ]);
        $token = $user->createToken('current-device')->plainTextToken;
        $otherToken = $user->createToken('other-device')->plainTextToken;

        $this->withToken($token)
            ->putJson('/api/account/password', [
                'current_password' => 'SenhaAntiga123',
                'password' => 'SenhaNova123',
                'password_confirmation' => 'SenhaNova123',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Senha alterada. Faça login novamente em todos os dispositivos.');

        $this->assertDatabaseCount('personal_access_tokens', 0);
        Auth::forgetGuards();
        $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
        $this->withToken($otherToken)->getJson('/api/me')->assertUnauthorized();
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'SenhaNova123'])->assertOk();
    }

    public function test_forgot_password_has_generic_response_and_sends_notification_for_known_email(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'recovery@anot.test']);

        $response = $this->postJson('/api/forgot-password', ['email' => 'RECOVERY@ANOT.TEST']);

        $response->assertOk()->assertJsonPath(
            'message',
            'Se o e-mail estiver cadastrado, enviaremos instruções para redefinir a senha.',
        );
        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user): bool {
            return str_starts_with($notification->toMail($user)->actionUrl, 'anot://reset-password');
        });

        $unknown = $this->postJson('/api/forgot-password', ['email' => 'missing@anot.test']);
        $this->assertSame($response->json('message'), $unknown->json('message'));
    }

    public function test_reset_password_changes_password_and_revokes_old_tokens(): void
    {
        $user = User::factory()->create([
            'email' => 'reset@anot.test',
            'password' => Hash::make('SenhaAntiga123'),
        ]);
        $oldToken = $user->createToken('old-device')->plainTextToken;
        $resetToken = PasswordBroker::createToken($user);

        $this->postJson('/api/reset-password', [
            'token' => $resetToken,
            'email' => 'RESET@ANOT.TEST',
            'password' => 'SenhaNova123',
            'password_confirmation' => 'SenhaNova123',
        ])->assertOk()->assertJsonPath('message', 'Senha redefinida com sucesso. Faça login novamente.');

        Auth::forgetGuards();
        $this->withToken($oldToken)->getJson('/api/me')->assertUnauthorized();
        $this->postJson('/api/login', [
            'email' => 'reset@anot.test',
            'password' => 'SenhaAntiga123',
        ])->assertUnauthorized();
        $this->postJson('/api/login', [
            'email' => 'reset@anot.test',
            'password' => 'SenhaNova123',
        ])->assertOk();
    }

    public function test_registration_sends_email_verification_notification(): void
    {
        Notification::fake();

        $this->postJson('/api/register', [
            'name' => 'Usuário Verificável',
            'email' => 'verify@anot.test',
            'password' => 'SenhaSegura123',
            'password_confirmation' => 'SenhaSegura123',
        ])->assertCreated();

        $user = User::where('email', 'verify@anot.test')->firstOrFail();
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_signed_email_verification_marks_account_as_verified(): void
    {
        $user = User::factory()->create(['email' => 'verify-link@anot.test', 'email_verified_at' => null]);
        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(30),
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())],
        );

        $this->get($url)->assertOk()->assertSee('E-mail verificado');
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_tampered_email_verification_link_is_rejected(): void
    {
        $user = User::factory()->create(['email' => 'verify-safe@anot.test', 'email_verified_at' => null]);
        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(30),
            ['id' => $user->id, 'hash' => sha1('attacker@anot.test')],
        );

        $this->get($url)->assertForbidden();
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_authenticated_user_can_resend_email_verification(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'resend@anot.test', 'email_verified_at' => null]);
        $token = $user->createToken('verification')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/email/verification-notification')
            ->assertStatus(202);

        Notification::assertSentTo($user, VerifyEmail::class);
    }
}
