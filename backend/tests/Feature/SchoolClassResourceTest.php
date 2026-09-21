<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\SchoolClass;
use App\Models\User;
use App\Models\UserActivityProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchoolClassResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_class_contract_exposes_members_without_private_user_fields(): void
    {
        $owner = User::factory()->create(['email' => 'owner@anot.test']);
        $student = User::factory()->create(['email' => 'student@anot.test']);
        $schoolClass = SchoolClass::create([
            'code' => 'ABC123',
            'name' => 'Turma Resource',
            'course' => 'Engenharia',
            'institution' => 'ANOT',
            'period' => '2026.2',
            'modality' => 'presencial',
            'is_open' => true,
            'owner_id' => $owner->id,
        ]);
        $schoolClass->members()->create(['user_id' => $owner->id, 'role' => 'owner', 'joined_at' => now()]);
        $schoolClass->members()->create(['user_id' => $student->id, 'role' => 'student', 'joined_at' => now()]);
        $activity = Activity::create([
            'class_id' => $schoolClass->id,
            'title' => 'Atividade persistida',
            'type' => 'dever',
            'subject' => 'Engenharia',
            'due_date' => '2026-10-10',
            'created_by' => $owner->id,
        ]);
        UserActivityProgress::create([
            'activity_id' => $activity->id,
            'user_id' => $student->id,
            'status' => 'in_progress',
            'personal_notes' => 'Revisar material.',
        ]);

        $token = $student->createToken('class-resource-test')->plainTextToken;

        $this->withToken($token)
            ->getJson("/api/classes/{$schoolClass->id}")
            ->assertOk()
            ->assertJsonStructure([
                'class' => [
                    'id', 'code', 'name', 'is_open', 'owner_id',
                    'owner' => ['id', 'name', 'email'],
                    'members' => [['id', 'user_id', 'role', 'user']],
                ],
            ])
            ->assertJsonPath('class.my_role', 'student')
            ->assertJsonPath('class.activities.0.user_progress.status', 'in_progress')
            ->assertJsonPath('class.activities.0.user_progress.personal_notes', 'Revisar material.')
            ->assertJsonMissingPath('class.owner.password')
            ->assertJsonMissingPath('class.members.0.user.is_platform_admin')
            ->assertJsonMissingPath('class.members.0.user.is_suspended');
    }
}
