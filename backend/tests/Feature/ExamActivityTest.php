<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\SchoolClass;
use App\Models\ClassMember;
use App\Models\Activity;

class ExamActivityTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_exam_activity_with_format_and_points()
    {
        $owner = User::factory()->create();
        $schoolClass = SchoolClass::create([
            'name' => 'Turma de Provas',
            'code' => 'PRV-101',
            'course' => 'Direito',
            'institution' => 'Uni',
            'period' => '2026.1',
            'modality' => 'presencial',
            'owner_id' => $owner->id,
        ]);

        $response = $this->actingAs($owner)->postJson("/api/classes/{$schoolClass->id}/activities", [
            'title' => 'P1 de Direito Constitucional',
            'type' => 'teste',
            'subject' => 'Direito',
            'due_date' => '2026-06-15',
            'assessment_format' => 'mista',
            'points_value' => 10.0,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('activity.type', 'teste')
            ->assertJsonPath('activity.assessment_format', 'mista')
            ->assertJsonPath('activity.points_value', 10);

        $this->assertDatabaseHas('activities', [
            'title' => 'P1 de Direito Constitucional',
            'type' => 'teste',
            'assessment_format' => 'mista',
            'points_value' => 10.00,
        ]);
    }

    public function test_exam_fields_are_nullified_for_non_exam_types()
    {
        $owner = User::factory()->create();
        $schoolClass = SchoolClass::create([
            'name' => 'Turma de Provas',
            'code' => 'PRV-102',
            'course' => 'Direito',
            'institution' => 'Uni',
            'period' => '2026.1',
            'modality' => 'presencial',
            'owner_id' => $owner->id,
        ]);

        $response = $this->actingAs($owner)->postJson("/api/classes/{$schoolClass->id}/activities", [
            'title' => 'Dever de Casa 1',
            'type' => 'dever',
            'subject' => 'Direito',
            'due_date' => '2026-06-15',
            'assessment_format' => 'fechada',
            'points_value' => 5.0,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('activity.assessment_format', null)
            ->assertJsonPath('activity.points_value', null);
    }
}
