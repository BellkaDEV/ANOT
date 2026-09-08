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

class GroupIntegrityAndAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_member_cannot_list_class_members()
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();

        $schoolClass = SchoolClass::create([
            'name' => 'Física III',
            'course' => 'Engenharia',
            'institution' => 'UF',
            'period' => '2026.1',
            'modality' => 'presencial',
            'code' => 'FIS303',
            'owner_id' => $owner->id,
        ]);

        $response = $this->actingAs($stranger)->getJson("/api/classes/{$schoolClass->id}/members");
        $response->assertStatus(403)
                 ->assertJson(['message' => 'Você não tem permissão para acessar esta turma.']);
    }

    public function test_class_member_can_list_members()
    {
        $owner = User::factory()->create();
        $student = User::factory()->create();

        $schoolClass = SchoolClass::create([
            'name' => 'Física III',
            'course' => 'Engenharia',
            'institution' => 'UF',
            'period' => '2026.1',
            'modality' => 'presencial',
            'code' => 'FIS303',
            'owner_id' => $owner->id,
        ]);

        ClassMember::create([
            'class_id' => $schoolClass->id,
            'user_id' => $student->id,
            'role' => 'student',
        ]);

        $response = $this->actingAs($student)->getJson("/api/classes/{$schoolClass->id}/members");
        $response->assertStatus(200)
                 ->assertJsonStructure(['members']);
    }

    public function test_member_moderation_responses_do_not_expose_email()
    {
        $owner = User::factory()->create();
        $student = User::factory()->create();

        $schoolClass = SchoolClass::create([
            'name' => 'Física III',
            'course' => 'Engenharia',
            'institution' => 'UF',
            'period' => '2026.1',
            'modality' => 'presencial',
            'code' => 'FIS304',
            'owner_id' => $owner->id,
        ]);

        ClassMember::create([
            'class_id' => $schoolClass->id,
            'user_id' => $owner->id,
            'role' => 'owner',
        ]);
        ClassMember::create([
            'class_id' => $schoolClass->id,
            'user_id' => $student->id,
            'role' => 'student',
        ]);

        $promote = $this->actingAs($owner)->putJson("/api/classes/{$schoolClass->id}/members/{$student->id}/promote");
        $promote->assertStatus(200)->assertJsonMissingPath('member.user.email');

        $demote = $this->actingAs($owner)->putJson("/api/classes/{$schoolClass->id}/members/{$student->id}/demote");
        $demote->assertStatus(200)->assertJsonMissingPath('member.user.email');
    }

    public function test_owner_cannot_join_activity_group()
    {
        $owner = User::factory()->create();
        $schoolClass = SchoolClass::create([
            'name' => 'Química',
            'course' => 'Química',
            'institution' => 'UF',
            'period' => '2026.1',
            'modality' => 'presencial',
            'code' => 'QUI101',
            'owner_id' => $owner->id,
        ]);

        $activity = Activity::create([
            'class_id' => $schoolClass->id,
            'title' => 'Lab de Química',
            'type' => 'trabalho',
            'work_mode' => 'groups',
            'group_size' => 2,
            'due_date' => '2026-09-30',
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

    public function test_student_cannot_join_two_groups_in_same_activity()
    {
        $owner = User::factory()->create();
        $student = User::factory()->create();

        $schoolClass = SchoolClass::create([
            'name' => 'Cálculo I',
            'course' => 'Exatas',
            'institution' => 'UF',
            'period' => '2026.1',
            'modality' => 'presencial',
            'code' => 'MAT101',
            'owner_id' => $owner->id,
        ]);

        ClassMember::create([
            'class_id' => $schoolClass->id,
            'user_id' => $student->id,
            'role' => 'student',
        ]);

        $activity = Activity::create([
            'class_id' => $schoolClass->id,
            'title' => 'Trabalho de Cálculo',
            'type' => 'trabalho',
            'work_mode' => 'groups',
            'group_size' => 2,
            'due_date' => '2026-09-30',
            'created_by' => $owner->id,
        ]);

        $groupA = ActivityGroup::create([
            'activity_id' => $activity->id,
            'name' => 'Grupo A',
            'capacity' => 2,
        ]);

        $groupB = ActivityGroup::create([
            'activity_id' => $activity->id,
            'name' => 'Grupo B',
            'capacity' => 2,
        ]);

        // Entra no Grupo A
        $resA = $this->actingAs($student)->postJson("/api/activity-groups/{$groupA->id}/join");
        $resA->assertStatus(200);

        // Tenta entrar no Grupo B
        $resB = $this->actingAs($student)->postJson("/api/activity-groups/{$groupB->id}/join");
        $resB->assertStatus(409)
             ->assertJson(['message' => 'Você já pertence a um grupo nesta atividade.']);
    }

    public function test_group_capacity_limit()
    {
        $owner = User::factory()->create();
        $student1 = User::factory()->create();
        $student2 = User::factory()->create();
        $student3 = User::factory()->create();

        $schoolClass = SchoolClass::create([
            'name' => 'Álgebra',
            'course' => 'Exatas',
            'institution' => 'UF',
            'period' => '2026.1',
            'modality' => 'presencial',
            'code' => 'ALG101',
            'owner_id' => $owner->id,
        ]);

        foreach ([$student1, $student2, $student3] as $s) {
            ClassMember::create(['class_id' => $schoolClass->id, 'user_id' => $s->id, 'role' => 'student']);
        }

        $activity = Activity::create([
            'class_id' => $schoolClass->id,
            'title' => 'Trabalho em Duplas',
            'type' => 'trabalho',
            'work_mode' => 'groups',
            'group_size' => 2,
            'due_date' => '2026-09-30',
            'created_by' => $owner->id,
        ]);

        $group = ActivityGroup::create([
            'activity_id' => $activity->id,
            'name' => 'Dupla Alfa',
            'capacity' => 2,
        ]);

        $this->actingAs($student1)->postJson("/api/activity-groups/{$group->id}/join")->assertStatus(200);
        $this->actingAs($student2)->postJson("/api/activity-groups/{$group->id}/join")->assertStatus(200);

        // Terceiro aluno tenta entrar em grupo com capacidade 2
        $res3 = $this->actingAs($student3)->postJson("/api/activity-groups/{$group->id}/join");
        $res3->assertStatus(422)
             ->assertJson(['message' => 'Este grupo já atingiu a capacidade máxima.']);
    }

    public function test_removed_class_member_loses_group_membership_and_invitations()
    {
        $owner = User::factory()->create();
        $student = User::factory()->create();

        $schoolClass = SchoolClass::create([
            'name' => 'História',
            'course' => 'Humanas',
            'institution' => 'UF',
            'period' => '2026.1',
            'modality' => 'presencial',
            'code' => 'HIS101',
            'owner_id' => $owner->id,
        ]);

        ClassMember::create(['class_id' => $schoolClass->id, 'user_id' => $student->id, 'role' => 'student']);

        $activity = Activity::create([
            'class_id' => $schoolClass->id,
            'title' => 'Seminário',
            'type' => 'trabalho',
            'work_mode' => 'groups',
            'group_size' => 3,
            'due_date' => '2026-09-30',
            'created_by' => $owner->id,
        ]);

        $group = ActivityGroup::create([
            'activity_id' => $activity->id,
            'name' => 'Grupo 1',
            'capacity' => 3,
        ]);

        $this->actingAs($student)->postJson("/api/activity-groups/{$group->id}/join")->assertStatus(200);
        $this->assertDatabaseHas('activity_group_members', ['activity_group_id' => $group->id, 'user_id' => $student->id]);

        // Owner expulsa aluno da turma
        $this->actingAs($owner)->deleteJson("/api/classes/{$schoolClass->id}/members/{$student->id}")->assertStatus(200);

        // Vínculo no grupo deve ser removido automaticamente
        $this->assertDatabaseMissing('activity_group_members', ['activity_group_id' => $group->id, 'user_id' => $student->id]);
    }
}
