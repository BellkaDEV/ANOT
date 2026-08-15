<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\SchoolClass;
use App\Models\ClassMember;

class ClassEnrollmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_newly_registered_user_has_zero_classes()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Novo Aluno Teste',
            'email' => 'novoaluno@teste.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure(['token', 'user']);

        $token = $response->json('token');

        $classesResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
                                ->getJson('/api/classes');

        $classesResponse->assertStatus(200)
                        ->assertJsonCount(0, 'classes');
    }

    public function test_class_creator_is_enrolled_as_owner()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
                         ->postJson('/api/classes', [
                             'name' => 'Engenharia de Software 2026',
                             'course' => 'Ciência da Computação',
                             'institution' => 'Universidade Federal',
                             'period' => '2026.1',
                             'modality' => 'presencial',
                         ]);

        $response->assertStatus(201)
                 ->assertJsonPath('class.my_role', 'owner');

        $classId = $response->json('class.id');

        $this->assertDatabaseHas('class_members', [
            'class_id' => $classId,
            'user_id' => $user->id,
            'role' => 'owner',
        ]);
    }

    public function test_student_joining_class_via_code_is_visible_bidirectionally()
    {
        // 1. Representante cria a turma
        $repUser = User::factory()->create(['name' => 'Representante Lucas']);

        $createResponse = $this->actingAs($repUser, 'sanctum')
                               ->postJson('/api/classes', [
                                   'name' => 'Cálculo II - Turma B',
                                   'course' => 'Engenharia',
                                   'institution' => 'UFBR',
                                   'period' => '2026.1',
                                   'modality' => 'presencial',
                               ]);

        $createResponse->assertStatus(201);
        $classCode = $createResponse->json('class.code');
        $classId = $createResponse->json('class.id');

        // 2. Novo aluno se registra e entra na turma usando o código
        $studentUser = User::factory()->create(['name' => 'Aluno Matheus']);

        $joinResponse = $this->actingAs($studentUser, 'sanctum')
                             ->postJson('/api/classes/join', [
                                 'code' => $classCode,
                             ]);

        $joinResponse->assertStatus(201)
                     ->assertJsonPath('class.my_role', 'student');

        // Verifica banco de dados
        $this->assertDatabaseHas('class_members', [
            'class_id' => $classId,
            'user_id' => $studentUser->id,
            'role' => 'student',
        ]);

        // 3. Visão do Aluno: ao buscar a lista de turmas, a nova turma deve aparecer contendo 2 membros
        $studentClasses = $this->actingAs($studentUser, 'sanctum')
                               ->getJson('/api/classes');

        $studentClasses->assertStatus(200)
                       ->assertJsonCount(1, 'classes')
                       ->assertJsonCount(2, 'classes.0.members');

        // 4. Visão do Representante: ao buscar a lista de turmas, o novo aluno deve aparecer na lista de membros da turma
        $repClasses = $this->actingAs($repUser, 'sanctum')
                           ->getJson('/api/classes');

        $repClasses->assertStatus(200)
                   ->assertJsonCount(1, 'classes')
                   ->assertJsonCount(2, 'classes.0.members');

        $members = $repClasses->json('classes.0.members');
        $memberUserIds = collect($members)->pluck('user_id')->all();

        $this->assertContains((string)$studentUser->id, array_map('strval', $memberUserIds));
    }

    public function test_student_joining_class_via_full_pasted_link_succeeds()
    {
        $repUser = User::factory()->create();
        $createResponse = $this->actingAs($repUser, 'sanctum')
                               ->postJson('/api/classes', [
                                   'name' => 'Física II',
                               ]);

        $classCode = $createResponse->json('class.code');

        $studentUser = User::factory()->create();

        // Colando o link completo com protocolo anot://join?code=XXXXXX
        $joinResponse = $this->actingAs($studentUser, 'sanctum')
                             ->postJson('/api/classes/join', [
                                 'code' => 'anot://join?code=' . $classCode,
                             ]);

        $joinResponse->assertStatus(201);
    }

    public function test_closed_class_prevents_new_student_enrollment()
    {
        $repUser = User::factory()->create();
        $createResponse = $this->actingAs($repUser, 'sanctum')
                               ->postJson('/api/classes', [
                                   'name' => 'Álgebra Linear - Turma Fechada',
                               ]);

        $classId = $createResponse->json('class.id');
        $classCode = $createResponse->json('class.code');

        // Representante fecha a turma para novos membros
        $toggleResponse = $this->actingAs($repUser, 'sanctum')
                               ->putJson("/api/classes/{$classId}/toggle-open");

        $toggleResponse->assertStatus(200)
                       ->assertJsonPath('is_open', false);

        // Novo aluno tenta entrar na turma fechada
        $studentUser = User::factory()->create();
        $joinResponse = $this->actingAs($studentUser, 'sanctum')
                             ->postJson('/api/classes/join', [
                                 'code' => $classCode,
                             ]);

        $joinResponse->assertStatus(403)
                     ->assertJsonPath('message', 'Esta turma está fechada para novos membros no momento.');
    }

    public function test_representative_can_regenerate_class_code()
    {
        $repUser = User::factory()->create();
        $createResponse = $this->actingAs($repUser, 'sanctum')
                               ->postJson('/api/classes', [
                                   'name' => 'Cálculo Numérico',
                               ]);

        $classId = $createResponse->json('class.id');
        $oldCode = $createResponse->json('class.code');

        $regenResponse = $this->actingAs($repUser, 'sanctum')
                              ->putJson("/api/classes/{$classId}/regenerate-code");

        $regenResponse->assertStatus(200)
                      ->assertJsonStructure(['message', 'code']);

        $newCode = $regenResponse->json('code');

        $this->assertNotEquals($oldCode, $newCode);
        $this->assertEquals(6, strlen($newCode));
        $this->assertDatabaseHas('school_classes', [
            'id' => $classId,
            'code' => $newCode,
        ]);
    }
}
