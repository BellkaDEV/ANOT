<?php

namespace Tests\Feature;

use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PlatformAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_regular_user_cannot_access_platform_admin_routes(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('user')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/admin/users')
            ->assertForbidden();
    }

    public function test_platform_admin_can_list_users_and_classes(): void
    {
        $admin = User::factory()->create(['is_platform_admin' => true]);
        $token = $admin->createToken('admin')->plainTextToken;
        $user = User::factory()->create(['name' => 'Aluno Operacional']);
        SchoolClass::create([
            'code' => 'ADM001',
            'name' => 'Turma Administrativa',
            'course' => 'Engenharia',
            'institution' => 'Universidade ANOT',
            'period' => '2026.2',
            'modality' => 'Presencial',
            'is_open' => true,
            'owner_id' => $admin->id,
        ]);

        $this->withToken($token)
            ->getJson('/api/admin/users?search=Operacional')
            ->assertOk()
            ->assertJsonPath('data.data.0.name', 'Aluno Operacional');

        $this->withToken($token)
            ->getJson('/api/admin/classes')
            ->assertOk()
            ->assertJsonCount(1, 'data.data');
    }

    public function test_admin_can_suspend_and_reactivate_user_with_audit_log(): void
    {
        $admin = User::factory()->create(['is_platform_admin' => true]);
        $token = $admin->createToken('admin')->plainTextToken;
        $user = User::factory()->create([
            'password' => Hash::make('senhaSegura123'),
        ]);
        $userToken = $user->createToken('user')->plainTextToken;

        $this->withToken($token)
            ->postJson("/api/admin/users/{$user->id}/suspend")
            ->assertOk();

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'is_suspended' => true,
        ]);
        $this->assertDatabaseHas('admin_audit_logs', [
            'action' => 'user.suspended',
            'target_user_id' => $user->id,
        ]);

        Auth::forgetGuards();
        $this->withToken($userToken)->getJson('/api/me')->assertUnauthorized();
        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'senhaSegura123',
        ])->assertForbidden();

        $this->withToken($token)
            ->postJson("/api/admin/users/{$user->id}/unsuspend")
            ->assertOk();

        $this->assertDatabaseHas('admin_audit_logs', [
            'action' => 'user.unsuspended',
            'target_user_id' => $user->id,
        ]);
    }

    public function test_suspended_platform_admin_loses_api_and_web_console_access(): void
    {
        $admin = User::factory()->create([
            'is_platform_admin' => true,
            'is_suspended' => true,
        ]);
        $token = $admin->createToken('admin')->plainTextToken;

        $this->withToken($token)->getJson('/api/admin/users')->assertForbidden();
        $this->actingAs($admin)->get('/admin')->assertForbidden();
    }

    public function test_admin_cannot_suspend_another_platform_admin(): void
    {
        $admin = User::factory()->create(['is_platform_admin' => true]);
        $target = User::factory()->create(['is_platform_admin' => true]);
        $token = $admin->createToken('admin')->plainTextToken;

        $this->withToken($token)
            ->postJson("/api/admin/users/{$target->id}/suspend")
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Administradores da plataforma não podem ser suspensos.');

        $this->assertDatabaseHas('users', ['id' => $target->id, 'is_suspended' => false]);
        $this->assertDatabaseMissing('admin_audit_logs', ['target_user_id' => $target->id]);
    }
}
