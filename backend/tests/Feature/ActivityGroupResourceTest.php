<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\ActivityGroup;
use App\Models\ActivityGroupInvitation;
use App\Models\ActivityGroupMember;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivityGroupResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_group_endpoint_returns_explicit_nested_resources(): void
    {
        $owner = User::factory()->create();
        $student = User::factory()->create();
        $schoolClass = SchoolClass::create([
            'name' => 'Turma',
            'code' => 'GRP-2026',
            'owner_id' => $owner->id,
        ]);
        $activity = Activity::create([
            'class_id' => $schoolClass->id,
            'title' => 'Trabalho',
            'type' => 'trabalho',
            'work_mode' => 'groups',
            'group_size' => 3,
            'due_date' => now()->addWeek()->toDateString(),
            'created_by' => $owner->id,
        ]);
        $group = ActivityGroup::create(['activity_id' => $activity->id, 'name' => 'Grupo 1', 'capacity' => 3]);
        $member = ActivityGroupMember::create(['activity_group_id' => $group->id, 'user_id' => $student->id, 'joined_at' => now()]);
        $invitation = ActivityGroupInvitation::create([
            'activity_group_id' => $group->id,
            'invited_user_id' => $student->id,
            'invited_by_user_id' => $owner->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($owner)->getJson("/api/activities/{$activity->id}/groups");

        $response->assertOk()
            ->assertJsonStructure([
                'groups' => [[
                    'id', 'activity_id', 'name', 'capacity', 'leader_user_id', 'leader',
                    'description', 'members' => [['id', 'activity_group_id', 'user_id', 'user', 'joined_at']],
                    'invitations' => [['id', 'activity_group_id', 'invited_user_id', 'invited_by_user_id', 'status']],
                ]],
            ])
            ->assertJsonPath('groups.0.members.0.id', $member->id)
            ->assertJsonPath('groups.0.invitations.0.id', $invitation->id);

        $this->assertArrayNotHasKey('password', $response->json('groups.0.members.0.user'));
    }
}
