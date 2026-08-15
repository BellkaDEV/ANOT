<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

use App\Models\User;
use App\Models\SchoolClass;
use App\Models\ClassMember;

class AuthAndClassTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_login()
    {
        $registerRes = $this->postJson('/api/register', [
            'name' => 'Carlos Criador',
            'email' => 'carlos@anot.com',
            'password' => 'senha123',
            'password_confirmation' => 'senha123',
        ]);

        $registerRes->assertStatus(201)
            ->assertJsonStructure(['message', 'user', 'token']);

        $loginRes = $this->postJson('/api/login', [
            'email' => 'carlos@anot.com',
            'password' => 'senha123',
        ]);

        $loginRes->assertStatus(200)
            ->assertJsonStructure(['message', 'user', 'token']);
    }

    public function test_owner_can_create_class_with_unique_code()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/classes', [
            'name' => 'Engenharia de Software 2026',
            'course' => 'Ciência da Computação',
            'institution' => 'Escola Técnica',
            'period' => '5º Semestre',
            'modality' => 'presencial',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('class.name', 'Engenharia de Software 2026')
            ->assertJsonPath('class.my_role', 'owner');

        $code = $response->json('class.code');
        $this->assertEquals(6, strlen($code));

        $this->assertDatabaseHas('class_members', [
            'user_id' => $user->id,
            'role' => 'owner',
        ]);
    }

    public function test_student_can_join_class_via_code()
    {
        $creator = User::factory()->create();
        $student = User::factory()->create();

        $schoolClass = SchoolClass::create([
            'code' => 'ANOT-TEST1',
            'name' => 'Turma Teste',
            'owner_id' => $creator->id,
        ]);
        ClassMember::create(['class_id' => $schoolClass->id, 'user_id' => $creator->id, 'role' => 'owner']);

        $joinRes = $this->actingAs($student, 'sanctum')->postJson('/api/classes/join', [
            'code' => 'ANOT-TEST1',
        ]);

        $joinRes->assertStatus(201)
            ->assertJsonPath('role', 'student');

        $this->assertDatabaseHas('class_members', [
            'class_id' => $schoolClass->id,
            'user_id' => $student->id,
            'role' => 'student',
        ]);
    }

    public function test_creator_cannot_be_kicked_or_demoted()
    {
        $creator = User::factory()->create();
        $rep = User::factory()->create();

        $schoolClass = SchoolClass::create([
            'code' => 'ANOT-LOCK',
            'name' => 'Turma com Trava',
            'owner_id' => $creator->id,
        ]);
        ClassMember::create(['class_id' => $schoolClass->id, 'user_id' => $creator->id, 'role' => 'owner']);
        ClassMember::create(['class_id' => $schoolClass->id, 'user_id' => $rep->id, 'role' => 'rep']);

        // Tentativa de expulsar o Criador por um Representante -> Bloqueado (403)
        $kickRes = $this->actingAs($rep, 'sanctum')->deleteJson("/api/classes/{$schoolClass->id}/members/{$creator->id}");
        $kickRes->assertStatus(403);

        // Tentativa do Representante rebaixar o Criador -> Bloqueado (403)
        $demoteRes = $this->actingAs($rep, 'sanctum')->putJson("/api/classes/{$schoolClass->id}/members/{$creator->id}/demote");
        $demoteRes->assertStatus(403);
    }
}
