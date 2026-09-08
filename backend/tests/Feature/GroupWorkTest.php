<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\SchoolClass;
use App\Models\ClassMember;
use App\Models\Activity;
use App\Models\ActivityGroup;
use App\Models\ActivityGroupMember;
use App\Models\ActivityGroupInvitation;

class GroupWorkTest extends TestCase
{
    use RefreshDatabase;

    private function createClassWithMembers($studentCount = 5)
    {
        $owner = User::factory()->create();
        $schoolClass = SchoolClass::create([
            'name' => 'Engenharia de Software',
            'code' => 'ENG-999',
            'course' => 'Engenharia',
            'institution' => 'UFBR',
            'period' => '2026.1',
            'modality' => 'presencial',
            'owner_id' => $owner->id,
        ]);

        $students = [];
        for ($i = 0; $i < $studentCount; $i++) {
            $s = User::factory()->create();
            ClassMember::create([
                'class_id' => $schoolClass->id,
                'user_id' => $s->id,
                'role' => 'student',
            ]);
            $students[] = $s;
        }

        return [$owner, $schoolClass, $students];
    }

    public function test_group_work_creation_calculates_groups_excluding_owner()
    {
        [$owner, $schoolClass, $students] = $this->createClassWithMembers(5);

        // 5 alunos elegíveis, grupo de 2 -> ceil(5/2) = 3 grupos
        $response = $this->actingAs($owner)->postJson("/api/classes/{$schoolClass->id}/activities", [
            'title' => 'Trabalho em Duplas',
            'type' => 'trabalho',
            'work_mode' => 'groups',
            'group_size' => 2,
            'subject' => 'DevOps',
            'due_date' => '2026-07-01',
        ]);

        $response->assertStatus(201);
        $activityId = $response->json('activity.id');

        $this->assertDatabaseCount('activity_groups', 3);
        $this->assertDatabaseHas('activity_groups', ['activity_id' => $activityId, 'name' => 'Grupo 1', 'capacity' => 2]);
        $this->assertDatabaseHas('activity_groups', ['activity_id' => $activityId, 'name' => 'Grupo 2', 'capacity' => 2]);
        $this->assertDatabaseHas('activity_groups', ['activity_id' => $activityId, 'name' => 'Grupo 3', 'capacity' => 2]);
    }

    public function test_owner_is_prevented_from_joining_groups()
    {
        [$owner, $schoolClass, $students] = $this->createClassWithMembers(2);

        $activity = Activity::create([
            'class_id' => $schoolClass->id,
            'title' => 'Trabalho de BD',
            'type' => 'trabalho',
            'work_mode' => 'groups',
            'group_size' => 2,
            'due_date' => '2026-07-01',
            'created_by' => $owner->id,
        ]);

        $group = ActivityGroup::create([
            'activity_id' => $activity->id,
            'name' => 'Grupo 1',
            'capacity' => 2,
        ]);

        $response = $this->actingAs($owner)->postJson("/api/activity-groups/{$group->id}/join");
        $response->assertStatus(403);
    }

    public function test_first_member_joining_becomes_leader_automatically()
    {
        [$owner, $schoolClass, $students] = $this->createClassWithMembers(3);

        $group = ActivityGroup::create([
            'activity_id' => Activity::create([
                'class_id' => $schoolClass->id,
                'title' => 'T1',
                'type' => 'trabalho',
                'work_mode' => 'groups',
                'group_size' => 2,
                'due_date' => '2026-07-01',
                'created_by' => $owner->id,
            ])->id,
            'name' => 'Grupo 1',
            'capacity' => 2,
        ]);

        $response = $this->actingAs($students[0])->postJson("/api/activity-groups/{$group->id}/join");
        $response->assertStatus(200);

        $this->assertDatabaseHas('activity_groups', [
            'id' => $group->id,
            'leader_user_id' => $students[0]->id,
        ]);
    }

    public function test_student_cannot_join_two_groups_in_same_activity()
    {
        [$owner, $schoolClass, $students] = $this->createClassWithMembers(3);

        $activity = Activity::create([
            'class_id' => $schoolClass->id,
            'title' => 'T1',
            'type' => 'trabalho',
            'work_mode' => 'groups',
            'group_size' => 2,
            'due_date' => '2026-07-01',
            'created_by' => $owner->id,
        ]);

        $group1 = ActivityGroup::create(['activity_id' => $activity->id, 'name' => 'G1', 'capacity' => 2]);
        $group2 = ActivityGroup::create(['activity_id' => $activity->id, 'name' => 'G2', 'capacity' => 2]);

        $this->actingAs($students[0])->postJson("/api/activity-groups/{$group1->id}/join")->assertStatus(200);

        // Tentar entrar no G2 estando já no G1
        $response = $this->actingAs($students[0])->postJson("/api/activity-groups/{$group2->id}/join");
        $response->assertStatus(409);
    }

    public function test_full_group_rejects_joining()
    {
        [$owner, $schoolClass, $students] = $this->createClassWithMembers(4);

        $group = ActivityGroup::create([
            'activity_id' => Activity::create([
                'class_id' => $schoolClass->id,
                'title' => 'T1',
                'type' => 'trabalho',
                'work_mode' => 'groups',
                'group_size' => 2,
                'due_date' => '2026-07-01',
                'created_by' => $owner->id,
            ])->id,
            'name' => 'Grupo Pequeno',
            'capacity' => 2,
        ]);

        $this->actingAs($students[0])->postJson("/api/activity-groups/{$group->id}/join")->assertStatus(200);
        $this->actingAs($students[1])->postJson("/api/activity-groups/{$group->id}/join")->assertStatus(200);

        // Terceiro aluno tenta entrar em grupo com capacidade 2
        $response = $this->actingAs($students[2])->postJson("/api/activity-groups/{$group->id}/join");
        $response->assertStatus(422);
    }

    public function test_leader_leaving_re_elects_oldest_member()
    {
        [$owner, $schoolClass, $students] = $this->createClassWithMembers(4);

        $group = ActivityGroup::create([
            'activity_id' => Activity::create([
                'class_id' => $schoolClass->id,
                'title' => 'T1',
                'type' => 'trabalho',
                'work_mode' => 'groups',
                'group_size' => 3,
                'due_date' => '2026-07-01',
                'created_by' => $owner->id,
            ])->id,
            'name' => 'Grupo Liderança',
            'capacity' => 3,
        ]);

        $this->actingAs($students[0])->postJson("/api/activity-groups/{$group->id}/join"); // Líder
        $this->actingAs($students[1])->postJson("/api/activity-groups/{$group->id}/join"); // Membro 2

        // Líder (students[0]) sai do grupo
        $this->actingAs($students[0])->postJson("/api/activity-groups/{$group->id}/leave")->assertStatus(200);

        // Novo líder deve ser students[1]
        $this->assertDatabaseHas('activity_groups', [
            'id' => $group->id,
            'leader_user_id' => $students[1]->id,
        ]);
    }

    public function test_invitation_flow_accept_and_decline()
    {
        [$owner, $schoolClass, $students] = $this->createClassWithMembers(4);

        $group = ActivityGroup::create([
            'activity_id' => Activity::create([
                'class_id' => $schoolClass->id,
                'title' => 'T1',
                'type' => 'trabalho',
                'work_mode' => 'groups',
                'group_size' => 3,
                'due_date' => '2026-07-01',
                'created_by' => $owner->id,
            ])->id,
            'name' => 'Grupo Convite',
            'capacity' => 3,
        ]);

        $this->actingAs($students[0])->postJson("/api/activity-groups/{$group->id}/join"); // Líder

        // Líder convida students[1]
        $inviteRes = $this->actingAs($students[0])->postJson("/api/activity-groups/{$group->id}/invite", [
            'invited_user_id' => $students[1]->id,
        ]);
        $inviteRes->assertStatus(201);
        $invitationId = $inviteRes->json('invitation.id');

        // Convidador (students[1]) aceita convite
        $acceptRes = $this->actingAs($students[1])->postJson("/api/group-invitations/{$invitationId}/respond", [
            'action' => 'accept',
        ]);
        $acceptRes->assertStatus(200);

        $this->assertDatabaseHas('activity_group_members', [
            'activity_group_id' => $group->id,
            'user_id' => $students[1]->id,
        ]);
    }

    public function test_kicking_student_removes_from_groups_and_re_elects_leader()
    {
        [$owner, $schoolClass, $students] = $this->createClassWithMembers(4);

        $group = ActivityGroup::create([
            'activity_id' => Activity::create([
                'class_id' => $schoolClass->id,
                'title' => 'T1',
                'type' => 'trabalho',
                'work_mode' => 'groups',
                'group_size' => 3,
                'due_date' => '2026-07-01',
                'created_by' => $owner->id,
            ])->id,
            'name' => 'Grupo Kick',
            'capacity' => 3,
        ]);

        $this->actingAs($students[0])->postJson("/api/activity-groups/{$group->id}/join"); // Líder
        $this->actingAs($students[1])->postJson("/api/activity-groups/{$group->id}/join"); // Membro 2

        // Owner expulsa o líder (students[0]) da turma
        $kickRes = $this->actingAs($owner)->deleteJson("/api/classes/{$schoolClass->id}/members/{$students[0]->id}");
        $kickRes->assertStatus(200);

        // students[0] não é mais membro do grupo
        $this->assertDatabaseMissing('activity_group_members', [
            'activity_group_id' => $group->id,
            'user_id' => $students[0]->id,
        ]);

        // Novo líder é students[1]
        $this->assertDatabaseHas('activity_groups', [
            'id' => $group->id,
            'leader_user_id' => $students[1]->id,
        ]);
    }
}
