<?php

namespace Tests\Feature;

use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminWebTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login_and_view_dashboard(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin@anot.test',
            'password' => Hash::make('senhaSegura123'),
            'is_platform_admin' => true,
        ]);
        SchoolClass::create([
            'code' => 'WEB001', 'name' => 'Turma Web', 'course' => 'Computação',
            'institution' => 'Universidade ANOT', 'period' => '2026.2',
            'modality' => 'Presencial', 'is_open' => true, 'owner_id' => $admin->id,
        ]);

        $this->post('/admin/login', [
            'email' => 'admin@anot.test',
            'password' => 'senhaSegura123',
        ])->assertRedirect('/admin');

        $this->get('/admin')->assertOk()->assertSee('Turma Web');
    }

    public function test_regular_user_cannot_login_to_web_console(): void
    {
        User::factory()->create([
            'email' => 'user@anot.test',
            'password' => Hash::make('senhaSegura123'),
        ]);

        $this->post('/admin/login', [
            'email' => 'user@anot.test',
            'password' => 'senhaSegura123',
        ])->assertSessionHasErrors('email');
    }

    public function test_admin_can_suspend_user_from_web_console_and_create_audit(): void
    {
        $admin = User::factory()->create(['is_platform_admin' => true]);
        $user = User::factory()->create();

        $this->actingAs($admin)
            ->post(route('admin.users.suspend', $user))
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'is_suspended' => true,
        ]);
        $this->assertDatabaseHas('admin_audit_logs', [
            'actor_user_id' => $admin->id,
            'target_user_id' => $user->id,
            'action' => 'user.suspended',
        ]);
    }
}
