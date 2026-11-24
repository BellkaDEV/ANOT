<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Announcement;
use App\Models\ClassMember;
use App\Models\Event;
use App\Models\SchoolClass;
use App\Models\User;
use App\Models\UserActivityProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademicFeedAndPaginationTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private User $student;

    private User $nonMember;

    private SchoolClass $schoolClass;

    private SchoolClass $otherClass;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['name' => 'Professora Owner']);
        $this->student = User::factory()->create(['name' => 'Aluno Matriculado']);
        $this->nonMember = User::factory()->create(['name' => 'Usuario Externo']);

        $this->schoolClass = SchoolClass::create([
            'code' => 'FEED01',
            'name' => 'Turma Principal do Feed',
            'course' => 'Sistemas',
            'institution' => 'ANOT',
            'is_open' => true,
            'owner_id' => $this->owner->id,
        ]);
        ClassMember::create(['class_id' => $this->schoolClass->id, 'user_id' => $this->owner->id, 'role' => 'owner']);
        ClassMember::create(['class_id' => $this->schoolClass->id, 'user_id' => $this->student->id, 'role' => 'student']);

        $this->otherClass = SchoolClass::create([
            'code' => 'OTHER1',
            'name' => 'Outra Turma Isolada',
            'course' => 'Direito',
            'institution' => 'ANOT',
            'is_open' => true,
            'owner_id' => $this->owner->id,
        ]);
        ClassMember::create(['class_id' => $this->otherClass->id, 'user_id' => $this->owner->id, 'role' => 'owner']);
    }

    public function test_class_feed_endpoint_returns_aggregated_content_for_members(): void
    {
        // 1 aviso ativo e 1 aviso expirado
        Announcement::create([
            'class_id' => $this->schoolClass->id,
            'author_id' => $this->owner->id,
            'title' => 'Aviso Relevante da Semana',
            'content' => 'Lembrem-se da feira academica.',
            'priority' => 'alta',
            'expires_at' => now()->addDays(5),
        ]);
        Announcement::create([
            'class_id' => $this->schoolClass->id,
            'author_id' => $this->owner->id,
            'title' => 'Aviso Antigo Expirado',
            'content' => 'Este aviso ja expirou.',
            'priority' => 'baixa',
            'expires_at' => now()->subDays(2),
        ]);

        // 1 atividade futura e 1 atividade passada
        $actUpcoming = Activity::create([
            'class_id' => $this->schoolClass->id,
            'created_by' => $this->owner->id,
            'title' => 'Trabalho de Modelagem',
            'type' => 'trabalho',
            'subject' => 'Engenharia',
            'due_date' => now()->addDays(3)->toDateString(),
            'due_time' => '14:00',
        ]);
        Activity::create([
            'class_id' => $this->schoolClass->id,
            'created_by' => $this->owner->id,
            'title' => 'Dever do inicio do mes',
            'type' => 'dever',
            'subject' => 'Engenharia',
            'due_date' => now()->subDays(5)->toDateString(),
            'due_time' => '10:00',
        ]);

        // Aluno marca a atividade futura como concluida
        UserActivityProgress::create([
            'activity_id' => $actUpcoming->id,
            'user_id' => $this->student->id,
            'status' => 'done',
        ]);

        // 1 evento futuro avulso
        Event::create([
            'class_id' => $this->schoolClass->id,
            'created_by' => $this->owner->id,
            'title' => 'Palestra de Abertura',
            'type' => 'evento',
            'event_date' => now()->addDays(4)->toDateString(),
            'event_time' => '19:00',
        ]);

        $response = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/classes/{$this->schoolClass->id}/feed");

        $response->assertOk()
            ->assertJsonStructure([
                'class_id',
                'announcements',
                'upcoming_activities',
                'upcoming_events',
                'summary' => [
                    'total_activities',
                    'completed_activities',
                    'pending_activities',
                    'active_announcements',
                    'upcoming_events',
                ],
            ]);

        $json = $response->json();
        $this->assertEquals(1, count($json['announcements']));
        $this->assertEquals('Aviso Relevante da Semana', $json['announcements'][0]['title']);

        $this->assertEquals(1, count($json['upcoming_activities']));
        $this->assertEquals('Trabalho de Modelagem', $json['upcoming_activities'][0]['title']);
        $this->assertEquals('done', $json['upcoming_activities'][0]['user_progress']['status']);

        $this->assertEquals(2, $json['summary']['total_activities']);
        $this->assertEquals(1, $json['summary']['completed_activities']);
        $this->assertEquals(1, $json['summary']['pending_activities']);
        $this->assertEquals(1, $json['summary']['active_announcements']);
    }

    public function test_class_feed_forbidden_for_non_members_and_404_for_missing_class(): void
    {
        $this->actingAs($this->nonMember, 'sanctum')
            ->getJson("/api/classes/{$this->schoolClass->id}/feed")
            ->assertStatus(403);

        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/classes/99999/feed')
            ->assertStatus(404);
    }

    public function test_activities_filtering_and_sorting_without_cross_class_leakage(): void
    {
        $actMath = Activity::create([
            'class_id' => $this->schoolClass->id,
            'created_by' => $this->owner->id,
            'title' => 'Lista Matematica Discreta',
            'type' => 'dever',
            'subject' => 'Matematica',
            'due_date' => now()->addDays(2)->toDateString(),
        ]);

        $actHistory = Activity::create([
            'class_id' => $this->schoolClass->id,
            'created_by' => $this->owner->id,
            'title' => 'Seminario de Historia',
            'type' => 'trabalho',
            'subject' => 'Historia',
            'due_date' => now()->addDays(10)->toDateString(),
        ]);

        // Atividade de outra turma com o mesmo assunto
        Activity::create([
            'class_id' => $this->otherClass->id,
            'created_by' => $this->owner->id,
            'title' => 'Matematica da Outra Turma',
            'type' => 'dever',
            'subject' => 'Matematica',
            'due_date' => now()->addDays(2)->toDateString(),
        ]);

        // 1. Filtro por subject
        $resSubject = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/classes/{$this->schoolClass->id}/activities?subject=Matematica");
        $resSubject->assertOk();
        $this->assertCount(1, $resSubject->json('activities'));
        $this->assertEquals('Lista Matematica Discreta', $resSubject->json('activities.0.title'));

        // 2. Filtro por type
        $resType = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/classes/{$this->schoolClass->id}/activities?type=trabalho");
        $resType->assertOk();
        $this->assertCount(1, $resType->json('activities'));
        $this->assertEquals('Seminario de Historia', $resType->json('activities.0.title'));

        // 3. Filtro por search
        $resSearch = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/classes/{$this->schoolClass->id}/activities?search=Discreta");
        $resSearch->assertOk();
        $this->assertCount(1, $resSearch->json('activities'));

        // 4. Filtro por status de progresso
        UserActivityProgress::create([
            'activity_id' => $actMath->id,
            'user_id' => $this->student->id,
            'status' => 'done',
        ]);

        $resDone = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/classes/{$this->schoolClass->id}/activities?status=done");
        $resDone->assertOk();
        $this->assertCount(1, $resDone->json('activities'));
        $this->assertEquals($actMath->id, $resDone->json('activities.0.id'));

        $resTodo = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/classes/{$this->schoolClass->id}/activities?status=todo");
        $resTodo->assertOk();
        $this->assertCount(1, $resTodo->json('activities'));
        $this->assertEquals($actHistory->id, $resTodo->json('activities.0.id'));
    }

    public function test_activities_pagination_contract(): void
    {
        for ($i = 1; $i <= 5; $i++) {
            Activity::create([
                'class_id' => $this->schoolClass->id,
                'created_by' => $this->owner->id,
                'title' => "Atividade Sequencial {$i}",
                'type' => 'dever',
                'due_date' => now()->addDays($i)->toDateString(),
            ]);
        }

        $responsePage1 = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/classes/{$this->schoolClass->id}/activities?per_page=2&page=1");

        $responsePage1->assertOk()
            ->assertJsonStructure([
                'activities',
                'meta' => [
                    'total',
                    'per_page',
                    'current_page',
                    'last_page',
                    'has_more',
                ],
            ]);

        $this->assertCount(2, $responsePage1->json('activities'));
        $this->assertEquals(5, $responsePage1->json('meta.total'));
        $this->assertEquals(2, $responsePage1->json('meta.per_page'));
        $this->assertEquals(1, $responsePage1->json('meta.current_page'));
        $this->assertEquals(3, $responsePage1->json('meta.last_page'));
        $this->assertTrue($responsePage1->json('meta.has_more'));

        $responsePage3 = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/classes/{$this->schoolClass->id}/activities?per_page=2&page=3");
        $this->assertCount(1, $responsePage3->json('activities'));
        $this->assertFalse($responsePage3->json('meta.has_more'));
    }

    public function test_events_and_announcements_support_filters_and_pagination(): void
    {
        for ($i = 1; $i <= 3; $i++) {
            Announcement::create([
                'class_id' => $this->schoolClass->id,
                'author_id' => $this->owner->id,
                'title' => "Aviso {$i}",
                'content' => "Conteudo do aviso {$i}",
                'priority' => ($i === 1 ? 'alta' : 'baixa'),
                'expires_at' => now()->addDays(10),
            ]);
        }

        $resAnn = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/classes/{$this->schoolClass->id}/announcements?priority=alta");
        $resAnn->assertOk();
        $this->assertCount(1, $resAnn->json('announcements'));
        $this->assertEquals('alta', $resAnn->json('announcements.0.priority'));

        for ($i = 1; $i <= 3; $i++) {
            Event::create([
                'class_id' => $this->schoolClass->id,
                'created_by' => $this->owner->id,
                'title' => "Prova Especial {$i}",
                'type' => 'prova',
                'event_date' => now()->addDays($i)->toDateString(),
            ]);
        }

        $resEvents = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/classes/{$this->schoolClass->id}/events?type=prova&per_page=2&page=1");
        $resEvents->assertOk();
        $this->assertCount(2, $resEvents->json('events'));
        $this->assertEquals(3, $resEvents->json('meta.total'));
    }
}
