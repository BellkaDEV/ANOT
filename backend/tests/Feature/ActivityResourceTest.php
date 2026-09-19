<?php

namespace Tests\Feature;

use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivityResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_activity_contract_exposes_progress_without_internal_user_fields(): void
    {
        $owner = User::factory()->create(['email' => 'activity-owner@anot.test']);
        $schoolClass = SchoolClass::create([
            'code' => 'ACT123',
            'name' => 'Turma de Atividade',
            'course' => 'Engenharia',
            'institution' => 'ANOT',
            'period' => '2026.2',
            'modality' => 'presencial',
            'is_open' => true,
            'owner_id' => $owner->id,
        ]);
        $schoolClass->members()->create(['user_id' => $owner->id, 'role' => 'owner', 'joined_at' => now()]);
        $token = $owner->createToken('activity-resource-test')->plainTextToken;

        $this->withToken($token)
            ->postJson("/api/classes/{$schoolClass->id}/activities", [
                'title' => 'Atividade explícita',
                'type' => 'dever',
                'subject' => 'Arquitetura',
                'due_date' => '2026-10-12',
                'description' => 'Entrega',
            ])
            ->assertCreated()
            ->assertJsonStructure([
                'activity' => [
                    'id', 'class_id', 'title', 'type', 'due_date', 'created_by',
                    'user_progress', 'groups',
                ],
            ])
            ->assertJsonPath('activity.title', 'Atividade explícita')
            ->assertJsonPath('activity.user_progress', null)
            ->assertJsonMissingPath('activity.password');
    }
}
