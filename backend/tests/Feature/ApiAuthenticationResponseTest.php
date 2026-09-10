<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiAuthenticationResponseTest extends TestCase
{
    public function test_api_returns_json_401_without_authentication_header(): void
    {
        $response = $this->get('/api/classes');

        $response->assertStatus(401)
            ->assertJson(['message' => 'Não autenticado.']);
    }
}
