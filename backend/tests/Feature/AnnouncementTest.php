<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\SchoolClass;
use App\Models\ClassMember;
use App\Models\Announcement;

class AnnouncementTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_view_announcement_details()
    {
        $owner = User::factory()->create();
        $student = User::factory()->create();

        $schoolClass = SchoolClass::create([
            'name' => 'Turma de Teste',
            'code' => 'TST-001',
            'course' => 'Curso',
            'institution' => 'Inst',
            'period' => '2026.1',
            'modality' => 'presencial',
            'owner_id' => $owner->id,
        ]);

        ClassMember::create([
            'class_id' => $schoolClass->id,
            'user_id' => $student->id,
            'role' => 'student',
        ]);

        $announcement = Announcement::create([
            'class_id' => $schoolClass->id,
            'title' => 'Aviso Importante',
            'content' => 'Este é o conteúdo completo do aviso com detalhes e links.',
            'priority' => 'alta',
            'author_id' => $owner->id,
        ]);

        $response = $this->actingAs($student)->getJson("/api/announcements/{$announcement->id}");

        $response->assertStatus(200)
            ->assertJsonPath('announcement.id', $announcement->id)
            ->assertJsonPath('announcement.content', 'Este é o conteúdo completo do aviso com detalhes e links.');
    }

    public function test_non_member_cannot_view_announcement_details()
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();

        $schoolClass = SchoolClass::create([
            'name' => 'Turma de Teste',
            'code' => 'TST-002',
            'course' => 'Curso',
            'institution' => 'Inst',
            'period' => '2026.1',
            'modality' => 'presencial',
            'owner_id' => $owner->id,
        ]);

        $announcement = Announcement::create([
            'class_id' => $schoolClass->id,
            'title' => 'Aviso Restrito',
            'content' => 'Conteúdo sigiloso da turma.',
            'priority' => 'media',
            'author_id' => $owner->id,
        ]);

        $response = $this->actingAs($stranger)->getJson("/api/announcements/{$announcement->id}");

        $response->assertStatus(403);
    }
}
