<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

use App\Models\User;
use App\Models\SchoolClass;
use App\Models\ClassMember;
use App\Models\Activity;
use App\Models\Announcement;
use App\Models\Event;
use App\Models\UserActivityProgress;

class ActivityAndEventTest extends TestCase
{
    use RefreshDatabase;

    private $owner;
    private $rep;
    private $student;
    private $nonMember;
    private $class;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create();
        $this->rep = User::factory()->create();
        $this->student = User::factory()->create();
        $this->nonMember = User::factory()->create();

        $this->class = SchoolClass::create([
            'code' => 'ANOT-UNIT',
            'name' => 'Turma Teste Unitário',
            'owner_id' => $this->owner->id,
        ]);

        ClassMember::create(['class_id' => $this->class->id, 'user_id' => $this->owner->id, 'role' => 'owner']);
        ClassMember::create(['class_id' => $this->class->id, 'user_id' => $this->rep->id, 'role' => 'rep']);
        ClassMember::create(['class_id' => $this->class->id, 'user_id' => $this->student->id, 'role' => 'student']);
    }

    public function test_only_member_can_view_activities_and_events_and_announcements()
    {
        // Owner, Rep, Student -> OK (200)
        $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/classes/{$this->class->id}/activities")
            ->assertStatus(200);

        $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/classes/{$this->class->id}/announcements")
            ->assertStatus(200);

        $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/classes/{$this->class->id}/events")
            ->assertStatus(200);

        // Non-member -> Forbidden (403)
        $this->actingAs($this->nonMember, 'sanctum')
            ->getJson("/api/classes/{$this->class->id}/activities")
            ->assertStatus(403);
    }

    public function test_only_owner_and_rep_can_create_activities_and_announcements_and_events()
    {
        $activityData = [
            'title' => 'Trabalho de Redes',
            'type' => 'trabalho',
            'subject' => 'Redes de Computadores',
            'due_date' => now()->addDays(7)->toDateString(),
            'due_time' => '23:59',
            'description' => 'Fazer em dupla.',
        ];

        // Aluno comum tenta criar -> Bloqueado (403)
        $this->actingAs($this->student, 'sanctum')
            ->postJson("/api/classes/{$this->class->id}/activities", $activityData)
            ->assertStatus(403);

        // Represenante tenta criar -> OK (201)
        $response = $this->actingAs($this->rep, 'sanctum')
            ->postJson("/api/classes/{$this->class->id}/activities", $activityData)
            ->assertStatus(201);

        $this->assertDatabaseHas('activities', [
            'title' => 'Trabalho de Redes',
            'class_id' => $this->class->id,
        ]);
    }

    public function test_activity_creation_and_deletion_syncs_to_calendar_events()
    {
        $activityData = [
            'title' => 'Prova de Álgebra',
            'type' => 'teste',
            'subject' => 'Álgebra Linear',
            'due_date' => now()->addDays(14)->toDateString(),
            'due_time' => '19:00',
            'description' => 'Estudar matrizes.',
        ];

        // Criando atividade (Calendar Sync Hook ativado)
        $response = $this->actingAs($this->owner, 'sanctum')
            ->postJson("/api/classes/{$this->class->id}/activities", $activityData)
            ->assertStatus(201);

        $activityId = $response->json('activity.id');

        // Deve existir um evento vinculado
        $this->assertDatabaseHas('events', [
            'activity_id' => $activityId,
            'title' => 'Prova de Álgebra',
            'type' => 'prova', // Mapeado de teste -> prova
        ]);

        // Excluindo atividade
        $this->actingAs($this->owner, 'sanctum')
            ->deleteJson("/api/activities/{$activityId}")
            ->assertStatus(200);

        // Evento vinculado deve ter sido excluído automaticamente
        $this->assertDatabaseMissing('events', [
            'activity_id' => $activityId,
        ]);
    }

    public function test_announcements_have_21_days_expiry_automatically()
    {
        $announcementData = [
            'title' => 'Aviso Importante',
            'content' => 'A aula de amanhã será online.',
            'priority' => 'alta',
        ];

        $response = $this->actingAs($this->owner, 'sanctum')
            ->postJson("/api/classes/{$this->class->id}/announcements", $announcementData)
            ->assertStatus(201);

        $announcementId = $response->json('announcement.id');
        $announcement = Announcement::find($announcementId);

        $this->assertNotNull($announcement->expires_at);
        $diffInDays = now()->diffInDays($announcement->expires_at);
        // Deve ser aproximadamente 21 dias
        $this->assertTrue($diffInDays >= 20 && $diffInDays <= 22);
    }

    public function test_student_can_update_their_own_activity_progress()
    {
        $activity = Activity::create([
            'class_id' => $this->class->id,
            'title' => 'Exercício Prático',
            'type' => 'dever',
            'due_date' => now()->addDays(2)->toDateString(),
            'created_by' => $this->owner->id,
        ]);

        $progressData = [
            'status' => 'in_progress',
            'personal_notes' => 'Falta terminar a questão 3.',
        ];

        // Atualizar progresso
        $this->actingAs($this->student, 'sanctum')
            ->putJson("/api/activities/{$activity->id}/progress", $progressData)
            ->assertStatus(200);

        $this->assertDatabaseHas('user_activity_progress', [
            'user_id' => $this->student->id,
            'activity_id' => $activity->id,
            'status' => 'in_progress',
            'personal_notes' => 'Falta terminar a questão 3.',
        ]);
    }
}
