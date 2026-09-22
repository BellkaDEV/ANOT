<?php

namespace Tests\Feature;

use Illuminate\Support\Str;
use Tests\TestCase;

class ApiErrorContractTest extends TestCase
{
    public function test_unauthenticated_api_error_contains_request_id(): void
    {
        $requestId = (string) Str::uuid();

        $this->withHeader('X-Request-ID', $requestId)
            ->getJson('/api/classes')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Não autenticado.')
            ->assertJsonPath('request_id', $requestId)
            ->assertHeader('X-Request-ID', $requestId);
    }

    public function test_validation_api_error_has_stable_message_errors_and_request_id(): void
    {
        $response = $this->postJson('/api/login', []);

        $response->assertUnprocessable()
            ->assertJsonStructure(['message', 'errors', 'request_id'])
            ->assertJsonPath('message', 'Dados inválidos.')
            ->assertJsonPath('errors.email.0', 'The email field is required.')
            ->assertHeader('X-Request-ID', $response->json('request_id'));
    }
}
