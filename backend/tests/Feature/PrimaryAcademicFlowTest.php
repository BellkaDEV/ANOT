<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PrimaryAcademicFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_and_student_can_complete_the_primary_academic_flow(): void
    {
        $ownerRegistration = $this->postJson('/api/register', [
            'name' => 'Owner ANOT',
            'email' => 'owner-flow@anot.test',
            'password' => 'SenhaSegura1234',
            'password_confirmation' => 'SenhaSegura1234',
        ]);

        $ownerRegistration->assertCreated()->assertJsonStructure(['token', 'user' => ['id']]);
        $owner = User::findOrFail($ownerRegistration->json('user.id'));

        $classResponse = $this->actingAs($owner, 'sanctum')->postJson('/api/classes', [
            'name' => 'Turma de fluxo principal',
            'course' => 'Engenharia de Software',
            'institution' => 'ANOT',
            'period' => '2026.2',
            'modality' => 'presencial',
        ]);

        $classResponse->assertCreated()->assertJsonPath('class.my_role', 'owner');
        $class = $classResponse->json('class');

        $studentRegistration = $this->flushHeaders()->postJson('/api/register', [
            'name' => 'Student ANOT',
            'email' => 'student-flow@anot.test',
            'password' => 'SenhaSegura1234',
            'password_confirmation' => 'SenhaSegura1234',
        ]);

        $studentRegistration->assertCreated()->assertJsonStructure(['token', 'user' => ['id']]);
        $student = User::findOrFail($studentRegistration->json('user.id'));

        $this->actingAs($student, 'sanctum')->postJson('/api/classes/join', [
            'code' => $class['code'],
        ])->assertCreated();

        $this->assertDatabaseHas('class_members', [
            'class_id' => $class['id'],
            'user_id' => $student->id,
            'role' => 'student',
        ]);

        $activityResponse = $this->actingAs($owner, 'sanctum')->postJson("/api/classes/{$class['id']}/activities", [
            'title' => 'Atividade do fluxo',
            'type' => 'trabalho',
            'subject' => 'Qualidade de Software',
            'due_date' => now()->addWeek()->toDateString(),
            'due_time' => '18:00',
        ]);

        $activityResponse->assertCreated()->assertJsonPath('activity.title', 'Atividade do fluxo');
        $activityId = $activityResponse->json('activity.id');

        $this->actingAs($student, 'sanctum')->putJson("/api/activities/{$activityId}/progress", [
            'status' => 'in_progress',
            'personal_notes' => 'Fluxo principal validado.',
        ])->assertOk()->assertJsonPath('progress.status', 'in_progress');
    }
}
