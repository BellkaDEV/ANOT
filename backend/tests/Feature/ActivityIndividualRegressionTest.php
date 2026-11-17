<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivityIndividualRegressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_activity_payload_does_not_expose_groups_or_work_mode(): void
    {
        $owner = User::factory()->create();
        $schoolClass = SchoolClass::create([
            'name' => 'Turma Teste',
            'code' => 'TEST-001',
            'owner_id' => $owner->id,
        ]);

        $activity = Activity::create([
            'class_id' => $schoolClass->id,
            'title' => 'Atividade Individual',
            'type' => 'trabalho',
            'due_date' => now()->addWeek()->toDateString(),
            'created_by' => $owner->id,
        ]);

        $response = $this->actingAs($owner)->getJson("/api/activities/{$activity->id}");

        $response->assertOk()
            ->assertJsonStructure([
                'activity' => [
                    'id', 'class_id', 'title', 'type', 'assessment_format', 'points_value',
                    'subject', 'due_date', 'due_time', 'description', 'created_by',
                    'created_at', 'updated_at',
                ],
            ])
            ->assertJsonMissingPath('activity.work_mode')
            ->assertJsonMissingPath('activity.group_size')
            ->assertJsonMissingPath('activity.groups');

        $this->assertArrayNotHasKey('work_mode', $response->json('activity'));
        $this->assertArrayNotHasKey('group_size', $response->json('activity'));
        $this->assertArrayNotHasKey('groups', $response->json('activity'));
    }

    public function test_activity_group_routes_are_not_exposed(): void
    {
        $owner = User::factory()->create();

        $response = $this->actingAs($owner)->getJson('/api/activities/1/groups');
        $response->assertStatus(404);

        $response = $this->actingAs($owner)->postJson('/api/activity-groups/1/join');
        $response->assertStatus(404);
    }
}
