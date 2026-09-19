<?php

namespace Tests\Feature;

use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContentResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_announcement_and_event_contracts_are_explicit(): void
    {
        $owner = User::factory()->create(['email' => 'content-owner@anot.test']);
        $schoolClass = SchoolClass::create([
            'code' => 'CNT123',
            'name' => 'Turma de Conteúdo',
            'course' => 'Engenharia',
            'institution' => 'ANOT',
            'period' => '2026.2',
            'modality' => 'presencial',
            'is_open' => true,
            'owner_id' => $owner->id,
        ]);
        $schoolClass->members()->create(['user_id' => $owner->id, 'role' => 'owner', 'joined_at' => now()]);
        $token = $owner->createToken('content-resource-test')->plainTextToken;

        $announcement = $this->withToken($token)
            ->postJson("/api/classes/{$schoolClass->id}/announcements", [
                'title' => 'Aviso explícito',
                'content' => 'Conteúdo do aviso',
                'priority' => 'media',
            ])
            ->assertCreated()
            ->assertJsonStructure(['announcement' => ['id', 'class_id', 'title', 'content', 'priority', 'author_id', 'expires_at']])
            ->json('announcement');

        $this->assertSame($owner->id, $announcement['author_id']);

        $this->withToken($token)
            ->postJson("/api/classes/{$schoolClass->id}/events", [
                'title' => 'Prova explícita',
                'description' => 'Avaliação',
                'event_date' => '2026-10-10',
                'event_time' => '10:00',
                'type' => 'prova',
                'subject' => 'Banco de dados',
                'room' => '101',
            ])
            ->assertCreated()
            ->assertJsonStructure(['event' => ['id', 'class_id', 'title', 'event_date', 'event_time', 'type', 'subject', 'room', 'activity_id', 'created_by']]);
    }
}
