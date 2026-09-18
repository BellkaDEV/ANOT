<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PromotePlatformAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_promotes_existing_account_without_exposing_passwords(): void
    {
        $user = User::factory()->create(['email' => 'owner@anot.test']);

        $this->artisan('admin:promote', ['email' => 'OWNER@ANOT.TEST', '--yes' => true])
            ->expectsOutput('owner@anot.test agora é administrador global.')
            ->assertSuccessful();

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'is_platform_admin' => true,
            'is_suspended' => false,
        ]);
    }

    public function test_command_fails_for_unknown_account(): void
    {
        $this->artisan('admin:promote', ['email' => 'missing@anot.test', '--yes' => true])
            ->expectsOutput('Nenhuma conta encontrada com esse e-mail.')
            ->assertFailed();
    }
}
