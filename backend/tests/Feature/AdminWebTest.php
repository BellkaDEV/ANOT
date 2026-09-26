<?php

namespace Tests\Feature;

use App\Models\AdminAuditLog;
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

        $response = $this->get('/admin');
        $response->assertOk()->assertSee('Turma Web');
        $response->assertSeeInOrder([
            'Usuários totais', '1',
            'Usuários ativos', '1',
            'Usuários suspensos', '0',
            'Turmas totais', '1',
            'Logs de auditoria', '0',
        ]);
        $response->assertSee('name="status"', false)
            ->assertSee('value="ativos"', false)
            ->assertSee('value="suspensos"', false)
            ->assertSee('name="action"', false)
            ->assertSee('user.suspended');

        $metrics = $response->viewData('metrics');
        $this->assertEquals(1, $metrics['total_users']);
        $this->assertEquals(1, $metrics['active_users']);
        $this->assertEquals(0, $metrics['suspended_users']);
        $this->assertEquals(1, $metrics['total_classes']);
        $this->assertEquals(0, $metrics['total_audit_logs']);
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

    public function test_dashboard_filters_users_by_status_whitelist(): void
    {
        $admin = User::factory()->create(['is_platform_admin' => true]);
        $activeUser = User::factory()->create(['name' => 'Ativo User', 'is_suspended' => false]);
        $suspendedUser = User::factory()->create(['name' => 'Suspenso User', 'is_suspended' => true]);

        // Filter: ativos
        $resAtivos = $this->actingAs($admin)->get('/admin?status=ativos');
        $resAtivos->assertOk();
        $usersAtivos = $resAtivos->viewData('users');
        $this->assertTrue($usersAtivos->contains('id', $activeUser->id));
        $this->assertFalse($usersAtivos->contains('id', $suspendedUser->id));

        // Filter: suspensos
        $resSuspensos = $this->actingAs($admin)->get('/admin?status=suspensos');
        $resSuspensos->assertOk();
        $usersSuspensos = $resSuspensos->viewData('users');
        $this->assertFalse($usersSuspensos->contains('id', $activeUser->id));
        $this->assertTrue($usersSuspensos->contains('id', $suspendedUser->id));

        // Filter: todos or invalid fallback
        $resInvalid = $this->actingAs($admin)->get('/admin?status=invalid_status_injection');
        $resInvalid->assertOk();
        $this->assertEquals('todos', $resInvalid->viewData('userStatusFilter'));
        $usersInvalid = $resInvalid->viewData('users');
        $this->assertTrue($usersInvalid->contains('id', $activeUser->id));
        $this->assertTrue($usersInvalid->contains('id', $suspendedUser->id));
    }

    public function test_dashboard_filters_audit_logs_and_paginates(): void
    {
        $admin = User::factory()->create(['is_platform_admin' => true]);
        $target1 = User::factory()->create();
        $target2 = User::factory()->create();

        AdminAuditLog::create([
            'actor_user_id' => $admin->id,
            'target_user_id' => $target1->id,
            'action' => 'user.suspended',
        ]);
        AdminAuditLog::create([
            'actor_user_id' => $admin->id,
            'target_user_id' => $target2->id,
            'action' => 'user.unsuspended',
        ]);

        // Filter action: user.suspended
        $res = $this->actingAs($admin)->get('/admin?action=user.suspended&search=test');
        $res->assertOk();
        $auditLogs = $res->viewData('auditLogs');
        $this->assertEquals(1, $auditLogs->total());
        $this->assertEquals('user.suspended', $auditLogs->first()->action);

        // Verify query string is preserved in pagination
        $this->assertStringContainsString('action=user.suspended', $auditLogs->url(1));
        $this->assertStringContainsString('search=test', $auditLogs->url(1));

        // Test invalid action fallback
        $resInvalidAction = $this->actingAs($admin)->get('/admin?action=invalid_action_drop');
        $resInvalidAction->assertOk();
        $this->assertEquals('', $resInvalidAction->viewData('actionFilter'));
        $this->assertEquals(2, $resInvalidAction->viewData('auditLogs')->total());
    }
}
