<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;
use Tests\TestCase;

class SystemSchedulerAndObservabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_prune_expired_sanctum_tokens_command_is_executable(): void
    {
        $exitCode = Artisan::call('sanctum:prune-expired', ['--hours' => 720]);

        $this->assertSame(0, $exitCode);
    }

    public function test_api_requests_include_unique_request_id_header_for_observability(): void
    {
        $customRequestId = (string) Str::uuid();

        $response = $this->withHeader('X-Request-ID', $customRequestId)
            ->getJson('/health');

        $response->assertOk()
            ->assertHeader('X-Request-ID', $customRequestId);
    }

    public function test_api_requests_auto_generate_request_id_if_missing(): void
    {
        $response = $this->getJson('/health');

        $response->assertOk();
        $this->assertNotEmpty($response->headers->get('X-Request-ID'));
    }

    public function test_health_check_endpoint_returns_json_observability_schema(): void
    {
        $response = $this->getJson('/health');

        $response->assertOk()
            ->assertJsonStructure([
                'status',
                'version',
                'timestamp',
                'checks' => [
                    'database',
                    'cache',
                ],
            ]);
    }
}
