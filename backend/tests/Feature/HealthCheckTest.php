<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_health_endpoint_reports_application_and_database_status(): void
    {
        $response = $this->getJson('/health');

        $response
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('checks.database', 'ok')
            ->assertJsonPath('checks.cache', 'ok');
    }

    public function test_health_endpoint_always_returns_http_200(): void
    {
        $response = $this->get('/health');

        $response->assertStatus(200);
    }
}
